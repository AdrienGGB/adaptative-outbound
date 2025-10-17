# F002 Comprehensive Testing Strategy

## Overview
This document outlines a systematic approach to test 100% of possible user actions in the F002 implementation, covering accounts, contacts, activities, tasks, and tags.

## Testing Methodology

### Test Pyramid Distribution
- **Unit Tests (70%)**: Service functions, validation logic, utilities
- **Integration Tests (20%)**: Database operations, RLS policies, API routes
- **E2E Tests (10%)**: Critical user workflows through UI

### Test Environment
- **Local**: Docker Supabase (127.0.0.1:54332)
- **Web App**: Next.js dev server (localhost:3001)
- **Database**: PostgreSQL 17.6 with full F002 schema

---

## 1. AUTHENTICATION TESTING

### Test Cases

#### TC-AUTH-001: User Signup
**Priority**: Critical
**Steps**:
1. Navigate to `/signup`
2. Enter valid email and password (8+ chars, 1 uppercase, 1 number)
3. Submit form
4. Verify account creation
5. Verify auto-workspace creation
6. Verify redirect to dashboard

**Expected**:
- User created in `auth.users`
- Workspace created in `workspaces`
- Workspace membership created with role='admin'
- Redirect to `/dashboard` or `/accounts`

**Edge Cases**:
- Duplicate email → Error message
- Weak password → Validation error
- SQL injection in email field
- XSS in password field

#### TC-AUTH-002: User Login
**Priority**: Critical
**Steps**:
1. Navigate to `/login`
2. Enter valid credentials
3. Submit form
4. Verify session creation
5. Verify redirect

**Expected**:
- Session cookie set
- User authenticated
- Redirect to intended page or dashboard

**Edge Cases**:
- Wrong password → "Invalid credentials"
- Non-existent email → "Invalid credentials"
- SQL injection attempts
- Rate limiting (multiple failed attempts)

#### TC-AUTH-003: User Logout
**Priority**: High
**Steps**:
1. Click logout button
2. Verify session cleared
3. Verify redirect to login

**Expected**:
- Session destroyed
- Cannot access protected pages
- Redirect to `/login`

#### TC-AUTH-004: Password Reset
**Priority**: Medium
**Steps**:
1. Navigate to `/reset-password`
2. Enter email
3. Check for reset email (local dev: check Inbucket)
4. Click reset link
5. Enter new password
6. Verify login with new password

**Expected**:
- Reset email sent
- Token valid for 1 hour
- Password updated
- Can login with new password

---

## 2. ACCOUNTS TESTING

### Test Cases

#### TC-ACC-001: View Accounts List
**Priority**: Critical
**Steps**:
1. Login as user
2. Navigate to `/accounts`
3. Verify accounts table displays

**Expected**:
- Shows only accounts in user's workspace
- Displays: name, industry, status, owner, updated_at
- Pagination works if >10 accounts
- Search functionality works

**RLS Test**:
- Create account in workspace A
- Login as user in workspace B
- Verify account NOT visible

#### TC-ACC-002: Create Account
**Priority**: Critical
**Steps**:
1. Navigate to `/accounts`
2. Click "New Account"
3. Fill form:
   - Name: "Test Corp" (required)
   - Industry: "Technology"
   - Website: "https://testcorp.com"
   - Employee count: 500
   - Annual revenue: 5000000
   - Description: "Test description"
4. Submit

**Expected**:
- Account created with ID
- `created_by` = current user
- `workspace_id` = current workspace
- `status` = "active" (default)
- Redirect to account detail page
- Version created in `account_versions`

**Validation Tests**:
- Empty name → Error
- Invalid website URL → Error
- Negative employee count → Error
- SQL injection in text fields
- XSS in description field

#### TC-ACC-003: View Account Detail
**Priority**: Critical
**Steps**:
1. Click on account from list
2. Verify detail page loads
3. Check all sections: Info, Contacts, Activities, Tasks

**Expected**:
- Account details displayed
- Owner name shown
- Related contacts listed
- Recent activities shown
- Associated tasks visible
- "Add Contact" button present
- "Log Activity" button present
- "Edit Account" button present

**RLS Test**:
- Try accessing `/accounts/[other-workspace-id]` via URL
- Should get 404 or access denied

#### TC-ACC-004: Edit Account
**Priority**: Critical
**Steps**:
1. Navigate to account detail
2. Click "Edit Account"
3. Modify fields:
   - Change name
   - Update industry
   - Modify status
4. Save changes

