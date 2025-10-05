# F004 Authentication Testing Guide

## Test Environment Setup

### Prerequisites

1. **Start Supabase:**
   ```bash
   cd /Users/adriengaignebet/Documents/Tech/Adaptive\ Outbound
   supabase start
   ```

2. **Start Web App:**
   ```bash
   cd web-app
   npm run dev
   ```

3. **Access Points:**
   - Supabase Studio: http://127.0.0.1:54333
   - Web App: http://localhost:3000
   - Supabase API: http://127.0.0.1:54321

4. **Browser Setup:**
   - Open Chrome/Firefox in incognito mode for clean testing
   - Open DevTools (Console + Network tabs)
   - Clear all cookies and localStorage before each test run

---

## Test Suite 1: Email/Password Authentication

### Test 1.1: New User Signup

**Test ID:** AUTH-001
**Priority:** Critical
**Type:** End-to-End

**Steps:**
1. Open http://localhost:3000 in incognito window
2. Should auto-redirect to `/login`
3. Click "Sign up" link
4. Fill signup form:
   - Full Name: `Test User Alpha`
   - Email: `alpha@test.local`
   - Password: `Alpha1234`
   - Confirm Password: `Alpha1234`
   - Check "I agree to terms"
5. Click "Sign up" button
6. Wait for processing

**Expected Results:**
- ✅ Success toast: "Account created successfully!"
- ✅ Automatic redirect to `/workspace`
- ✅ Workspace header shows: "Test User Alpha's Workspace"
- ✅ Role badge shows: "Admin" (red badge)
- ✅ Member count shows: "1"
- ✅ User avatar/name in top-right corner
- ✅ No errors in browser console

**Database Verification:**
```sql
-- Check user created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'alpha@test.local';

-- Check profile auto-created
SELECT id, full_name, email, avatar_url, created_at
FROM profiles
WHERE email = 'alpha@test.local';

-- Check workspace auto-created
SELECT w.id, w.name, w.created_by, w.created_at
FROM workspaces w
WHERE w.created_by = (SELECT id FROM auth.users WHERE email = 'alpha@test.local');

-- Check membership auto-created as Admin
SELECT wm.role, wm.status, w.name as workspace_name
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'alpha@test.local');
```

**Expected Database State:**
- User exists in `auth.users`
- Profile exists with matching `full_name` and `email`
- Workspace exists with name "Test User Alpha's Workspace"
- Membership exists with role = 'admin' and status = 'active'

**Cleanup:**
```sql
-- Delete test user (cascade will clean up profile, workspace, membership)
DELETE FROM auth.users WHERE email = 'alpha@test.local';
```

---

### Test 1.2: Duplicate Email Signup

**Test ID:** AUTH-002
**Priority:** High
**Type:** Validation

**Precondition:** User `alpha@test.local` exists from Test 1.1

**Steps:**
1. Go to `/signup`
2. Fill form with same email:
   - Full Name: `Test User Duplicate`
   - Email: `alpha@test.local`
   - Password: `Duplicate1234`
   - Confirm Password: `Duplicate1234`
3. Click "Sign up"

**Expected Results:**
- ✅ Error toast: "User already registered"
- ✅ Stay on signup page
- ✅ Form not cleared
- ✅ No new user created

**Database Verification:**
```sql
-- Should still be only 1 user
SELECT COUNT(*) FROM auth.users WHERE email = 'alpha@test.local';
-- Expected: 1
```

---

### Test 1.3: Password Validation - Too Short

**Test ID:** AUTH-003
**Priority:** Medium
**Type:** Client-Side Validation

**Steps:**
1. Go to `/signup`
2. Enter password: `Test1` (6 characters)
3. Observe validation feedback

**Expected Results:**
- ✅ Red X next to "At least 8 characters"
- ✅ Other requirements not met
- ✅ Submit button disabled
- ✅ Cannot submit form

---

### Test 1.4: Password Validation - Missing Uppercase

**Test ID:** AUTH-004
**Priority:** Medium
**Type:** Client-Side Validation

**Steps:**
1. Go to `/signup`
2. Enter password: `testing123` (no uppercase)

**Expected Results:**
- ✅ Green check: "At least 8 characters"
- ✅ Green check: "Contains a number"
- ✅ Red X: "Contains an uppercase letter"
- ✅ Submit button disabled

---

### Test 1.5: Password Validation - All Requirements Met

**Test ID:** AUTH-005
**Priority:** Medium
**Type:** Client-Side Validation

**Steps:**
1. Go to `/signup`
2. Enter password: `Testing123`

**Expected Results:**
- ✅ All three requirements show green checks:
  - "At least 8 characters" ✓
  - "Contains an uppercase letter" ✓
  - "Contains a number" ✓
- ✅ Submit button enabled

---

### Test 1.6: Password Mismatch

**Test ID:** AUTH-006
**Priority:** High
**Type:** Validation

**Steps:**
1. Go to `/signup`
2. Password: `Testing123`
3. Confirm Password: `Testing456`
4. Try to submit

**Expected Results:**
- ✅ Error message: "Passwords must match"
- ✅ Submit button disabled or shows error
- ✅ Cannot submit form

---

### Test 1.7: Login with Valid Credentials

