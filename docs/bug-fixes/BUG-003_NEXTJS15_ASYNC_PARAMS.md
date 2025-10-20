# BUG-003: Internal Server Error on Job Detail Pages

**Status:** ✅ FIXED
**Severity:** HIGH (Blocks core functionality)
**Date Reported:** 2025-10-20
**Date Fixed:** 2025-10-20
**Fixed In:** Commit `1965d97`

## Summary

Job detail pages (`/jobs/[id]`) were throwing "Internal Server Error" (HTTP 500) when accessed. This was preventing users from viewing job details, logs, progress, and accessing retry/cancel functionality.

## Root Cause

**Next.js 15.5.4 Breaking Change:** Dynamic route parameters in API routes must now be awaited as `Promise<{id: string}>` instead of being accessed synchronously as `{id: string}`.

### Technical Details

In Next.js 15, all dynamic route params are now async promises that must be awaited before use. The old synchronous approach causes runtime errors:

```typescript
// ❌ OLD (Next.js 14 and earlier):
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id  // Works in Next.js 14
}

// ✅ NEW (Next.js 15+):
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Required in Next.js 15
  const jobId = id
}
```

## Error Message

```
Error: Route "/api/jobs/[id]" used `params.id`.
`params` should be awaited before using its properties.
Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

## Files Fixed

### 1. `web-app/src/app/api/jobs/[id]/route.ts`
**Handlers Fixed:** GET, PATCH, DELETE

**Changes:**
- Changed params type from `{ id: string }` to `Promise<{ id: string }>`
- Added `const { id } = await params` at start of each handler
- Replaced all `params.id` with destructured `id` variable

### 2. `web-app/src/app/api/jobs/[id]/cancel/route.ts`
**Handlers Fixed:** POST

**Changes:**
- Changed params type to `Promise<{ id: string }>`
- Added `const { id } = await params`
- Updated all references to use `id` instead of `params.id`

### 3. `web-app/src/app/api/jobs/[id]/retry/route.ts`
**Handlers Fixed:** POST

**Changes:**
- Changed params type to `Promise<{ id: string }>`
- Added `const { id } = await params`
- Updated all references to use `id` instead of `params.id`

## Impact

**Before Fix:**
- ❌ Job detail pages threw HTTP 500 errors
- ❌ Could not view job progress or logs
- ❌ Could not retry or cancel jobs
- ❌ Console filled with sync-dynamic-apis errors

**After Fix:**
- ✅ Job detail pages load successfully
- ✅ All job data displays correctly
- ✅ Retry and cancel actions work
- ✅ No console errors

## Testing Performed

1. **Clean Build Test**
   - Deleted `.next` cache
   - Started fresh dev server
   - ✅ Server compiles without errors

2. **Job Detail Page Test**
   - Accessed `/jobs/[id]` pages
   - ✅ Pages load without 500 errors
   - ✅ Job data displays correctly

3. **API Endpoint Tests**
   - GET `/api/jobs/[id]` - ✅ Works
   - PATCH `/api/jobs/[id]` - ✅ Works
   - DELETE `/api/jobs/[id]` - ✅ Works
   - POST `/api/jobs/[id]/cancel` - ✅ Works
   - POST `/api/jobs/[id]/retry` - ✅ Works

## Prevention

### Next.js 15 Migration Checklist

When migrating to Next.js 15, check ALL dynamic API routes:

```bash
# Find all dynamic API routes that need updating
grep -r "{ params }:" web-app/src/app/api --include="*.ts"
```

**Pattern to look for:**
- Any file in `app/api/[param]/route.ts`
- Any function signature with `{ params }: { params: { ... } }`

**Required changes:**
1. Change type to `Promise<{...}>`
2. Add `const { param } = await params` as first line
3. Replace all `params.param` with destructured variable

### Related Issues

This same pattern must be applied to:
- ✅ `/api/jobs/[id]/*` (fixed in this commit)
- ⚠️ `/api/accounts/[id]/*` (check if exists)
- ⚠️ `/api/contacts/[id]/*` (check if exists)
- ⚠️ Any other dynamic API routes

## References

- **Next.js Docs:** https://nextjs.org/docs/messages/sync-dynamic-apis
- **Commit:** `1965d97`
- **Related Bugs:**
  - BUG-001: Apollo API key save (RLS policy fix)
  - BUG-002: Workspace deletion (RLS policy fix)

## Lessons Learned

1. **Next.js 15 is a breaking change** for dynamic routes
2. **Always test dynamic routes** after Next.js upgrades
3. **Check build warnings** - Next.js warned about this but build succeeded with `ignoreBuildErrors: true`
4. **Runtime errors != build errors** - This passed TypeScript but failed at runtime

## Rollback Plan

If issues arise:

```bash
git revert 1965d97
```

Then restart dev server:
```bash
cd web-app
rm -rf .next
npm run dev
```

However, this is a required fix for Next.js 15 compatibility, so rollback is not recommended.

---

**Bug fixed by:** Claude (Agent)
**Verified by:** Local testing, clean dev server compile
**Deployed:** Pending (fix on F044 branch)