**Expected**:
- Account updated in database
- `updated_by` = current user
- `updated_at` = current timestamp
- New version created in `account_versions`
- UI reflects changes immediately
- Success notification shown

**Validation Tests**:
- Clear required fields → Error
- Change to duplicate name (if unique constraint)
- Invalid data types

#### TC-ACC-005: Delete Account
**Priority**: High
**Steps**:
1. Navigate to account detail
2. Click "Delete Account"
3. Confirm deletion in modal

**Expected**:
- Account soft-deleted or hard-deleted
- If soft-delete: `status` = "inactive"
- Related contacts remain but show orphaned state
- Activities/tasks remain for audit trail
- Cannot access via detail page
- Removed from accounts list

**Cascade Tests**:
- Verify contacts still accessible
- Verify activities still accessible
- Verify referential integrity maintained

#### TC-ACC-006: Account Search & Filter
**Priority**: Medium
**Steps**:
1. Navigate to `/accounts`
2. Test search:
   - Search by name
   - Search by industry
   - Search by website domain
3. Test filters:
   - Filter by status
   - Filter by industry
   - Filter by owner
   - Filter by date range

**Expected**:
- Search returns matching results
- Filters combine correctly (AND logic)
- No results shows empty state
- Search respects RLS (workspace isolation)

#### TC-ACC-007: Account Relationships (Hierarchical)
**Priority**: Medium
**Steps**:
1. Create parent account: "BigCorp"
2. Create child account: "BigCorp Subsidiary"
3. Set parent_account_id = BigCorp.id
4. View hierarchy on detail page

**Expected**:
- Child shows parent relationship
- Parent shows child relationships
- ltree path correctly formatted
- Can navigate parent → child → grandchild

---

## 3. CONTACTS TESTING

### Test Cases

#### TC-CON-001: View Contacts List
**Priority**: Critical
**Steps**:
1. Navigate to `/contacts`
2. Verify contacts table displays

**Expected**:
- Shows only contacts in user's workspace
- Displays: name, title, account, email, phone
- Can sort by columns
- Pagination works

**RLS Test**:
- Verify workspace isolation

#### TC-CON-002: Create Contact (Standalone)
**Priority**: Critical
**Steps**:
1. Navigate to `/contacts`
2. Click "New Contact"
3. Fill form:
   - First name: "John" (required)
   - Last name: "Doe" (required)
   - Email: "john.doe@example.com"
   - Phone: "+1234567890"
   - Title: "CEO"
   - Account: Select from dropdown
   - Is decision maker: true
   - Is champion: false
4. Submit

**Expected**:
- Contact created with ID
- `created_by` = current user
- `workspace_id` = current workspace
- Associated with selected account
- Version created in `contact_versions`

**Validation Tests**:
- Empty first/last name → Error
- Invalid email format → Error
- Invalid phone format → Warning or format
- SQL injection in text fields
- Duplicate email (if unique constraint)

#### TC-CON-003: Create Contact from Account Page
**Priority**: Critical (KNOWN BUG AREA)
**Steps**:
1. Navigate to account detail page
2. Click "Add Contact" button
3. Verify dialog opens
4. Verify account field pre-filled
5. Fill remaining fields
6. Submit

**Expected**:
- Dialog opens
- Account field pre-filled and disabled
- Contact created successfully
- Dialog closes
- Contact appears in account's contacts list
- No data loss if user switches windows

**Known Issues**:
- Dialog loses data when window focus changes
- Test this specific scenario

#### TC-CON-004: View Contact Detail
**Priority**: High
**Steps**:
1. Click on contact from list
2. Verify detail page loads

**Expected**:
- Contact details displayed
- Associated account linked
- Recent activities shown
- Edit button present
- Delete button present

#### TC-CON-005: Edit Contact
**Priority**: Critical (USER REPORTED BUG)
**Steps**:
1. Navigate to contact detail
2. Click "Edit Contact"
3. Modify fields:
   - Change title
   - Update email
   - Toggle decision_maker flag
4. Save changes

**Expected**:
- Contact updated in database
- `updated_by` = current user
- `updated_at` = current timestamp
- New version created in `contact_versions`
- UI reflects changes
- Success notification shown

**BUG TESTING**:
- User reported edit does not work
- Test error messages
- Check console for errors
- Verify form submission
- Check network requests
- Verify database update query

**Potential Issues**:
- Form not submitting
- Validation blocking save
- RLS policy blocking update
- Optimistic update reverting
- Version conflict