**Test ID:** AUTH-007
**Priority:** Critical
**Type:** End-to-End

**Precondition:** User `alpha@test.local` exists

**Steps:**
1. Logout if logged in
2. Go to `/login`
3. Enter:
   - Email: `alpha@test.local`
   - Password: `Alpha1234`
4. Click "Sign in"

**Expected Results:**
- ✅ Success toast: "Signed in successfully!"
- ✅ Redirect to `/workspace`
- ✅ Correct user name displayed
- ✅ Correct workspace displayed
- ✅ Session persisted (check browser storage)

---

### Test 1.8: Login with Invalid Password

**Test ID:** AUTH-008
**Priority:** High
**Type:** Error Handling

**Steps:**
1. Go to `/login`
2. Enter:
   - Email: `alpha@test.local`
   - Password: `WrongPassword123`
3. Click "Sign in"

**Expected Results:**
- ✅ Error toast: "Invalid login credentials"
- ✅ Stay on login page
- ✅ Email field not cleared (keeps value)
- ✅ Password field cleared for security
- ✅ No session created

---

### Test 1.9: Login with Non-Existent Email

**Test ID:** AUTH-009
**Priority:** Medium
**Type:** Error Handling

**Steps:**
1. Go to `/login`
2. Enter:
   - Email: `nonexistent@test.local`
   - Password: `Test1234`
3. Click "Sign in"

**Expected Results:**
- ✅ Error toast: "Invalid login credentials"
- ✅ No information leak about whether email exists

---

### Test 1.10: Terms and Conditions Checkbox

**Test ID:** AUTH-010
**Priority:** Medium
**Type:** Validation

**Steps:**
1. Go to `/signup`
2. Fill all fields correctly
3. Do NOT check terms checkbox
4. Try to submit

**Expected Results:**
- ✅ Submit button disabled OR
- ✅ Error message: "You must agree to the terms"
- ✅ Cannot submit without checking

---

## Test Suite 2: Workspace Management

### Test 2.1: Auto-Created Workspace Name

**Test ID:** WORKSPACE-001
**Priority:** High
**Type:** Business Logic

**Steps:**
1. Signup with name: `John Smith`
2. Email: `john.smith@test.local`

**Expected Results:**
- ✅ Workspace created with name: "John Smith's Workspace"
- ✅ Visible in workspace switcher dropdown

---

### Test 2.2: Create Additional Workspace

**Test ID:** WORKSPACE-002
**Priority:** Critical
**Type:** End-to-End

**Precondition:** Logged in as `alpha@test.local`

**Steps:**
1. Click workspace name in header
2. Dropdown appears
3. Click "Create Workspace" button
4. Fill form:
   - Name: `Sales Team Q4 2025`
   - Description: `Enterprise sales team for Q4`
5. Click "Create Workspace"

**Expected Results:**
- ✅ Success toast: "Workspace created successfully!"
- ✅ Redirect to new workspace
- ✅ Header shows: "Sales Team Q4 2025"
- ✅ Role badge: Admin (red)
- ✅ Member count: 1
- ✅ Workspace switcher now shows both workspaces

**Database Verification:**
```sql
-- Check workspace created
SELECT * FROM workspaces
WHERE name = 'Sales Team Q4 2025';

-- Check user is admin
SELECT role FROM workspace_members
WHERE workspace_id = (SELECT id FROM workspaces WHERE name = 'Sales Team Q4 2025')
AND user_id = (SELECT id FROM auth.users WHERE email = 'alpha@test.local');
```

---

### Test 2.3: Switch Between Workspaces

**Test ID:** WORKSPACE-003
**Priority:** Critical
**Type:** End-to-End

**Precondition:** User has 2+ workspaces

**Steps:**
1. Currently in "Sales Team Q4 2025"
2. Click workspace name dropdown
3. Click on "Test User Alpha's Workspace"

**Expected Results:**
- ✅ Header updates to "Test User Alpha's Workspace"
- ✅ Page refreshes/updates
- ✅ Member count updates (if different)
- ✅ Checkmark appears next to selected workspace in dropdown
- ✅ localStorage updated with workspace ID

**Technical Verification:**
```javascript
// In browser console
localStorage.getItem('currentWorkspaceId')
// Should match the selected workspace ID
```

---

### Test 2.4: Workspace Persistence After Logout/Login

**Test ID:** WORKSPACE-004
**Priority:** Medium
**Type:** Session Management

**Precondition:** User has multiple workspaces, currently in "Sales Team Q4 2025"

**Steps:**
1. Logout
2. Login again
3. Observe which workspace loads

**Expected Results:**
- ✅ Redirected to last active workspace ("Sales Team Q4 2025")
- ✅ Workspace selection persists across sessions

---

### Test 2.5: Workspace Settings (Admin Only)

**Test ID:** WORKSPACE-005
**Priority:** High
**Type:** Access Control

**Precondition:** Logged in as Admin

**Steps:**
1. Go to `/workspace/settings`

**Expected Results:**
- ✅ Can access settings page
- ✅ See workspace name field
- ✅ See description field
- ✅ See "Update Workspace" button
- ✅ See "Delete Workspace" button (danger zone)

---

### Test 2.6: Update Workspace Name

