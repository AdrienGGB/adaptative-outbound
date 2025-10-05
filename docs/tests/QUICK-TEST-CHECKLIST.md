# F004 Workspace Creation - Quick Test Checklist

## Before You Start

1. Open browser to http://localhost:3000
2. Open browser console (F12 > Console)
3. Have Supabase Studio ready: http://127.0.0.1:54333

---

## Test 1: New User Signup (5 mins)

**In Incognito Window:**

1. ✅ Go to http://localhost:3000
2. ✅ Click "Sign up"
3. ✅ Fill form:
   - Name: Test User 2
   - Email: testuser2@example.com
   - Password: Test1234!
4. ✅ Submit
5. ✅ Should see: workspace page with "testuser2's Workspace"
6. ✅ Role badge should show: Admin (red)
7. ✅ Member count should show: 1

**Check Console:**
- No errors ✅
- Success messages ✅

**Check Supabase Studio:**
- Authentication > Users: testuser2@example.com exists ✅
- Table Editor > workspaces: workspace exists ✅
- Table Editor > workspace_members: user is admin ✅

---

## Test 2: Create Additional Workspace (3 mins)

**While Logged In:**

1. ✅ Click workspace name in header
2. ✅ Click "Create Workspace"
3. ✅ Enter name: "Sales Team 2024"
4. ✅ Click "Create Workspace"
5. ✅ Should redirect to workspace page
6. ✅ Current workspace should be "Sales Team 2024"
7. ✅ Role: Admin, Members: 1

**Check Console:**
```
Auth check: { user: 'xxx', userError: null }
Calling create_workspace_with_owner function: { ... }
Workspace created with ID: xxx
```
- No errors ✅

---

## Test 3: Switch Workspaces (2 mins)

1. ✅ Click workspace dropdown
2. ✅ Should see both workspaces
3. ✅ Current workspace has checkmark
4. ✅ Each shows Admin badge (red)
5. ✅ Click other workspace
6. ✅ Page updates to show selected workspace
7. ✅ Open dropdown again - checkmark moved

---

## Test 4: Error Cases (3 mins)

**Empty Name:**
1. ✅ Go to Create Workspace
2. ✅ Leave name empty
3. ✅ Submit
4. ✅ Error toast: "Workspace name is required"

**Unauthenticated:**
1. ✅ Logout
2. ✅ Go to http://localhost:3000/workspace/create
3. ✅ Redirects to /login

---

## Quick Database Checks

**In Docker:**

```bash
# Check everything is consistent
docker exec -i supabase_db_Adaptive_Outbound psql -U postgres -d postgres -c "
SELECT
  (SELECT COUNT(*) FROM auth.users) as users,
  (SELECT COUNT(*) FROM workspaces) as workspaces,
  (SELECT COUNT(*) FROM workspace_members) as memberships;
"
```

Expected: memberships = workspaces ✅

---

## Success Criteria

- ✅ All tests pass
- ✅ No console errors
- ✅ Database consistent
- ✅ UI updates correctly
- ✅ Role badges show correctly

**Total Time:** ~15 minutes

---

## If Something Fails

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify Supabase is running: `supabase status`
4. Check database with SQL queries in main test report
5. Look for error toasts and note exact message

---

## Report Results

After testing, update the main test report:
`F004-WORKSPACE-CREATION-TEST-REPORT.md`

Change status from:
- ⏳ PENDING → ✅ PASSED or ❌ FAILED

Document any issues found in Part 4: Issues Found