#### TC-CON-006: Delete Contact
**Priority**: High
**Steps**:
1. Navigate to contact detail
2. Click "Delete Contact"
3. Confirm deletion

**Expected**:
- Contact deleted/soft-deleted
- Removed from contact list
- Activities remain (audit trail)
- Cannot access via detail page

#### TC-CON-007: Contact Search & Filter
**Priority**: Medium
**Steps**:
1. Test search by name, email, title
2. Filter by account
3. Filter by decision_maker
4. Filter by champion

**Expected**:
- Search returns matches
- Filters work correctly
- Workspace isolation maintained

#### TC-CON-008: Contact Versioning
**Priority**: Medium
**Steps**:
1. Create contact
2. Edit contact multiple times
3. View version history

**Expected**:
- Each change creates new version
- Can view version history
- Shows who made changes and when
- Can compare versions (if UI implemented)

---

## 4. ACTIVITIES TESTING

### Test Cases

#### TC-ACT-001: View Activities List
**Priority**: High
**Steps**:
1. Navigate to `/activities`
2. Verify activities feed displays

**Expected**:
- Shows activities in reverse chronological order
- Displays: type, subject, account, contact, date, owner
- Can filter by type, date, account
- Pagination works

#### TC-ACT-002: Log Activity (Standalone)
**Priority**: Critical
**Steps**:
1. Navigate to `/activities`
2. Click "Log Activity"
3. Fill form:
   - Type: "call" (required)
   - Subject: "Discovery call" (required)
   - Description: "Discussed requirements"
   - Account: Select account (required)
   - Contact: Select contact (optional)
   - Activity date: Select date/time
   - Duration: 30 (minutes)
   - Outcome: "positive"
   - Follow-up required: true
   - Follow-up date: Tomorrow
4. Submit

**Expected**:
- Activity created with ID
- `created_by` = current user
- `workspace_id` = current workspace
- Associated with account and contact
- Follow-up task created if requested
- Success notification

**Validation Tests**:
- Missing required fields → Error
- Invalid date (future for past activities)
- Negative duration
- SQL injection in text fields

#### TC-ACT-003: Log Activity from Account Page
**Priority**: Critical (DIALOG STATE BUG AREA)
**Steps**:
1. Navigate to account detail
2. Click "Log Activity" button
3. Verify dialog opens with account pre-filled
4. **Switch to another program/window**
5. **Switch back**
6. Verify form data still present
7. Complete form and submit

**Expected**:
- Dialog opens
- Account pre-filled
- Form data persists across window focus changes
- Activity created successfully
- Dialog closes
- Activity appears in account's activities list

**Known Issues**:
- Dialog loses data when window focus changes
- This is a critical bug to fix

#### TC-ACT-004: Edit Activity
**Priority**: Medium
**Steps**:
1. Navigate to activity detail (if exists)
2. Edit activity fields
3. Save changes

**Expected**:
- Activity updated
- `updated_by` = current user
- UI reflects changes

#### TC-ACT-005: Delete Activity
**Priority**: Medium
**Steps**:
1. Delete activity
2. Confirm deletion

**Expected**:
- Activity removed
- Audit trail maintained

#### TC-ACT-006: Activity Types
**Priority**: Medium
**Steps**:
Test each activity type:
- call
- email
- meeting
- demo
- proposal
- contract_sent
- other

**Expected**:
- Each type saves correctly
- Icons/colors display correctly
- Filtering by type works

#### TC-ACT-007: Activity Search & Filter
**Priority**: Medium
**Steps**:
1. Filter by date range
2. Filter by type
3. Filter by account
4. Filter by outcome
5. Search by subject/description

**Expected**:
- All filters work correctly
- Workspace isolation maintained

---

## 5. TASKS TESTING

### Test Cases

#### TC-TASK-001: View Tasks List
**Priority**: High (NAVIGATION BUG)
**Steps**:
1. Navigate to `/tasks` directly via URL
2. Verify tasks list displays

**Expected**:
- Shows all tasks in user's workspace
- Displays: title, status, priority, due date, assigned to, account
- Can sort by columns
- Can filter by status, priority, assigned user

**Known Issue**:
- No navigation link to /tasks page
- User had to manually enter URL
- This is a bug to fix

#### TC-TASK-002: Create Task (Standalone)
**Priority**: Critical
**Steps**:
1. Navigate to `/tasks`
2. Click "New Task"
3. Fill form:
   - Title: "Follow up with contact" (required)
   - Description: "Send proposal"
   - Status: "todo" (default)
   - Priority: "high"
   - Due date: Tomorrow
   - Account: Select account (optional)
   - Contact: Select contact (optional)
   - Assigned to: Select user