**Test ID:** WORKSPACE-006
**Priority:** Medium
**Type:** CRUD Operation

**Precondition:** Logged in as Admin

**Steps:**
1. Go to `/workspace/settings`
2. Change name to: `Updated Workspace Name`
3. Click "Update Workspace"

**Expected Results:**
- ✅ Success toast: "Workspace updated successfully!"
- ✅ Header updates to show new name
- ✅ Workspace switcher shows new name

**Database Verification:**
```sql
SELECT name FROM workspaces WHERE id = '[workspace-id]';
```

---

## Test Suite 3: Team Invitations

### Test 3.1: Create Invitation as Admin

**Test ID:** INVITE-001
**Priority:** Critical
**Type:** End-to-End

**Precondition:** Logged in as Admin in workspace "Sales Team Q4 2025"

**Steps:**
1. Go to `/workspace/members`
2. Click "Invite Member" button
3. Fill form:
   - Email: `sdr.bob@test.local`
   - Role: SDR
4. Click "Create Invitation"

**Expected Results:**
- ✅ Success toast: "Invitation created for sdr.bob@test.local"
- ✅ Dialog shows invitation link
- ✅ Invitation link format: `http://localhost:3000/invitations/[32-char-token]`
- ✅ "Copy" button appears
- ✅ Expiration message: "This link will expire in 7 days"

**Database Verification:**
```sql
SELECT id, email, role, token, expires_at, invited_by
FROM workspace_invitations
WHERE email = 'sdr.bob@test.local';

-- Check token length
SELECT LENGTH(token) FROM workspace_invitations WHERE email = 'sdr.bob@test.local';
-- Expected: 32
```

**Save the invitation link for next tests!**

---

### Test 3.2: Copy Invitation Link

**Test ID:** INVITE-002
**Priority:** Medium
**Type:** User Interaction

**Precondition:** Invitation dialog open from Test 3.1

**Steps:**
1. Click "Copy" button

**Expected Results:**
- ✅ Success toast: "Invitation link copied to clipboard!"
- ✅ Icon changes from Copy to CheckCircle
- ✅ Icon reverts after 2 seconds
- ✅ Can paste link from clipboard

---

### Test 3.3: Prevent Duplicate Invitations

**Test ID:** INVITE-003
**Priority:** High
**Type:** Validation

**Precondition:** Invitation for `sdr.bob@test.local` already exists

**Steps:**
1. Go to `/workspace/members`
2. Click "Invite Member"
3. Try to invite same email:
   - Email: `sdr.bob@test.local`
   - Role: AE
4. Click "Create Invitation"

**Expected Results:**
- ✅ Error message: "This email has already been invited."
- ✅ No new invitation created
- ✅ Stay in dialog

**Database Verification:**
```sql
-- Should still be only 1 invitation
SELECT COUNT(*) FROM workspace_invitations WHERE email = 'sdr.bob@test.local';
-- Expected: 1
```

---

### Test 3.4: Accept Invitation - New User Flow

**Test ID:** INVITE-004
**Priority:** Critical
**Type:** End-to-End

**Precondition:** Have invitation link from Test 3.1

**Steps:**
1. Open new incognito window
2. Paste invitation link
3. Page loads showing invitation details
4. Observe UI:
   - Blue mail icon
   - Title: "You've Been Invited!"
   - Workspace: "Sales Team Q4 2025"
   - Invited by: "Test User Alpha"
   - Role badge: SDR (green)
5. Click "Sign up to accept" button
6. Redirected to signup page with redirectTo parameter
7. Fill signup form:
   - Full Name: `Bob SDR`
   - Email: `sdr.bob@test.local`
   - Password: `BobSDR123`
   - Confirm: `BobSDR123`
   - Check terms
8. Click "Sign up"

**Expected Results:**
- ✅ Account created
- ✅ Redirect to `/invitations/[token]` (from redirectTo)
- ✅ Invitation auto-accepted
- ✅ Redirect to `/workspace`
- ✅ Now in "Sales Team Q4 2025" workspace
- ✅ Role badge shows: SDR (green)
- ✅ Member count now: 2

**Database Verification:**
```sql
-- Check user created
SELECT * FROM auth.users WHERE email = 'sdr.bob@test.local';

-- Check profile created
SELECT * FROM profiles WHERE email = 'sdr.bob@test.local';

-- Check added to workspace with SDR role
SELECT wm.role, w.name
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'sdr.bob@test.local')
AND w.name = 'Sales Team Q4 2025';
-- Expected role: sdr

-- Check invitation deleted
SELECT * FROM workspace_invitations WHERE email = 'sdr.bob@test.local';
-- Expected: No rows

-- Check user has OWN default workspace too
SELECT COUNT(*) FROM workspaces WHERE created_by = (SELECT id FROM auth.users WHERE email = 'sdr.bob@test.local');
-- Expected: 1 (Bob SDR's Workspace)
```

---

### Test 3.5: Accept Invitation - Existing User Flow

**Test ID:** INVITE-005
**Priority:** Critical
**Type:** End-to-End

**Precondition:**
- Create new invitation for `alpha@test.local` to different workspace
- User `alpha@test.local` already exists

**Setup:**
1. Create user `charlie@test.local` with workspace "Charlie's Workspace"
2. As Charlie, invite `alpha@test.local` as Sales Manager

