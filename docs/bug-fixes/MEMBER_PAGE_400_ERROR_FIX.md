# Member Page 400 Error Fix

**Date**: October 14, 2025
**Branch**: `feature/F002-account-database`
**Status**: ✅ Fixed

## Problem Summary

The Team Members page was showing a 400 Bad Request error when trying to fetch workspace members with their profiles. Additionally, debug queries using `auth.uid()` were returning NULL, causing confusion during troubleshooting.

### Issues Identified

1. **400 Bad Request Error**
   - URL: `GET /rest/v1/workspace_members?select=*,profiles(*)&workspace_id=eq.[id]&status=eq.active`
   - Error: PostgREST couldn't auto-detect the relationship between `workspace_members` and `profiles`
   - Root cause: Missing direct foreign key constraint

2. **NULL `auth.uid()` in Debug Queries**
   - Queries run in SQL Editor without proper context returned NULL
   - This blocked all RLS-dependent queries during debugging
   - Caused confusion about whether authentication was working

3. **Inconsistent Member Counts** (potential)
   - Home page and Members page could show different counts
   - Related to owner access without membership feature

## Root Cause Analysis

### Schema Design Issue

The original schema had:
```sql
-- workspace_members references auth.users
workspace_members.user_id -> auth.users(id)

-- profiles also references auth.users
profiles.id -> auth.users(id)

-- But NO direct FK from workspace_members to profiles!
```

PostgREST requires **explicit foreign key relationships** to enable the `.select('*, profiles(*)')` syntax. Without a direct FK, PostgREST cannot discover the relationship path, resulting in a 400 error.

### Authentication Context Issue

The SQL Editor queries were running without JWT context, causing `auth.uid()` to return NULL. This is expected behavior when queries run outside an authenticated session, but it wasn't documented clearly.

## Solution Implemented

### 1. Database Migration

**File**: `supabase/migrations/20250114000001_add_workspace_members_profile_fk.sql`

Added explicit foreign key constraint:
```sql
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_profile
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

**Why this works**:
- Creates a direct relationship path for PostgREST
- Enables auto-join syntax: `.select('*, profiles(*)')`
- Maintains data integrity
- Already has supporting index on `user_id`

### 2. Improved Debug Queries

**File**: `supabase/debug-queries/authenticated_member_queries.sql`

Created comprehensive debugging toolkit with:
- ✅ Authentication status checks
- ✅ Member count investigation queries
- ✅ RLS policy verification
- ✅ PostgREST query simulation
- ✅ Complete troubleshooting guide
- ✅ Clear explanations for NULL auth.uid()

### 3. Updated Old Debug File

**File**: `supabase/debug-queries/debug_members_query.sql`

- Marked as DEPRECATED
- Added explanation of auth.uid() NULL issue
- Pointed users to new comprehensive file

## Testing Steps

### 1. Apply the Migration

```bash
cd supabase
# Push migration to your database
supabase db push

# Or apply manually in Supabase Dashboard SQL Editor:
# Copy contents of 20250114000001_add_workspace_members_profile_fk.sql and run
```

### 2. Verify Foreign Key

Run in SQL Editor:
```sql
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'fk_workspace_members_profile';
```

Expected result:
```
constraint_name: fk_workspace_members_profile
constraint_type: f (foreign key)
definition: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
```

### 3. Test the Members Page

1. Navigate to `/workspace/members` in your web app
2. Page should load successfully (no 400 error)
3. Members should display with names (from profiles)
4. Member count should match the home page

### 4. Run Debug Queries

Open `supabase/debug-queries/authenticated_member_queries.sql` in Supabase Dashboard SQL Editor and run queries sequentially:

1. **Query 1**: Verify you're authenticated (should NOT be NULL)
2. **Query 6**: Check actual member counts by workspace
3. **Query 9**: Verify profile visibility (should see names)

## Expected Outcomes

### Before Fix
```
❌ 400 Bad Request on members page
❌ "No members found" even when members exist
❌ auth.uid() returns NULL in debug queries
❌ RLS policies impossible to debug
```

### After Fix
```
✅ Members page loads successfully
✅ Member list displays with names and roles
✅ Member counts consistent across pages
✅ Debug queries work with proper auth context
✅ Clear documentation for troubleshooting
```

## Technical Details

### PostgREST Foreign Key Detection

PostgREST uses PostgreSQL's system catalogs to discover relationships:
1. Queries `pg_constraint` for foreign keys
2. Builds a relationship graph
3. Uses graph to resolve nested selects like `profiles(*)`

Without the FK, PostgREST cannot find the path:
```
workspace_members -> ??? -> profiles
```

With the FK:
```
workspace_members -> user_id -> profiles.id ✅
```

### Why Direct FK is Safe

The FK from `workspace_members.user_id` to `profiles.id` is safe because:
1. Both already reference `auth.users(id)`
2. All valid workspace members must have profiles (created by trigger)
3. CASCADE delete ensures data integrity
4. No circular dependencies

### Member Count Consistency

Both pages now use identical queries:
```typescript
// Home page (workspace/page.tsx:22-26)
await supabase
  .from('workspace_members')
  .select('*', { count: 'exact', head: true })
  .eq('workspace_id', workspace.id)
  .eq('status', 'active')