4. Submit

**Expected**:
- Task created with ID
- `created_by` = current user
- `workspace_id` = current workspace
- `assigned_to` defaults to creator if not specified
- Success notification

**Validation Tests**:
- Missing title → Error
- Past due date → Warning
- SQL injection in text fields
- Controlled/uncontrolled input warnings

**Known Issue**:
- User reported controlled/uncontrolled input warnings
- Need to fix form field initialization

#### TC-TASK-003: Create Task from Activity
**Priority**: High
**Steps**:
1. Log activity with "Follow-up required" = true
2. Set follow-up date
3. Submit activity
4. Verify task auto-created

**Expected**:
- Task created automatically
- Title: "Follow up: [activity subject]"
- Due date = follow-up date
- Status = "todo"
- Linked to same account/contact as activity
- Assigned to activity creator

#### TC-TASK-004: Edit Task
**Priority**: Critical
**Steps**:
1. Navigate to task detail
2. Click "Edit Task"
3. Modify fields:
   - Change status to "in_progress"
   - Update priority to "urgent"
   - Change assigned_to
4. Save changes

**Expected**:
- Task updated
- `updated_by` = current user
- `updated_at` = current timestamp
- UI reflects changes
- Assigned user receives notification (if implemented)

#### TC-TASK-005: Complete Task
**Priority**: Critical
**Steps**:
1. Change task status to "done"
2. Save

**Expected**:
- Status updated to "done"
- `completed_at` timestamp set
- Task moves to completed section/filter
- Shows completion date

#### TC-TASK-006: Delete Task
**Priority**: Medium
**Steps**:
1. Delete task
2. Confirm deletion

**Expected**:
- Task removed from list
- Referential integrity maintained

#### TC-TASK-007: Task Assignment
**Priority**: Medium
**Steps**:
1. Create task assigned to User A
2. Login as User A
3. Verify task appears in "Assigned to me" filter
4. Login as User B
5. Verify task NOT in "Assigned to me"

**Expected**:
- Task filtering by assigned_to works
- RLS allows viewing tasks in same workspace
- Users can see tasks assigned to others (for visibility)

#### TC-TASK-008: Task Status Workflow
**Priority**: Medium
**Steps**:
Test status transitions:
- todo → in_progress
- in_progress → done
- in_progress → blocked
- blocked → in_progress
- done → todo (reopen)

**Expected**:
- All transitions work
- Status history maintained
- Timestamps updated correctly

#### TC-TASK-009: Task Priority
**Priority**: Low
**Steps**:
Test priority levels:
- low
- medium
- high
- urgent

**Expected**:
- Each priority saves
- Sorting by priority works
- Visual indicators (colors) display

---

## 6. TAGS TESTING

### Test Cases

#### TC-TAG-001: View Tags List
**Priority**: Medium
**Steps**:
1. Navigate to `/tags` or tags section
2. Verify tags display

**Expected**:
- Shows all tags in workspace
- Displays: name, color, usage count
- Can search tags

#### TC-TAG-002: Create Tag
**Priority**: Medium
**Steps**:
1. Click "New Tag"
2. Enter name: "VIP"
3. Select color: "blue"
4. Save

**Expected**:
- Tag created
- `workspace_id` = current workspace
- Color displays correctly

**Validation Tests**:
- Duplicate tag name → Error or merge
- Empty name → Error
- Invalid color code

#### TC-TAG-003: Apply Tag to Account
**Priority**: Medium
**Steps**:
1. Navigate to account detail
2. Add tag "VIP"
3. Save

**Expected**:
- Association created in `account_tags`
- Tag displays on account card
- Account appears in tag filter

#### TC-TAG-004: Apply Tag to Contact
**Priority**: Medium
**Steps**:
1. Navigate to contact detail
2. Add tag "Decision Maker"
3. Save

**Expected**:
- Association created in `contact_tags`
- Tag displays on contact card

#### TC-TAG-005: Remove Tag
**Priority**: Medium
**Steps**:
1. Remove tag from account/contact
2. Verify association deleted

**Expected**:
- Tag removed from entity
- Tag itself still exists (unless deleted)

#### TC-TAG-006: Delete Tag
**Priority**: Low
**Steps**:
1. Delete tag completely
2. Verify all associations removed

**Expected**:
- Tag deleted from `tags` table
- All associations removed from junction tables
- No orphaned references