**Steps:**
1. Logout
2. Login as `alpha@test.local`
3. Paste invitation link
4. See invitation page with "ready to accept" state
5. Click "Accept Invitation"

**Expected Results:**
- ✅ Toast: "You've joined Charlie's Workspace!"
- ✅ Redirect to `/workspace`
- ✅ Workspace switcher now shows 3 workspaces:
  - Test User Alpha's Workspace
  - Sales Team Q4 2025
  - Charlie's Workspace (current)
- ✅ Role badge: Sales Manager (blue)
- ✅ Can switch between all workspaces

**Database Verification:**
```sql
-- Check user has membership in Charlie's workspace
SELECT wm.role
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'alpha@test.local')
AND w.name = 'Charlie\'s Workspace';
-- Expected role: sales_manager

-- Check invitation deleted
SELECT * FROM workspace_invitations WHERE email = 'alpha@test.local' AND workspace_id = (SELECT id FROM workspaces WHERE name = 'Charlie\'s Workspace');
-- Expected: No rows
```

---

### Test 3.6: Invalid Invitation Token

**Test ID:** INVITE-006
**Priority:** High
**Type:** Error Handling

**Steps:**
1. Visit: `http://localhost:3000/invitations/invalid-token-12345678901234567890`

**Expected Results:**
- ✅ Red X icon
- ✅ Title: "Invalid Invitation"
- ✅ Alert: "This invitation link is invalid or has been revoked."
- ✅ Button: "Go to Workspace"

---

### Test 3.7: Expired Invitation

**Test ID:** INVITE-007
**Priority:** High
**Type:** Business Logic

**Setup:**
```sql
-- Manually expire an invitation
UPDATE workspace_invitations
SET expires_at = NOW() - INTERVAL '1 day'
WHERE email = 'expired@test.local';
```

**Steps:**
1. Visit invitation link with expired token

**Expected Results:**
- ✅ Red X icon
- ✅ Title: "Invalid Invitation"
- ✅ Alert: "This invitation has expired."
- ✅ Cannot accept invitation

---

### Test 3.8: Already Member - Try to Accept Invitation

**Test ID:** INVITE-008
**Priority:** Medium
**Type:** Edge Case

**Precondition:** User is already a member of workspace

**Steps:**
1. Create invitation for existing member
2. As that member, visit invitation link

**Expected Results:**
- ✅ Green check icon
- ✅ Title: "Already a Member"
- ✅ Message: "You're already part of this workspace"
- ✅ Button: "Go to Workspace"

---

### Test 3.9: Decline Invitation

**Test ID:** INVITE-009
**Priority:** Medium
**Type:** User Choice

**Precondition:** Have valid invitation link, logged in

**Steps:**
1. Visit invitation link
2. Click "Decline" button

**Expected Results:**
- ✅ Toast: "Invitation declined"
- ✅ Redirect to `/workspace`
- ✅ Not added to workspace

**Database Verification:**
```sql
-- Invitation should be deleted
SELECT * FROM workspace_invitations WHERE token = '[declined-token]';
-- Expected: No rows

-- User should NOT be member
SELECT * FROM workspace_members WHERE user_id = '[user-id]' AND workspace_id = '[workspace-id]';
-- Expected: No rows
```

---

### Test 3.10: Invitation - Not Logged In Flow

**Test ID:** INVITE-010
**Priority:** High
**Type:** User Flow

**Steps:**
1. Logout completely
2. Visit invitation link
3. See "not logged in" state

**Expected Results:**
- ✅ Blue mail icon
- ✅ Title: "You've Been Invited!"
- ✅ Shows workspace name
- ✅ Shows inviter name
- ✅ Shows role badge
- ✅ Two buttons:
  - "Sign In"
  - "Create Account"
- ✅ Both buttons have `?redirectTo=/invitations/[token]` parameter

**Steps (continued):**
4. Click "Sign In"
5. Redirected to `/login?redirectTo=/invitations/[token]`

**Expected Results:**
- ✅ After login, redirected back to invitation page
- ✅ Now shows "ready to accept" state

---

## Test Suite 4: Role-Based Access Control (RBAC)

### Test 4.1: Admin Can Access Settings

**Test ID:** RBAC-001
**Priority:** Critical
**Type:** Authorization

**Precondition:** Logged in as Admin

**Steps:**
1. Navigate to `/workspace/settings`

**Expected Results:**
- ✅ Page loads successfully
- ✅ Can see all settings fields
- ✅ Can edit workspace name
- ✅ Can see "Delete Workspace" button

---

### Test 4.2: Non-Admin Cannot Access Settings

**Test ID:** RBAC-002
**Priority:** Critical
**Type:** Authorization

**Precondition:** Logged in as SDR

**Steps:**
1. Try to navigate to `/workspace/settings`

**Expected Results:**
- ✅ Access denied OR
- ✅ Redirected to `/workspace` OR
- ✅ Error message: "You don't have permission to access this page"
- ✅ Cannot see settings

**Implementation Note:** If not yet implemented, create protected route middleware.

---

### Test 4.3: Admin Can Invite Members

**Test ID:** RBAC-003
**Priority:** High
**Type:** Authorization

