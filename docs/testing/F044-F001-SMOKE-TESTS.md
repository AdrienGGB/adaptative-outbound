# F044 & F001 Smoke Test Checklist

**Date:** October 24, 2025
**Features:** F044-B (CSV Import), F044-A (Enrichment with Cache), F001 (Duplicate Detection)
**Test Environment:** Local Development (http://localhost:3001)

## Prerequisites

- [ ] Local Supabase running at http://127.0.0.1:54331
- [ ] Web app running at http://localhost:3001
- [ ] Logged in to a workspace
- [ ] Test CSV files prepared (see fixtures section below)

---

## Test Suite 1: CSV Import (F044-B)

### Test 1.1: Upload CSV File
**Objective:** Verify CSV file upload functionality

**Steps:**
1. Navigate to Accounts page
2. Click "Import" button
3. Dialog should open with title "Import Accounts"
4. Click "Upload CSV File" area or drag and drop a CSV file
5. Select `test-accounts-valid.csv` (see fixtures below)

**Expected Results:**
- [ ] File is accepted (CSV files only)
- [ ] File name and size displayed
- [ ] "Detected columns" shows all CSV headers
- [ ] "Rows" count is displayed
- [ ] "Next: Map Columns" button is enabled

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 1.2: Download CSV Template
**Objective:** Verify CSV template download

**Steps:**
1. Open Import dialog
2. Click "Download Template" button

**Expected Results:**
- [ ] Template file downloads as `accounts-template.csv`
- [ ] Template contains all required account fields as headers
- [ ] Template includes one example row with sample data

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 1.3: Column Mapping (Auto-Detection)
**Objective:** Verify automatic column mapping works

**Steps:**
1. Upload `test-accounts-valid.csv`
2. Click "Next: Map Columns"
3. Review the column mapping interface

**Expected Results:**
- [ ] CSV columns are listed on the left
- [ ] Database fields are listed in dropdowns
- [ ] Auto-detected mappings are pre-selected
- [ ] Required fields are marked with *
- [ ] Preview data is shown for validation

**Actual Results:**
```
Status: [ PASS / FAIL ]
Mapped correctly: [ LIST FIELDS ]
Not mapped: [ LIST FIELDS ]
Notes:
```

---

### Test 1.4: Column Mapping (Manual)
**Objective:** Verify manual column mapping

**Steps:**
1. Change one auto-detected mapping to a different field
2. Set a required field to "(none)"
3. Map it back to the correct field

**Expected Results:**
- [ ] Dropdown changes reflect in mapping
- [ ] Can set fields to "(none)" to skip
- [ ] Can remap fields
- [ ] Preview updates with new mapping

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 1.5: Start Import
**Objective:** Verify import job creation and execution

**Steps:**
1. Complete column mapping
2. Click "Start Import" button

**Expected Results:**
- [ ] Button shows "Starting Import..." during upload
- [ ] File uploads to Supabase Storage
- [ ] Import job is created
- [ ] Progress screen appears
- [ ] Progress bar starts moving (0% → 100%)
- [ ] "Processing..." or "Completed" status shown
- [ ] Success count increases

**Actual Results:**
```
Status: [ PASS / FAIL ]
Total records:
Successful:
Failed:
Import time:
Notes:
```

---

### Test 1.6: Import Progress Tracking
**Objective:** Verify real-time progress updates

**Steps:**
1. During import, watch the progress bar
2. Note the status messages

**Expected Results:**
- [ ] Progress percentage increases
- [ ] Status messages update (e.g., "Processing batch 1 of 3...")
- [ ] Success/fail counters update
- [ ] Errors are displayed if any
- [ ] "Complete" or "Failed" final status shown

**Actual Results:**
```
Status: [ PASS / FAIL ]
Progress updates: [ SMOOTH / CHOPPY / STUCK ]
Notes:
```

---

### Test 1.7: View Imported Data
**Objective:** Verify data is actually imported

**Steps:**
1. After import completes, close dialog
2. Page should refresh automatically
3. Check accounts list

**Expected Results:**
- [ ] Newly imported accounts appear in the list
- [ ] Account names match CSV data
- [ ] Account details (domain, industry, etc.) are correct
- [ ] No duplicate entries (if skipDuplicates enabled)

**Actual Results:**
```
Status: [ PASS / FAIL ]
Accounts visible:
Data accuracy: [ CORRECT / INCORRECT ]
Notes:
```

---

### Test 1.8: Error Handling - Invalid CSV
**Objective:** Verify error handling for malformed CSV

**Steps:**
1. Try uploading `test-accounts-invalid.csv` (malformed CSV)
2. Observe error handling

**Expected Results:**
- [ ] Error message displayed
- [ ] User-friendly error description
- [ ] Can close dialog and try again
- [ ] No partial import

**Actual Results:**
```
Status: [ PASS / FAIL ]
Error message:
Notes:
```

---

### Test 1.9: Error Handling - Missing Required Fields
**Objective:** Verify validation for required fields

**Steps:**
1. Upload `test-accounts-missing-required.csv`
2. Map columns (name is missing/empty)
3. Start import

**Expected Results:**
- [ ] Import starts but validation catches errors
- [ ] Rows with missing required fields are marked as failed
- [ ] Error message shows "Required field 'Account Name' is missing"
- [ ] Other valid rows are imported successfully
- [ ] Error count and list is displayed

**Actual Results:**
```
Status: [ PASS / FAIL ]
Failed rows:
Error messages shown:
Notes:
```

---

### Test 1.10: Error Handling - Invalid Data Types
**Objective:** Verify data type validation

**Steps:**
1. Upload `test-accounts-invalid-types.csv`
2. CSV contains invalid email, invalid number, invalid date
3. Start import

**Expected Results:**
- [ ] Invalid emails detected (e.g., "not-an-email")
- [ ] Invalid numbers detected (e.g., "abc")
- [ ] Invalid dates detected (e.g., "not-a-date")
- [ ] Errors shown with row number and column
- [ ] Valid rows still imported

**Actual Results:**
```
Status: [ PASS / FAIL ]
Validation errors caught:
Notes:
```

---

## Test Suite 2: Enrichment with Cache (F044-A)

### Test 2.1: First Enrichment (Cache MISS)
**Objective:** Verify enrichment calls external API and caches result

**Steps:**
1. Create or find an account with domain "acme.com"
2. Click "Enrich" button on account detail page
3. Wait for enrichment to complete

**Expected Results:**
- [ ] Loading state shown
- [ ] External API is called (check network tab)
- [ ] Enrichment data is returned (company info, employee count, etc.)
- [ ] Account is updated with enriched data
- [ ] Cache entry is created in `enrichment_cache` table (check Supabase)
- [ ] Success message displayed

**Actual Results:**
```
Status: [ PASS / FAIL ]
API called: [ YES / NO ]
Data returned:
Cache entry created: [ YES / NO ]
Notes:
```

---

### Test 2.2: Second Enrichment (Cache HIT)
**Objective:** Verify cached data is used

**Steps:**
1. Enrich the same account again (domain "acme.com")
2. Watch network tab

**Expected Results:**
- [ ] Enrichment completes faster
- [ ] NO external API call in network tab
- [ ] Same data is returned
- [ ] Cache hit_count incremented in database
- [ ] last_accessed_at updated

**Actual Results:**
```
Status: [ PASS / FAIL ]
API called: [ YES / NO ]
Response time: [ FAST / SLOW ]
Cache used: [ YES / NO ]
Notes:
```

---

### Test 2.3: Cache Expiration
**Objective:** Verify expired cache is not used

**Note:** This test requires manual database manipulation

**Steps:**
1. Find cache entry in `enrichment_cache` table
2. Update `expires_at` to a past date
3. Try enriching the account again

**Expected Results:**
- [ ] External API is called (cache expired)
- [ ] New cache entry created with new expiration
- [ ] Data is refreshed

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 2.4: Bulk Enrichment
**Objective:** Verify multiple accounts can be enriched

**Steps:**
1. Select multiple accounts (5-10)
2. Click "Bulk Enrich" button
3. Wait for completion

**Expected Results:**
- [ ] Bulk enrichment job created
- [ ] Progress indicator shown
- [ ] Accounts enriched one by one or in batches
- [ ] Some use cache (if duplicates), others call API
- [ ] All accounts updated
- [ ] Success/fail summary shown

**Actual Results:**
```
Status: [ PASS / FAIL ]
Total enriched:
Cache hits:
API calls:
Notes:
```

---

### Test 2.5: Enrichment Credit Tracking
**Objective:** Verify API credit usage is tracked

**Steps:**
1. Check current credit balance (if applicable)
2. Enrich a new account (cache miss)
3. Check credit balance again

**Expected Results:**
- [ ] Credits are deducted after API call
- [ ] No credits deducted for cache hits
- [ ] Credit balance displayed correctly
- [ ] Warning shown if credits low

**Actual Results:**
```
Status: [ PASS / FAIL ]
Credits before:
Credits after:
Deducted:
Notes:
```

---

## Test Suite 3: Duplicate Detection (F001)

### Test 3.1: Create Test Duplicates
**Objective:** Set up test data for duplicate detection

**Steps:**
1. Manually create two accounts with very similar data:
   - Account A: Name="Acme Corp", Domain="acme.com", City="San Francisco"
   - Account B: Name="Acme Corporation", Domain="acme.com", City="San Francisco"
2. Create two more less similar accounts:
   - Account C: Name="Acme Inc", Domain="acmeinc.com", City="San Francisco"

**Expected Results:**
- [ ] All three accounts created successfully

---

### Test 3.2: Trigger Duplicate Detection
**Objective:** Verify duplicate detection job runs

**Steps:**
1. Click "Detect Duplicates" button (or trigger via API)
2. Wait for job to complete

**Expected Results:**
- [ ] Job is created with status "pending"
- [ ] Job starts processing
- [ ] Progress shown (if UI exists)
- [ ] Job completes with status "completed"

**Actual Results:**
```
Status: [ PASS / FAIL ]
Job ID:
Processing time:
Notes:
```

---

### Test 3.3: View Duplicate Candidates
**Objective:** Verify detected duplicates are shown

**Steps:**
1. Navigate to "Duplicates" page (or accounts page with duplicates tab)
2. Review duplicate candidates

**Expected Results:**
- [ ] Duplicate candidates table shows results
- [ ] Account A and B are marked as duplicates (high similarity)
- [ ] Account C might show as potential duplicate (medium similarity)
- [ ] Similarity score is displayed (e.g., 95%)
- [ ] Matching fields are highlighted (domain, name, city)

**Actual Results:**
```
Status: [ PASS / FAIL ]
Duplicates found:
Similarity scores:
Matching fields:
Notes:
```

---

### Test 3.4: Duplicate Similarity Algorithm
**Objective:** Verify similarity calculation is accurate

**Steps:**
1. Review similarity scores for the test duplicates
2. Check matching fields breakdown

**Expected Results:**
- [ ] Account A & B: 90%+ similarity (exact domain, similar name, same city)
- [ ] Account A & C: 50-70% similarity (different domain, similar name, same city)
- [ ] Breakdown shows:
  - Domain score (exact match = 100%)
  - Name score (fuzzy match %)
  - City score (exact match = 100%)

**Actual Results:**
```
Status: [ PASS / FAIL ]
Account A & B similarity:
Account A & C similarity:
Breakdown:
  - Domain:
  - Name:
  - City:
Notes:
```

---

### Test 3.5: Domain Normalization
**Objective:** Verify domain normalization works

**Steps:**
1. Create accounts with various domain formats:
   - "https://www.example.com/"
   - "www.example.com"
   - "example.com"
   - "EXAMPLE.COM"
2. Trigger duplicate detection

**Expected Results:**
- [ ] All domains normalized to "example.com"
- [ ] All accounts detected as duplicates (100% domain match)

**Actual Results:**
```
Status: [ PASS / FAIL ]
Domains normalized correctly: [ YES / NO ]
Notes:
```

---

### Test 3.6: Fuzzy Name Matching
**Objective:** Verify fuzzy matching algorithm

**Steps:**
1. Create accounts with similar names:
   - "International Business Machines"
   - "IBM Corporation"
   - "IBM Corp"
   - "IBM Inc."
2. Trigger duplicate detection

**Expected Results:**
- [ ] "IBM Corporation", "IBM Corp", "IBM Inc." detected as similar (80%+)
- [ ] "International Business Machines" might not match (lower score)
- [ ] Token set ratio handles abbreviations and variations

**Actual Results:**
```
Status: [ PASS / FAIL ]
Name matching scores:
Notes:
```

---

### Test 3.7: Manage Duplicate - Merge
**Objective:** Verify duplicate merge functionality

**Steps:**
1. Select a duplicate pair
2. Click "Merge" button
3. Choose primary account
4. Confirm merge

**Expected Results:**
- [ ] Merge confirmation dialog shown
- [ ] Fields from both accounts shown
- [ ] Can choose which data to keep
- [ ] After merge: one account remains, other is archived/deleted
- [ ] Related records (contacts, activities) moved to primary
- [ ] Duplicate status set to "merged"

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 3.8: Manage Duplicate - Mark Not Duplicate
**Objective:** Verify false positive handling

**Steps:**
1. Select a duplicate candidate (e.g., Account A & C)
2. Click "Not Duplicate" button
3. Confirm

**Expected Results:**
- [ ] Duplicate status set to "not_duplicate"
- [ ] Pair no longer shown in duplicates list
- [ ] Future duplicate detection ignores this pair

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 3.9: Manage Duplicate - Ignore
**Objective:** Verify ignore functionality

**Steps:**
1. Select a duplicate candidate
2. Click "Ignore" button

**Expected Results:**
- [ ] Duplicate status set to "ignored"
- [ ] Pair hidden from main list (but accessible in "Ignored" view)
- [ ] Can un-ignore later

**Actual Results:**
```
Status: [ PASS / FAIL ]
Notes:
```

---

### Test 3.10: Duplicate Statistics
**Objective:** Verify duplicate stats are calculated

**Steps:**
1. Navigate to duplicates dashboard/stats
2. Review statistics

**Expected Results:**
- [ ] Total duplicates detected
- [ ] Pending count
- [ ] Merged count
- [ ] Not duplicate count
- [ ] Ignored count
- [ ] Average similarity score
- [ ] Highest similarity score

**Actual Results:**
```
Status: [ PASS / FAIL ]
Stats displayed: [ YES / NO ]
Values look correct: [ YES / NO ]
Notes:
```

---

## Test Fixtures

### test-accounts-valid.csv
```csv
name,domain,industry,employee_range,city,state,country
Acme Corporation,acme.com,Technology,51-200,San Francisco,CA,United States
Global Industries,globalind.com,Manufacturing,201-500,New York,NY,United States
Tech Startup Inc,techstartup.io,Technology,1-10,Austin,TX,United States
Mega Corp,megacorp.com,Finance,1001-5000,London,England,United Kingdom
Small Business LLC,smallbiz.com,Retail,11-50,Seattle,WA,United States
```

### test-accounts-missing-required.csv
```csv
name,domain,industry
,acme.com,Technology
No Domain Company,,Finance
Valid Company,validco.com,Healthcare
```

### test-accounts-invalid-types.csv
```csv
name,domain,email,annual_revenue_cents,city
Acme Corp,acme.com,not-an-email,not-a-number,San Francisco
Valid Corp,valid.com,valid@email.com,100000000,New York
Bad Date Corp,baddate.com,email@test.com,5000000,Chicago
```

### test-accounts-invalid.csv
```csv
name,domain,industry
"Acme Corp",acme.com,"Technology
Broken Line","missing-quote.com,Error
```

---

## Test Results Summary

**Date Tested:** _______________
**Tester:** _______________
**Environment:** _______________

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| CSV Import | 10 | | | |
| Enrichment | 5 | | | |
| Duplicate Detection | 10 | | | |
| **TOTAL** | **25** | | | |

### Critical Bugs Found:
1.
2.
3.

### Minor Issues:
1.
2.
3.

### Overall Assessment:
```
[ ] All features working as expected
[ ] Minor issues, safe to continue development
[ ] Major issues, requires fixes before proceeding
```

---

## How to Create Test Fixtures

Save these CSV files in `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/web-app/tests/fixtures/`:

**test-accounts-valid.csv:**
```
name,domain,industry,employee_range,city,state,country
Acme Corporation,acme.com,Technology,51-200,San Francisco,CA,United States
Global Industries,globalind.com,Manufacturing,201-500,New York,NY,United States
Tech Startup Inc,techstartup.io,Technology,1-10,Austin,TX,United States
Mega Corp,megacorp.com,Finance,1001-5000,London,England,United Kingdom
Small Business LLC,smallbiz.com,Retail,11-50,Seattle,WA,United States
```

**test-accounts-missing-required.csv:**
```
name,domain,industry
,acme.com,Technology
No Domain Company,,Finance
Valid Company,validco.com,Healthcare
```

**test-accounts-invalid-types.csv:**
```
name,domain,email,annual_revenue_cents,city
Acme Corp,acme.com,not-an-email,not-a-number,San Francisco
Valid Corp,valid.com,valid@email.com,100000000,New York
```

---

## Notes

- Run tests in order within each suite
- Mark actual results after each test
- Take screenshots of failures
- Note any unexpected behavior
- Report bugs immediately

**Next Steps After Smoke Tests:**
1. Fix any critical bugs found
2. Re-run failed tests
3. Proceed to unit testing once smoke tests pass