#### TC-TAG-007: Filter by Tag
**Priority**: Medium
**Steps**:
1. Filter accounts by tag "VIP"
2. Verify only tagged accounts shown
3. Filter contacts by tag
4. Verify only tagged contacts shown

**Expected**:
- Tag filtering works
- Multiple tags combine (OR logic)
- Workspace isolation maintained

---

## 7. CROSS-CUTTING CONCERNS

### RLS (Row Level Security) Testing

#### TC-RLS-001: Workspace Isolation
**Priority**: Critical
**Steps**:
1. Create data in Workspace A
2. Login as user in Workspace B
3. Attempt to access Workspace A data via:
   - UI navigation
   - Direct URL manipulation
   - API calls (if exposed)

**Expected**:
- No data from other workspace visible
- 404 or access denied errors
- Database queries return empty results

**Test for Each Entity**:
- Accounts
- Contacts
- Activities
- Tasks
- Tags

#### TC-RLS-002: User Permissions
**Priority**: Critical
**Steps**:
1. Test as admin user
2. Test as member user
3. Test as read-only user (if role exists)

**Expected**:
- Admins can CRUD all entities
- Members can CRUD their own + view others
- Read-only can only view (if implemented)

**Test Operations**:
- CREATE: Check policy allows/denies
- READ: Check visibility
- UPDATE: Check modification rights
- DELETE: Check deletion rights

#### TC-RLS-003: Recursive Policy Testing
**Priority**: High
**Steps**:
1. Test workspace_invitations table
2. Attempt to create invitation
3. Verify no infinite recursion error

**Expected**:
- SECURITY DEFINER function prevents recursion
- Invitation created successfully
- No database errors

### Performance Testing

#### TC-PERF-001: Large Dataset Performance
**Priority**: Medium
**Steps**:
1. Create 1000 accounts
2. Create 5000 contacts
3. Create 10000 activities
4. Test page load times
5. Test search performance
6. Test filter performance

**Expected**:
- Pages load < 2 seconds
- Search returns results < 1 second
- No UI freezing
- Pagination works smoothly

#### TC-PERF-002: Concurrent Users
**Priority**: Low
**Steps**:
1. Simulate 10 concurrent users
2. Perform various operations
3. Check for race conditions

**Expected**:
- No data corruption
- No deadlocks
- Optimistic locking works

### Security Testing

#### TC-SEC-001: SQL Injection
**Priority**: Critical
**Steps**:
Test all text inputs with SQL injection patterns:
- `' OR '1'='1`
- `'; DROP TABLE accounts;--`
- `1' UNION SELECT * FROM auth.users--`

**Expected**:
- All inputs sanitized
- Prepared statements used
- No SQL errors exposed
- No unauthorized data access

#### TC-SEC-002: XSS (Cross-Site Scripting)
**Priority**: Critical
**Steps**:
Test all text inputs with XSS patterns:
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `javascript:alert('XSS')`

**Expected**:
- All HTML escaped
- Scripts don't execute
- Safe rendering

#### TC-SEC-003: CSRF (Cross-Site Request Forgery)
**Priority**: High
**Steps**:
1. Attempt CSRF attack on form submissions
2. Check for CSRF tokens

**Expected**:
- CSRF protection enabled
- Tokens validated
- Unauthorized requests rejected

#### TC-SEC-004: Authorization Bypass
**Priority**: Critical
**Steps**:
1. Attempt to access admin-only features as member
2. Try URL manipulation to access other user's data
3. Test API endpoints without authentication

**Expected**:
- Proper authorization checks
- 401/403 responses
- No data leakage

---

## 8. UI/UX TESTING

### Responsive Design

#### TC-UI-001: Mobile Responsiveness
**Priority**: High
**Steps**:
1. Test on mobile viewport (375px)
2. Test on tablet viewport (768px)
3. Test on desktop viewport (1920px)

**Expected**:
- All layouts responsive
- No horizontal scrolling
- Touch targets adequate (44px minimum)
- Forms usable on mobile

### Accessibility

#### TC-A11Y-001: Keyboard Navigation
**Priority**: High
**Steps**:
1. Navigate site using only keyboard
2. Check Tab order logical
3. Verify focus indicators visible
4. Test form submission with Enter key

**Expected**:
- All interactive elements reachable
- Focus order makes sense
- Focus indicators visible
- Keyboard shortcuts work

#### TC-A11Y-002: Screen Reader
**Priority**: Medium
**Steps**:
1. Test with VoiceOver (Mac) or NVDA (Windows)
2. Verify labels read correctly
3. Check ARIA attributes