**Precondition:** Logged in as Admin

**Steps:**
1. Go to `/workspace/members`

**Expected Results:**
- ✅ "Invite Member" button visible
- ✅ Can click and open dialog
- ✅ Can create invitations

---

### Test 4.4: Non-Admin Cannot Invite (Optional)

**Test ID:** RBAC-004
**Priority:** Medium
**Type:** Authorization

**Precondition:** Logged in as SDR

**Steps:**
1. Go to `/workspace/members`

**Expected Results:**
**Option A (Strict):**
- ✅ "Invite Member" button hidden OR disabled

**Option B (Permissive - current):**
- ✅ Button visible but only Admins/Managers can invite
- ✅ Or all roles can invite (business decision)

**Implementation Note:** Define in business requirements who can invite.

---

### Test 4.5: Admin Can Change Member Roles

**Test ID:** RBAC-005
**Priority:** High
**Type:** Authorization

**Precondition:** Logged in as Admin, workspace has multiple members

**Steps:**
1. Go to `/workspace/members`
2. Find an SDR member
3. Click role dropdown
4. Select "Sales Manager"
5. Confirm change

**Expected Results:**
- ✅ Success toast: "Role updated successfully"
- ✅ Badge changes from green (SDR) to blue (Sales Manager)
- ✅ Member sees their role updated immediately

**Database Verification:**
```sql
UPDATE workspace_members
SET role = 'sales_manager'
WHERE id = '[member-id]';

-- Verify
SELECT role FROM workspace_members WHERE id = '[member-id]';
-- Expected: sales_manager
```

---

### Test 4.6: Non-Admin Cannot Change Roles

**Test ID:** RBAC-006
**Priority:** High
**Type:** Authorization

**Precondition:** Logged in as SDR

**Steps:**
1. Go to `/workspace/members`
2. Look for role dropdown or edit buttons

**Expected Results:**
- ✅ Role displayed as read-only badge
- ✅ No dropdown or edit capability
- ✅ Cannot modify other members' roles

---

### Test 4.7: Admin Can Remove Members

**Test ID:** RBAC-007
**Priority:** High
**Type:** Authorization

**Precondition:** Logged in as Admin

**Steps:**
1. Go to `/workspace/members`
2. Find a member (not yourself)
3. Click "Remove" button
4. Confirm in dialog

**Expected Results:**
- ✅ Confirmation dialog: "Are you sure you want to remove [name]?"
- ✅ After confirm: Success toast
- ✅ Member removed from list
- ✅ Member count decreases by 1

**Database Verification:**
```sql
-- Member should be removed (or status = 'inactive')
SELECT * FROM workspace_members WHERE id = '[member-id]';
-- Expected: No rows OR status = 'inactive'
```

---

### Test 4.8: Cannot Remove Self

**Test ID:** RBAC-008
**Priority:** Medium
**Type:** Business Logic

**Precondition:** Logged in as Admin

**Steps:**
1. Go to `/workspace/members`
2. Find your own member entry

**Expected Results:**
- ✅ "Remove" button is disabled OR hidden for your own entry
- ✅ OR error if attempted: "You cannot remove yourself"

---

### Test 4.9: Role Badge Colors

**Test ID:** RBAC-009
**Priority:** Low
**Type:** UI/UX

**Steps:**
1. View members page with all 4 roles

**Expected Results:**
- ✅ Admin: Red badge
- ✅ Sales Manager: Blue badge
- ✅ SDR: Green badge
- ✅ AE: Purple badge

---

## Test Suite 5: Protected Routes

### Test 5.1: Unauthenticated Access to Protected Route

**Test ID:** AUTH-ROUTE-001
**Priority:** Critical
**Type:** Security

**Precondition:** Not logged in

**Steps:**
1. Clear all cookies and localStorage
2. Visit `http://localhost:3000/workspace` directly

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ URL becomes: `/login?redirectTo=/workspace`
- ✅ Cannot access workspace without authentication

---

### Test 5.2: Post-Login Redirect

**Test ID:** AUTH-ROUTE-002
**Priority:** High
**Type:** User Flow

**Precondition:** From Test 5.1

**Steps:**
1. From `/login?redirectTo=/workspace`
2. Login with valid credentials

**Expected Results:**
- ✅ After successful login, redirected to `/workspace` (the original destination)
- ✅ Not redirected to default `/workspace` then to intended page
- ✅ Seamless user experience

---

### Test 5.3: Authenticated User on Auth Pages

**Test ID:** AUTH-ROUTE-003
**Priority:** Medium
**Type:** User Flow

**Precondition:** Logged in

**Steps:**
1. Visit `/login` directly

**Expected Results:**
- ✅ Redirected to `/workspace`
- ✅ Cannot access login page while logged in

**Steps (continued):**
2. Visit `/signup` directly

**Expected Results:**
- ✅ Redirected to `/workspace`
- ✅ Cannot access signup page while logged in

---

### Test 5.4: Deep Link Protection

**Test ID:** AUTH-ROUTE-004
**Priority:** High
**Type:** Security

**Precondition:** Not logged in

**Steps:**
1. Try to visit `/workspace/settings` directly

**Expected Results:**
- ✅ Redirected to `/login?redirectTo=/workspace/settings`
- ✅ After login: redirected to `/workspace/settings` (if admin)