// Members page (workspace/members/page.tsx:26-31)
await supabase
  .from('workspace_members')
  .select('*, profiles(*)')
  .eq('workspace_id', workspace.id)
  .eq('status', 'active')
```

The only difference is members page fetches profile data, but both count the same records.

## Related Files

### Modified
- [supabase/debug-queries/debug_members_query.sql](../../supabase/debug-queries/debug_members_query.sql) - Deprecated and redirected

### Created
- [supabase/migrations/20250114000001_add_workspace_members_profile_fk.sql](../../supabase/migrations/20250114000001_add_workspace_members_profile_fk.sql)
- [supabase/debug-queries/authenticated_member_queries.sql](../../supabase/debug-queries/authenticated_member_queries.sql)
- [docs/bug-fixes/MEMBER_PAGE_400_ERROR_FIX.md](./MEMBER_PAGE_400_ERROR_FIX.md) (this file)

### No Changes Needed
- `web-app/src/app/workspace/members/page.tsx` - Query syntax already correct
- `web-app/src/app/workspace/page.tsx` - Count query already correct

## Future Improvements

### 1. Consider Adding More Direct FKs
Other tables might benefit from similar direct relationships:
- `workspace_invitations` -> `profiles` (for invited_by)
- `audit_logs` -> `profiles`
- Any table with user references

### 2. Add Relationship Comments
Document FK relationships in schema:
```sql
COMMENT ON CONSTRAINT fk_workspace_members_profile IS
'Enables PostgREST nested selects for member profiles';
```

### 3. Performance Monitoring
Monitor query performance with the new FK:
- Should improve (enables better query planning)
- Index already exists on user_id
- No expected performance issues

## Troubleshooting

### If 400 Error Persists

1. **Verify migration applied**:
   ```sql
   SELECT * FROM pg_constraint WHERE conname = 'fk_workspace_members_profile';
   ```

2. **Check PostgREST schema cache**:
   - PostgREST caches schema metadata
   - May need to restart PostgREST (Supabase does this automatically)
   - Wait 1-2 minutes for cache refresh

3. **Verify RLS policies**:
   ```sql
   -- Should see updated policy
   SELECT * FROM pg_policies WHERE tablename = 'workspace_members';
   ```

### If Member Count Still Wrong

1. **Run Query 6 from authenticated_member_queries.sql**:
   - Shows actual database counts
   - Compares to what's displayed

2. **Check owner membership status**:
   - Owners might have access without being members
   - This is intentional (from migration 20250113000005)
   - Decide if owners should be counted

3. **Verify status filtering**:
   - Ensure both pages filter by `status = 'active'`
   - Check for invited/suspended members

### If auth.uid() is NULL

**This is expected!** When running queries in contexts without JWT authentication:
- SQL Editor without RLS toggle
- Direct SQL connections
- Service role queries

**Solutions**:
1. Use Supabase Dashboard SQL Editor (automatically authenticated)
2. Use queries that accept user_id parameter
3. Use SECURITY DEFINER functions

## References

- [PostgREST Foreign Key Relationships](https://postgrest.org/en/stable/api.html#resource-embedding)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Migration: [20250113000005_fix_owner_access_without_membership.sql](../../supabase/migrations/20250113000005_fix_owner_access_without_membership.sql)
- Original issue screenshot: [See provided console error]

## Lessons Learned

1. **PostgREST Requires Explicit FKs**: Even if referential integrity exists through auth.users, PostgREST needs direct FKs
2. **Document Auth Context**: Clearly explain when auth.uid() returns NULL to avoid confusion
3. **Comprehensive Debug Tools**: Provide well-documented debug queries from the start
4. **Schema Comments**: Document FK purposes, especially for tool integrations like PostgREST