**Expected**:
- All form fields labeled
- Error messages announced
- Button purposes clear
- Headings structured properly

#### TC-A11Y-003: Color Contrast
**Priority**: Medium
**Steps**:
1. Check color contrast ratios
2. Verify WCAG AA compliance (4.5:1 for text)

**Expected**:
- All text meets contrast requirements
- Interactive elements distinguishable

### Error Handling

#### TC-ERR-001: Network Errors
**Priority**: High
**Steps**:
1. Disconnect network
2. Attempt to create/edit entities
3. Reconnect network

**Expected**:
- Clear error messages
- Data not lost
- Retry mechanism works
- No app crash

#### TC-ERR-002: Validation Errors
**Priority**: High
**Steps**:
1. Submit forms with invalid data
2. Check error messages

**Expected**:
- Errors displayed inline
- Error messages helpful
- Field-specific errors shown
- Form doesn't clear on error

#### TC-ERR-003: Server Errors
**Priority**: High
**Steps**:
1. Simulate 500 error
2. Simulate timeout
3. Check error boundaries

**Expected**:
- Graceful error handling
- User-friendly error messages
- Error logged for debugging
- Option to retry or go back

---

## 9. REGRESSION TESTING

### After Bug Fixes

#### TC-REG-001: Contact Edit Fix
**Priority**: Critical
**Steps**:
1. After fixing contact edit bug
2. Run full contacts test suite (TC-CON-001 through TC-CON-008)
3. Verify no regressions in other features

**Expected**:
- Contact edit works
- All other contact features still work
- No new bugs introduced

#### TC-REG-002: Dialog State Fix
**Priority**: Critical
**Steps**:
1. After fixing dialog state persistence
2. Test all dialogs:
   - Create Contact dialog
   - Log Activity dialog
   - Create Task dialog
3. Test window switching for each

**Expected**:
- All dialogs preserve state
- No data loss
- No new UI bugs

#### TC-REG-003: Tasks Navigation Fix
**Priority**: High
**Steps**:
1. After adding /tasks navigation link
2. Verify link appears in menu
3. Test navigation to tasks page
4. Run full tasks test suite

**Expected**:
- Link visible and clickable
- Navigation works
- Tasks page loads correctly

---

## 10. TEST EXECUTION PLAN

### Phase 1: Critical Path (Day 1)
**Priority**: Must pass before any deployment

1. Authentication (TC-AUTH-001 to TC-AUTH-003)
2. Accounts CRUD (TC-ACC-001 to TC-ACC-005)
3. Contacts CRUD (TC-CON-001 to TC-CON-005)
4. Activities CRUD (TC-ACT-001 to TC-ACT-003)
5. Tasks CRUD (TC-TASK-001 to TC-TASK-005)
6. RLS Workspace Isolation (TC-RLS-001)

**Success Criteria**: All critical tests pass

### Phase 2: Bug Verification (Day 1-2)
**Priority**: Fix before deployment

1. Contact Edit Bug (TC-CON-005)
2. Dialog State Persistence (TC-CON-003, TC-ACT-003)
3. Tasks Navigation (TC-TASK-001)
4. Controlled Input Warnings (TC-TASK-002)

**Success Criteria**: All known bugs fixed and verified

### Phase 3: Full Feature Coverage (Day 2-3)
**Priority**: Comprehensive coverage

1. Complete all test cases (TC-*-001 to TC-*-999)
2. Edge cases and validations
3. Search and filter functionality
4. Versioning and audit trails

**Success Criteria**: 90%+ test coverage

### Phase 4: Security & Performance (Day 3-4)
**Priority**: Before production deployment

1. SQL Injection tests (TC-SEC-001)
2. XSS tests (TC-SEC-002)
3. Authorization tests (TC-SEC-004)
4. RLS comprehensive tests (TC-RLS-001 to TC-RLS-003)
5. Performance tests (TC-PERF-001)

**Success Criteria**: No security vulnerabilities, acceptable performance

### Phase 5: UI/UX Polish (Day 4-5)
**Priority**: User experience quality

1. Responsive design (TC-UI-001)
2. Accessibility (TC-A11Y-001 to TC-A11Y-003)
3. Error handling (TC-ERR-001 to TC-ERR-003)
4. Browser compatibility

**Success Criteria**: WCAG AA compliance, works on major browsers

---

## 11. TEST DATA MANAGEMENT

### Test Data Sets