---

## Test Suite 6: Session Management

### Test 6.1: Session Persistence Across Tab Close

**Test ID:** SESSION-001
**Priority:** Critical
**Type:** Session Handling

**Steps:**
1. Login successfully
2. Close browser tab
3. Open new tab
4. Visit `http://localhost:3000`

**Expected Results:**
- ✅ Still logged in
- ✅ Redirected to `/workspace`
- ✅ No need to login again
- ✅ Session restored from cookies/localStorage

**Technical Verification:**
```javascript
// In browser console
document.cookie // Check for auth cookies
localStorage.getItem('supabase.auth.token') // Check token storage
```

---

### Test 6.2: Session Persistence Across Browser Restart

**Test ID:** SESSION-002
**Priority:** High
**Type:** Session Handling

**Steps:**
1. Login successfully
2. Close entire browser
3. Reopen browser
4. Visit `http://localhost:3000`

**Expected Results:**
- ✅ Still logged in
- ✅ Session persisted
- ✅ Redirected to last workspace

---

### Test 6.3: Logout Clears Session

**Test ID:** SESSION-003
**Priority:** Critical
**Type:** Security

**Steps:**
1. Login successfully
2. Click user menu in top-right
3. Click "Sign out"

**Expected Results:**
- ✅ Success toast: "Signed out successfully"
- ✅ Redirected to `/login`
- ✅ Session cleared
- ✅ Cookies cleared
- ✅ localStorage cleared

**Technical Verification:**
```javascript
// After logout
document.cookie // Should not contain auth cookies
localStorage.getItem('currentWorkspaceId') // Should be null
```

**Steps (continued):**
4. Try to visit `/workspace` again

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access without re-authentication

---

### Test 6.4: Concurrent Sessions (Multiple Tabs)

**Test ID:** SESSION-004
**Priority:** Medium
**Type:** Session Handling

**Steps:**
1. Login in Tab A
2. Open Tab B with same app
3. Tab B should also be logged in
4. Switch workspace in Tab A
5. Refresh Tab B

**Expected Results:**
- ✅ Tab B reflects workspace change (eventually)
- ✅ Both tabs stay in sync

---

### Test 6.5: Logout in One Tab Affects All

**Test ID:** SESSION-005
**Priority:** Medium
**Type:** Session Handling

**Steps:**
1. Login in Tab A and Tab B
2. Logout in Tab A
3. Try to interact in Tab B

**Expected Results:**
- ✅ Tab B detects logout
- ✅ Tab B redirects to login
- ✅ All tabs logged out

---

## Test Suite 7: OAuth Authentication

**Prerequisites:** OAuth configured (see docs/OAUTH_SETUP_GUIDE.md)

### Test 7.1: Google OAuth Signup (New User)

**Test ID:** OAUTH-001
**Priority:** Critical
**Type:** End-to-End

**Steps:**
1. Logout completely
2. Go to `/login`
3. Click "Continue with Google"
4. Redirected to Google login
5. Login with Google account (not yet registered)
6. Grant permissions

**Expected Results:**
- ✅ Redirected to `/auth/callback`
- ✅ Then redirected to `/workspace`
- ✅ User created in auth.users
- ✅ Profile created with data from Google:
  - full_name from Google display name
  - email from Google
  - avatar_url from Google photo (optional)
- ✅ Default workspace created: "[Name]'s Workspace"
- ✅ Membership created with role: admin

**Database Verification:**
```sql
-- Check user
SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'your-google@gmail.com';

-- Check OAuth provider
SELECT provider FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-google@gmail.com');
-- Expected: google

-- Check profile
SELECT * FROM profiles WHERE email = 'your-google@gmail.com';

-- Check workspace
SELECT * FROM workspaces WHERE created_by = (SELECT id FROM auth.users WHERE email = 'your-google@gmail.com');
```

---

### Test 7.2: Google OAuth Login (Existing User)

**Test ID:** OAUTH-002
**Priority:** High
**Type:** End-to-End

**Precondition:** User from Test 7.1 exists

**Steps:**
1. Logout
2. Go to `/login`
3. Click "Continue with Google"
4. Login with same Google account

**Expected Results:**
- ✅ Logged in successfully
- ✅ Redirected to `/workspace`
- ✅ No duplicate user created
- ✅ Sees existing workspace

---

### Test 7.3: Microsoft OAuth Signup

**Test ID:** OAUTH-003
**Priority:** Critical
**Type:** End-to-End

**Steps:**
1. Logout
2. Go to `/login`
3. Click "Continue with Microsoft"
4. Login with Microsoft account
5. Grant permissions

**Expected Results:**
- ✅ Same as Google OAuth (Test 7.1)
- ✅ Provider in database: azure

---

### Test 7.4: Microsoft OAuth Login

**Test ID:** OAUTH-004
**Priority:** High
**Type:** End-to-End

**Precondition:** User from Test 7.3 exists

**Steps:**
1. Logout
2. Login via Microsoft OAuth

**Expected Results:**
- ✅ Logged in successfully
- ✅ No duplicate created

---

### Test 7.5: OAuth with Matching Invitation Email

**Test ID:** OAUTH-005
**Priority:** High
**Type:** Integration

