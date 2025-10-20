# BUG001 Test Verification Steps

## Test Environment Setup

### Prerequisites
1. Local Supabase running: `supabase start`
2. Database reset with fix: `supabase db reset`
3. Next.js dev server running: `npm run dev`
4. User logged in as workspace owner/admin

## Manual Testing Procedure

### Test 1: Save Apollo API Key

**Steps**:
1. Navigate to http://localhost:3000/workspace/settings/api
2. Locate the "Apollo.io API Key" card
3. Enter a test API key: `test-apollo-key-12345`
4. Click "Save" button

**Expected Results**:
- ✅ Success message appears: "API key saved successfully"
- ✅ Badge changes from nothing to "Configured" (green)
- ✅ Input field clears
- ✅ "Test Connection" button becomes enabled
- ✅ "Remove Key" button becomes visible and enabled
- ✅ No error in browser console
- ✅ No error in terminal/server logs

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 2: Update Apollo API Key

**Steps**:
1. With an API key already saved from Test 1
2. Enter a different test key: `updated-key-67890`
3. Click "Save" button

**Expected Results**:
- ✅ Success message appears
- ✅ Key is updated (verified in database)
- ✅ "Configured" badge still shows
- ✅ No errors

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 3: Remove Apollo API Key

**Steps**:
1. With an API key saved
2. Click "Remove Key" button
3. Confirm the removal in the dialog

**Expected Results**:
- ✅ Success message: "API key removed successfully"
- ✅ "Configured" badge disappears
- ✅ "Test Connection" button becomes disabled
- ✅ "Remove Key" button disappears
- ✅ Auto-enrich toggle becomes hidden
- ✅ No errors

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 4: Auto-Enrich Toggle (with API key)

**Steps**:
1. Save an API key
2. Toggle "Auto-Enrich New Records" switch to ON
3. Refresh the page
4. Check if toggle state persists

**Expected Results**:
- ✅ Toggle switches to ON
- ✅ State persists after refresh
- ✅ Database updated (verified with query)
- ✅ No errors

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 5: Test Connection (with valid key)

**Steps**:
1. Save a real Apollo API key (if available)
2. Click "Test Connection" button

**Expected Results**:
- ✅ Success message with credits remaining
- ✅ "Connection successful!" appears
- ✅ No errors

**Actual Results** (if real API key available):
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 6: Test Connection (with invalid key)

**Steps**:
1. Save an invalid/test API key
2. Click "Test Connection" button

**Expected Results**:
- ✅ Error message displayed
- ✅ "Connection failed" or similar message
- ✅ No server crash

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 7: Permissions - Regular Member

**Steps**:
1. Login as a regular workspace member (not admin/owner)
2. Navigate to settings page

**Expected Results**:
- ✅ Cannot access /workspace/settings/api (redirected or 403)
- OR
- ✅ Can view but cannot edit (read-only mode)

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 8: Database Verification

**Steps**:
1. Save an API key through UI
2. Run this query in Supabase SQL Editor:

```sql
SELECT
  workspace_id,
  apollo_api_key_encrypted IS NOT NULL as has_key,
  apollo_auto_enrich,
  enrichment_credits_used,
  created_at,
  updated_at
FROM workspace_settings
WHERE workspace_id = 'YOUR_WORKSPACE_ID';
```

**Expected Results**:
- ✅ `has_key` = true
- ✅ `apollo_api_key_encrypted` contains base64 encoded value
- ✅ `updated_at` is recent

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Test 9: RLS Policy Verification

**Steps**:
Run this query to verify the policy structure:

```sql
SELECT
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'workspace_settings'
  AND policyname = 'Workspace admins can manage settings';
```

**Expected Results**:
- ✅ `cmd` = `ALL`
- ✅ `has_using` = `true`
- ✅ `has_with_check` = `true` ← **This was missing before the fix!**

**Actual Results**:
- [ ] Pass / [ ] Fail
- Query output: _______________

---

### Test 10: Error Handling

**Steps**:
1. Enter an empty API key
2. Click "Save"

**Expected Results**:
- ✅ Save button remains disabled (validation)
- ✅ No API call made

**Actual Results**:
- [ ] Pass / [ ] Fail
- Notes: _______________

---

## Automated Test Ideas

For future implementation:

```typescript
// Example test case
describe('Apollo API Key Management', () => {
  it('should save API key successfully', async () => {
    // Setup: Login as admin
    // Action: Save API key
    // Assert: Success response
    // Assert: Database updated
    // Assert: UI updated
  });

  it('should reject update from non-admin user', async () => {
    // Setup: Login as regular member
    // Action: Attempt to save API key
    // Assert: 403 or similar error
  });

  it('should require WITH CHECK clause in RLS policy', async () => {
    // Query pg_policies
    // Assert: both USING and WITH CHECK exist
  });
});
```

---

## Browser Console Checks

Open browser DevTools (F12) and check:

1. **Network Tab**:
   - POST to `/api/workspace/settings/apollo-key` returns 200
   - Response body: `{ "success": true, "apollo_api_key_configured": true }`

2. **Console Tab**:
   - No errors or warnings
   - Optional: Success logs from service layer

3. **Application Tab** (Storage):
   - Session cookie is present
   - Auth state is valid

---

## Test Results Summary

**Date Tested**: _______________
**Tested By**: _______________
**Environment**: Local / Staging / Production

**Overall Status**: [ ] All Tests Pass / [ ] Some Tests Fail

**Failed Tests**:
- _______________

**Notes**:
- _______________

---

## Regression Testing

After this fix, also test:
- [ ] Other workspace settings still work
- [ ] Other API integrations (if any)
- [ ] Workspace member management
- [ ] Other RLS-protected tables

---

## Sign-off

**Developer**: _______________
**Date**: _______________
**Approved By**: _______________