#### Minimal Test Set (Quick Smoke Test)
- 1 workspace
- 2 users (admin, member)
- 3 accounts
- 5 contacts
- 10 activities
- 5 tasks
- 3 tags

#### Standard Test Set
- 1 workspace
- 5 users
- 20 accounts (various industries, statuses)
- 50 contacts (various roles, flags)
- 100 activities (all types)
- 30 tasks (all statuses, priorities)
- 10 tags

#### Large Test Set (Performance Testing)
- 3 workspaces
- 20 users
- 1000 accounts
- 5000 contacts
- 10000 activities
- 1000 tasks
- 50 tags

### Test Data Scripts

```sql
-- Script to create minimal test data
-- File: supabase/seed_test_data.sql

-- Insert test workspace
INSERT INTO workspaces (id, name, created_at, updated_at)
VALUES ('test-workspace-1', 'Test Workspace', NOW(), NOW());

-- Insert test users
-- Use signup page instead of manual SQL

-- Insert test accounts
INSERT INTO accounts (workspace_id, name, industry, status, created_by, updated_by)
VALUES
  ('test-workspace-1', 'TechCorp', 'technology', 'active', '[user-id]', '[user-id]'),
  ('test-workspace-1', 'FinanceInc', 'finance', 'active', '[user-id]', '[user-id]'),
  ('test-workspace-1', 'HealthCare Plus', 'healthcare', 'prospect', '[user-id]', '[user-id]');

-- Add contacts, activities, tasks...
```

### Test Data Cleanup

```sql
-- Script to clean test data
-- File: supabase/cleanup_test_data.sql

-- Delete in correct order (respecting foreign keys)
DELETE FROM task_tags WHERE task_id IN (SELECT id FROM tasks WHERE workspace_id = 'test-workspace-1');
DELETE FROM contact_tags WHERE contact_id IN (SELECT id FROM contacts WHERE workspace_id = 'test-workspace-1');
DELETE FROM account_tags WHERE account_id IN (SELECT id FROM accounts WHERE workspace_id = 'test-workspace-1');
DELETE FROM tasks WHERE workspace_id = 'test-workspace-1';
DELETE FROM activities WHERE workspace_id = 'test-workspace-1';
DELETE FROM contact_versions WHERE contact_id IN (SELECT id FROM contacts WHERE workspace_id = 'test-workspace-1');
DELETE FROM contacts WHERE workspace_id = 'test-workspace-1';
DELETE FROM account_versions WHERE account_id IN (SELECT id FROM accounts WHERE workspace_id = 'test-workspace-1');
DELETE FROM accounts WHERE workspace_id = 'test-workspace-1';
DELETE FROM tags WHERE workspace_id = 'test-workspace-1';
DELETE FROM workspace_memberships WHERE workspace_id = 'test-workspace-1';
DELETE FROM workspaces WHERE id = 'test-workspace-1';
```

---

## 12. TEST TRACKING

### Test Execution Log Template

```markdown
## Test Execution Log
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Local/Staging/Production]
Browser: [Chrome/Firefox/Safari]
Build/Commit: [commit-hash]

| Test ID | Test Name | Status | Notes | Bugs Found |
|---------|-----------|--------|-------|------------|
| TC-AUTH-001 | User Signup | ✅ PASS | | |
| TC-AUTH-002 | User Login | ✅ PASS | | |
| TC-CON-005 | Edit Contact | ❌ FAIL | Edit button not working | BUG-001 |
| ... | ... | ... | ... | ... |

### Summary
- Total Tests: 150
- Passed: 145
- Failed: 3
- Blocked: 2
- Pass Rate: 96.7%

### Critical Issues
1. BUG-001: Contact edit functionality broken
2. BUG-002: Dialog loses state on window switch

### Recommendations
- Fix BUG-001 and BUG-002 before deployment
- All other tests passed successfully
```

---

## 13. BUG REPORTING TEMPLATE

```markdown
## Bug Report

### BUG-XXX: [Title]

**Severity**: Critical / High / Medium / Low
**Priority**: P0 / P1 / P2 / P3
**Status**: Open / In Progress / Fixed / Closed

**Environment**:
- Browser: [Chrome 120.0]
- OS: [macOS 14.6]
- Environment: [Local/Staging/Production]
- Build: [commit-hash]

**Test Case**: TC-XXX-XXX

**Description**:
Clear description of the bug.

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**:
What should happen.

**Actual Result**:
What actually happened.

**Screenshots/Videos**:
[Attach if applicable]

**Console Errors**:
```
Error messages here
```

**Database State**:
Relevant database records or queries.

**Workaround**:
Any temporary workaround if available.

**Related Issues**:
Links to related bugs or tickets.
```