**Precondition:**
- Invitation created for `oauth-test@gmail.com` as SDR
- User does NOT exist yet

**Steps:**
1. Logout
2. Visit invitation link
3. Click "Continue with Google"
4. Login with Google account: `oauth-test@gmail.com`
5. Grant permissions

**Expected Results:**
- ✅ User created via OAuth
- ✅ Redirected back to invitation page
- ✅ Invitation auto-accepted
- ✅ User added to workspace as SDR (from invitation)
- ✅ User ALSO has own default workspace

**Database Verification:**
```sql
-- User should be in 2 workspaces
SELECT w.name, wm.role
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'oauth-test@gmail.com');

-- Expected:
-- 1. [Name]'s Workspace | admin
-- 2. [Invited Workspace] | sdr
```

---

### Test 7.6: OAuth Button Loading State

**Test ID:** OAUTH-006
**Priority:** Low
**Type:** UI/UX

**Steps:**
1. Go to `/login`
2. Click "Continue with Google"
3. Observe button state before redirect

**Expected Results:**
- ✅ Button shows loading spinner
- ✅ Button text: "Signing in..." or similar
- ✅ Button disabled during redirect

---

## Test Suite 8: Performance Tests

### Test 8.1: Auth Check Latency

**Test ID:** PERF-001
**Priority:** Medium
**Type:** Performance

**Goal:** < 100ms

**Steps:**
1. Login
2. Open DevTools → Network tab
3. Visit `/workspace`
4. Look for `getUser` or auth API call
5. Check response time

**Expected Results:**
- ✅ Auth check completes in < 100ms
- ✅ Page loads quickly

---

### Test 8.2: Login Flow Speed

**Test ID:** PERF-002
**Priority:** Medium
**Type:** Performance

**Goal:** < 3 seconds total

**Steps:**
1. Start timer
2. Enter credentials
3. Click "Sign in"
4. Wait for workspace dashboard to appear
5. Stop timer

**Expected Results:**
- ✅ Total time from click to dashboard: < 3 seconds
- ✅ Reasonable UX, no excessive delays

---

### Test 8.3: Workspace Switch Speed

**Test ID:** PERF-003
**Priority:** Low
**Type:** Performance

**Goal:** < 500ms

**Steps:**
1. Have 2+ workspaces
2. Time workspace switch operation

**Expected Results:**
- ✅ Switch completes in < 500ms
- ✅ UI updates smoothly

---

## Test Suite 9: Security Tests

### Test 9.1: RLS - Cross-Workspace Data Isolation

**Test ID:** SEC-001
**Priority:** Critical
**Type:** Security

**Precondition:**
- User A in Workspace A
- User B in Workspace B

**Steps:**
1. Login as User A
2. Open browser console
3. Try to query Workspace B:
   ```javascript
   const { data } = await supabase
     .from('workspaces')
     .select('*')
   console.log(data)
   ```

**Expected Results:**
- ✅ Only see Workspace A
- ✅ Cannot see Workspace B data
- ✅ RLS policy enforced

---

### Test 9.2: RLS - Cannot Access Other Users' Profiles

**Test ID:** SEC-002
**Priority:** High
**Type:** Security

**Steps:**
1. Login as any user
2. Try to query all profiles:
   ```javascript
   const { data } = await supabase
     .from('profiles')
     .select('*')
   console.log(data)
   ```

**Expected Results:**
- ✅ Only see your own profile OR
- ✅ Only see profiles of users in your workspaces
- ✅ RLS enforced

---

### Test 9.3: RLS - Cannot Update Other Members' Roles

**Test ID:** SEC-003
**Priority:** Critical
**Type:** Security

**Precondition:** Logged in as SDR (non-admin)

**Steps:**
1. Open console
2. Try to update another member's role:
   ```javascript
   const { error } = await supabase
     .from('workspace_members')
     .update({ role: 'admin' })
     .eq('id', '[other-member-id]')
   console.log(error)
   ```

**Expected Results:**
- ✅ Error returned
- ✅ Update blocked by RLS
- ✅ Role unchanged

---

### Test 9.4: SQL Injection Protection

**Test ID:** SEC-004
**Priority:** Critical
**Type:** Security

**Steps:**
1. Go to `/login`
2. Enter malicious SQL in email field:
   ```
   admin@test.local' OR '1'='1
   ```
3. Try to login

**Expected Results:**
- ✅ Login fails
- ✅ No SQL injection
- ✅ Supabase client sanitizes input

---

### Test 9.5: XSS Protection in User Input

**Test ID:** SEC-005
**Priority:** High
**Type:** Security

**Steps:**
1. Signup with name:
   ```
   <script>alert('XSS')</script>
   ```
2. View profile/workspace

**Expected Results:**
- ✅ No script execution
- ✅ Text rendered as plain text, not HTML
- ✅ React escapes user input

---

### Test 9.6: Password Not Exposed in Network

**Test ID:** SEC-006
**Priority:** Critical
**Type:** Security

**Steps:**
1. Open DevTools → Network tab
2. Login with credentials
3. Inspect network request

**Expected Results:**
- ✅ Password sent over HTTPS
- ✅ Password not logged in console
- ✅ No password in URL parameters