---

## 14. AUTOMATED TESTING RECOMMENDATIONS

### Unit Tests (Jest + React Testing Library)

```typescript
// Example: services/accounts.test.ts
import { getAccounts, createAccount } from './accounts'

describe('Account Service', () => {
  describe('getAccounts', () => {
    it('should return accounts for workspace', async () => {
      const accounts = await getAccounts('workspace-1')
      expect(accounts).toBeInstanceOf(Array)
      expect(accounts[0]).toHaveProperty('id')
      expect(accounts[0]).toHaveProperty('name')
    })

    it('should not return accounts from other workspaces', async () => {
      const accounts = await getAccounts('workspace-1')
      expect(accounts.every(a => a.workspace_id === 'workspace-1')).toBe(true)
    })
  })

  describe('createAccount', () => {
    it('should create account with required fields', async () => {
      const account = await createAccount({
        name: 'Test Corp',
        workspace_id: 'workspace-1',
        created_by: 'user-1'
      })
      expect(account).toHaveProperty('id')
      expect(account.name).toBe('Test Corp')
    })

    it('should throw error with missing name', async () => {
      await expect(createAccount({
        workspace_id: 'workspace-1',
        created_by: 'user-1'
      })).rejects.toThrow()
    })
  })
})
```

### Integration Tests (Playwright)

```typescript
// Example: tests/e2e/accounts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/accounts')
  })

  test('should display accounts list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Accounts')
    await expect(page.locator('table tbody tr')).toHaveCount(3)
  })

  test('should create new account', async ({ page }) => {
    await page.click('text=New Account')
    await page.fill('input[name="name"]', 'Test Corp')
    await page.selectOption('select[name="industry"]', 'technology')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Account created successfully')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Test Corp')
  })

  test('should edit account', async ({ page }) => {
    await page.click('table tbody tr:first-child')
    await page.click('text=Edit Account')
    await page.fill('input[name="name"]', 'Updated Corp')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Account updated successfully')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Updated Corp')
  })
})
```

---

## 15. SUCCESS METRICS

### Test Coverage Goals
- **Code Coverage**: 80%+ overall
  - Services: 90%+
  - Components: 70%+
  - Utilities: 95%+
- **Feature Coverage**: 100% of user-facing features
- **RLS Coverage**: 100% of security policies

### Quality Gates
- ✅ All critical tests pass (Phase 1)
- ✅ Zero known critical bugs
- ✅ Zero security vulnerabilities
- ✅ Performance benchmarks met
- ✅ Accessibility standards met (WCAG AA)

### Deployment Checklist
- [ ] All test phases completed
- [ ] Bug tracking shows 0 critical/high bugs
- [ ] Security audit passed
- [ ] Performance tests passed
- [ ] Accessibility audit passed
- [ ] Staging environment validated
- [ ] Production deployment plan reviewed
- [ ] Rollback plan documented

---

## 16. NEXT STEPS

### Immediate Actions (Now)
1. ✅ Document comprehensive test strategy (this file)
2. 🔄 Execute test-engineer agent to perform systematic testing
3. 🔄 Identify and document all bugs
4. 🔄 Prioritize bugs for fixing

### Short Term (Today/Tomorrow)
1. Fix critical bugs identified by testing
2. Run regression tests
3. Update F002_TESTING_REPORT.md with results
4. Prepare for staging deployment

### Medium Term (This Week)
1. Implement automated test suites
2. Set up CI/CD pipeline with tests
3. Deploy to staging
4. Final validation

### Long Term (Next Week)
1. Production deployment
2. Monitoring and error tracking
3. User acceptance testing
4. Performance optimization based on real usage

---

## Appendix A: Test Environment Setup

### Local Development
```bash
# Start Supabase
cd /Users/adriengaignebet/Documents/Tech/Adaptive\ Outbound
npx supabase start

# Start web app
cd web-app
npm run dev

# Run tests
npm test
npm run test:e2e
```

### Database Access
```bash
# PostgreSQL connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Or via Supabase Studio
# http://127.0.0.1:54323
```

### Test User Credentials
```
Email: test@example.com
Password: Test1234
Workspace: Default workspace (auto-created)
```

---

**Document Status**: ✅ Complete and Ready for Execution
**Last Updated**: 2025-10-12
**Next Review**: After test execution completion