---

## Test Suite 10: Edge Cases

### Test 10.1: Very Long Workspace Name

**Test ID:** EDGE-001
**Priority:** Low
**Type:** Edge Case

**Steps:**
1. Create workspace with very long name (150+ characters)

**Expected Results:**
- ✅ Validation error OR
- ✅ Name truncated to max length
- ✅ UI doesn't break

---

### Test 10.2: Special Characters in Name

**Test ID:** EDGE-002
**Priority:** Low
**Type:** Edge Case

**Steps:**
1. Signup with name: `O'Connor & Smith <Test>`

**Expected Results:**
- ✅ Name accepted
- ✅ Properly escaped in database
- ✅ Displays correctly in UI

---

### Test 10.3: Email with Plus Addressing

**Test ID:** EDGE-003
**Priority:** Medium
**Type:** Edge Case

**Steps:**
1. Signup with email: `user+test@example.com`

**Expected Results:**
- ✅ Email accepted
- ✅ User created successfully
- ✅ Can login

---

### Test 10.4: Network Failure During Signup

**Test ID:** EDGE-004
**Priority:** Medium
**Type:** Error Handling

**Steps:**
1. Open DevTools → Network
2. Enable network throttling or offline mode
3. Try to signup

**Expected Results:**
- ✅ Error message: "Network error" or similar
- ✅ Form not cleared
- ✅ Can retry after network restored

---

### Test 10.5: Logout During Active Operation

**Test ID:** EDGE-005
**Priority:** Low
**Type:** Edge Case

**Steps:**
1. Start creating workspace
2. During creation, logout in another tab
3. Creation completes

**Expected Results:**
- ✅ Operation fails gracefully
- ✅ No orphaned data
- ✅ User logged out

---

## Test Suite 11: Regression Tests

### Regression Test Checklist

Run before each deployment:

**Critical Path:**
- [ ] Signup works (email/password)
- [ ] Login works (email/password)
- [ ] OAuth Google works
- [ ] OAuth Microsoft works
- [ ] Logout works
- [ ] Session persists after browser close

**Workspace Management:**
- [ ] Create workspace works
- [ ] Switch workspaces works
- [ ] Update workspace settings works (admin)

**Invitations:**
- [ ] Create invitation works
- [ ] Accept invitation (new user) works
- [ ] Accept invitation (existing user) works
- [ ] Invalid invitation shows error

**Members:**
- [ ] View members list works
- [ ] Change member role works (admin)
- [ ] Remove member works (admin)

**Security:**
- [ ] Protected routes redirect to login
- [ ] RLS enforced (cross-workspace isolation)
- [ ] Non-admin cannot access admin features

---

## Test Data Management

### Test User Accounts

Create these test accounts for consistent testing:

```sql
-- Admin User
INSERT INTO auth.users (email, encrypted_password) VALUES ('admin@test.local', '[hashed]');
-- Create via signup UI with password: Admin1234

-- Sales Manager
INSERT INTO auth.users (email, encrypted_password) VALUES ('manager@test.local', '[hashed]');
-- Create via signup UI with password: Manager1234

-- SDR
INSERT INTO auth.users (email, encrypted_password) VALUES ('sdr@test.local', '[hashed]');
-- Create via signup UI with password: SDR12345

-- AE
INSERT INTO auth.users (email, encrypted_password) VALUES ('ae@test.local', '[hashed]');
-- Create via signup UI with password: AE123456
```

### Cleanup Script

```sql
-- Delete all test users
DELETE FROM auth.users WHERE email LIKE '%@test.local';

-- This will cascade delete:
-- - profiles
-- - workspace_members
-- - workspaces (where user is creator)
-- - workspace_invitations
```

---

## Automated Testing (Future)

### Unit Tests (Future Implementation)

```typescript
// Example: Test password validation
describe('Password Validation', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('Test1')).toBe(false)
  })

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('test1234')).toBe(false)
  })

  it('should accept valid passwords', () => {
    expect(validatePassword('Test1234')).toBe(true)
  })
})
```

### Integration Tests (Future Implementation)

Use Playwright or Cypress for E2E testing.

---

## Test Metrics

### Coverage Goals

- **Critical Paths:** 100% manual testing
- **Edge Cases:** 80% coverage
- **Performance Tests:** Key flows only
- **Security Tests:** All OWASP top 10

### Test Execution Time

- **Full Regression Suite:** ~2 hours
- **Critical Path Only:** ~30 minutes
- **Smoke Test:** ~10 minutes

---

## Bug Reporting Template

```markdown
**Test ID:** [e.g., AUTH-001]
**Severity:** Critical / High / Medium / Low
**Environment:** Local / Staging / Production

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**


**Actual Result:**


**Screenshots:**
[Attach if applicable]

**Browser:** Chrome 120 / Firefox 121 / Safari 17
**Console Errors:**
```
[Paste errors]
```

**Database State:**
```sql
[Relevant queries]
```
```

---

## Conclusion

This comprehensive testing guide ensures F004 Authentication & Authorization System is production-ready. Execute all critical tests before deployment and run regression tests after any changes.

**Next Steps:**
1. Execute all tests manually
2. Document any failures
3. Fix bugs
4. Re-test
5. Sign off on feature completion
