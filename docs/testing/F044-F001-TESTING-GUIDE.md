# F044 & F001 Testing Guide

**Features:** CSV Import (F044-B), Enrichment Cache (F044-A), Duplicate Detection (F001)
**Date:** October 24, 2025
**Status:** Ready for Testing

---

## Overview

This guide covers all testing for features F044 and F001, including:
- Manual smoke tests
- Unit tests
- Integration tests
- End-to-end tests

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\         10% - Critical user journeys
      /------\
     /  INT   \      20% - API and database integration
    /----------\
   /    UNIT    \    70% - Business logic and algorithms
  /--------------\
```

### Coverage Goals

| Component | Type | Coverage Target | Status |
|-----------|------|-----------------|--------|
| CSV Parser | Unit | 90%+ | ✅ Complete |
| Duplicate Detection | Unit | 90%+ | ✅ Complete |
| Enrichment Cache | Unit | 85%+ | ✅ Complete |
| Import Flow | Integration | 70%+ | 🔄 Pending |
| CSV Import UI | E2E | Critical paths | 🔄 Pending |

---

## Quick Start

### 1. Run Smoke Tests (Manual)

Before any automated testing, run through the smoke test checklist:

```bash
# Open smoke test checklist
open docs/testing/F044-F001-SMOKE-TESTS.md
```

Follow the checklist to manually verify all features work.

### 2. Run Unit Tests

```bash
cd web-app

# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### 3. Run E2E Tests (When Available)

```bash
cd web-app

# Run Playwright E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### 4. Run All Tests

```bash
cd web-app

# Run unit tests + E2E tests
npm run test:all
```

---

## Unit Tests

### CSV Parser Tests

**File:** `/web-app/src/__tests__/lib/csv-parser.test.ts`

**Coverage:**
- ✅ Parse valid CSV files
- ✅ Handle malformed CSV
- ✅ Skip empty lines
- ✅ Trim headers
- ✅ Validate required fields
- ✅ Validate email format
- ✅ Validate number format
- ✅ Validate date format
- ✅ Transform boolean values (true/false/1/0/yes/no)
- ✅ Transform data types (string, number, date, email, url)
- ✅ Add protocol to URLs
- ✅ Handle null values
- ✅ Batch validation
- ✅ Generate CSV templates
- ✅ Prepare data for import
- ✅ Batch array splitting

**Run specific test:**
```bash
npm test -- csv-parser.test.ts
```

**Example Test:**
```typescript
it('should validate a valid row', () => {
  const row = {
    'Company Name': 'Acme Corp',
    Website: 'acme.com',
    Email: 'contact@acme.com',
  }

  const result = validateRow(row, 1, mapping, 'accounts')

  expect(result.isValid).toBe(true)
  expect(result.data).toMatchObject({
    name: 'Acme Corp',
    domain: 'https://acme.com',
    email: 'contact@acme.com',
  })
})
```

---

### Duplicate Detection Tests

**File:** `/web-app/src/__tests__/services/duplicate-detection.test.ts`

**Coverage:**
- ✅ Domain normalization (remove www, protocol, trailing slash)
- ✅ Email domain extraction
- ✅ Fuzzy string matching (exact, similar, different)
- ✅ Account similarity calculation
  - ✅ Domain exact match (40 points)
  - ✅ Name fuzzy match (30 points)
  - ✅ Email domain match (20 points)
  - ✅ City match (10 points)
- ✅ Contact similarity calculation
  - ✅ Email exact match (50 points)
  - ✅ Name fuzzy match (30 points)
  - ✅ LinkedIn URL match (20 points)
- ✅ Handle null/undefined values
- ✅ Handle missing fields
- ✅ Case-insensitive matching
- ✅ Special characters
- ✅ Unicode characters

**Run specific test:**
```bash
npm test -- duplicate-detection.test.ts
```

**Example Test:**
```typescript
it('should detect exact domain match', () => {
  const account1 = {
    name: 'Acme Corp',
    domain: 'acme.com',
  }
  const account2 = {
    name: 'Acme Corporation',
    domain: 'acme.com',
  }

  const result = calculateAccountSimilarity(account1, account2)

  expect(result.breakdown.domain_score).toBe(100)
  expect(result.matchingFields).toContain('domain')
  expect(result.percentage).toBeGreaterThan(70)
})
```

---

### Enrichment Cache Tests

**File:** `/web-app/src/__tests__/services/enrichment-cache.test.ts`

**Coverage:**
- ✅ Cache MISS (no data found)
- ✅ Cache HIT (data found)
- ✅ Normalize lookup values to lowercase
- ✅ Filter by expiration date
- ✅ Increment hit_count on cache hit
- ✅ Update last_accessed_at
- ✅ Handle database errors gracefully
- ✅ Upsert for insert or update
- ✅ Return null on errors
- ✅ Cache key uniqueness (provider, lookup_type, lookup_value)
- ✅ Expired entries not returned
- ✅ Non-expired entries returned

**Run specific test:**
```bash
npm test -- enrichment-cache.test.ts
```

**Example Test:**
```typescript
it('should return cache HIT when data found', async () => {
  const mockCacheEntry = {
    id: 'cache-1',
    enrichment_data: {
      name: 'Example Corp',
      employees: 100,
    },
    hit_count: 5,
  }

  mockSupabase.maybeSingle.mockResolvedValue({
    data: mockCacheEntry,
    error: null,
  })

  const result = await checkCache(
    'workspace-123',
    'apollo',
    'domain',
    'example.com'
  )

  expect(result.found).toBe(true)
  expect(result.data).toEqual(mockCacheEntry.enrichment_data)
})
```

---

## Test Fixtures

**Location:** `/web-app/tests/fixtures/`

### Available Fixtures:

1. **test-accounts-valid.csv** - Valid CSV with 5 accounts
2. **test-accounts-missing-required.csv** - CSV with missing required fields
3. **test-accounts-invalid-types.csv** - CSV with invalid data types
4. **test-accounts-invalid.csv** - Malformed CSV

**Usage in tests:**
```typescript
import fs from 'fs'
import path from 'path'

const csvPath = path.join(__dirname, '../../tests/fixtures/test-accounts-valid.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')
const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
```

---

## Coverage Reports

### View Coverage Report

After running tests with coverage:

```bash
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Set in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

### Current Coverage (as of Oct 24, 2025):

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| csv-parser.ts | TBD | TBD | TBD | TBD |
| duplicate-detection.ts | TBD | TBD | TBD | TBD |
| enrichment-cache.ts | TBD | TBD | TBD | TBD |

*Run `npm run test:coverage` to populate this table*

---

## Integration Testing

Integration tests verify that components work together correctly.

### Test Database Setup

For integration tests, use a local Supabase instance:

```bash
# Start local Supabase
npx supabase start

# Get connection details
npx supabase status

# Use in tests
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-local-anon-key
```

### Integration Test Plan

**File:** `web-app/src/__tests__/integration/csv-import.test.ts` (TO BE CREATED)

**Test scenarios:**
1. Upload CSV → Parse → Validate → Import → Verify in database
2. Import with validation errors → Check error handling
3. Duplicate detection after import → Verify candidates created
4. Enrichment after import → Check cache usage

---

## End-to-End Testing

E2E tests verify complete user workflows using Playwright.

### E2E Test Plan

**File:** `web-app/tests/e2e/csv-import.spec.ts` (TO BE CREATED)

**Test scenarios:**
1. User uploads CSV file
2. User maps columns
3. User starts import
4. Import completes successfully
5. User views imported data

**Example E2E Test:**
```typescript
test('should import accounts from CSV', async ({ page }) => {
  await page.goto('/accounts')

  // Click Import button
  await page.click('[data-testid="import-button"]')

  // Upload CSV file
  const fileInput = await page.locator('input[type="file"]')
  await fileInput.setInputFiles('tests/fixtures/test-accounts-valid.csv')

  // Verify headers detected
  await expect(page.locator('[data-testid="csv-headers"]')).toContainText('name')

  // Click Next
  await page.click('[data-testid="next-button"]')

  // Start import
  await page.click('[data-testid="start-import-button"]')

  // Wait for completion
  await expect(page.locator('[data-testid="import-status"]')).toContainText('Completed')

  // Verify accounts imported
  await expect(page.locator('[data-testid="account-row"]')).toHaveCount(5)
})
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml` (TO BE CREATED)

```yaml
name: Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Debugging Tests

### Debug Unit Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- csv-parser.test.ts

# Run specific test case
npm test -- -t "should validate a valid row"

# Run in watch mode (auto-rerun on changes)
npm run test:watch
```

### Debug E2E Tests

```bash
# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in debug mode (step through)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- csv-import.spec.ts
```

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/web-app/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## Test Best Practices

### Writing Good Tests

1. **Follow AAA Pattern:**
   - **Arrange:** Set up test data
   - **Act:** Execute the function
   - **Assert:** Verify the result

2. **Use Descriptive Names:**
   ```typescript
   // ✅ Good
   it('should return cache MISS when no data found', () => {})

   // ❌ Bad
   it('test cache', () => {})
   ```

3. **Test One Thing Per Test:**
   ```typescript
   // ✅ Good
   it('should normalize domain to lowercase', () => {})
   it('should remove www prefix from domain', () => {})

   // ❌ Bad
   it('should normalize domain', () => {
     // Tests lowercase, www removal, protocol removal...
   })
   ```

4. **Use Meaningful Assertions:**
   ```typescript
   // ✅ Good
   expect(result.percentage).toBeGreaterThan(90)
   expect(result.matchingFields).toContain('domain')

   // ❌ Bad
   expect(result).toBeTruthy()
   ```

5. **Keep Tests Independent:**
   - Each test should run in isolation
   - Don't rely on test execution order
   - Clean up after each test

6. **Mock External Dependencies:**
   ```typescript
   jest.mock('@/lib/supabase/server')
   ```

---

## Performance Testing

### Performance Benchmarks

| Operation | Target | Current |
|-----------|--------|---------|
| Parse 1000-row CSV | < 1s | TBD |
| Validate 1000 rows | < 2s | TBD |
| Duplicate detection (100 accounts) | < 5s | TBD |
| Cache lookup | < 50ms | TBD |

### Performance Test Script

```bash
# TO BE CREATED
npm run test:performance
```

---

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Cannot find module"
```bash
# Solution: Clear Jest cache
npm test -- --clearCache
```

**Issue:** Tests timeout
```bash
# Solution: Increase timeout
npm test -- --testTimeout=10000
```

**Issue:** Playwright browser not found
```bash
# Solution: Install browsers
npx playwright install
```

**Issue:** Coverage report not generated
```bash
# Solution: Run with coverage flag
npm run test:coverage
```

---

## Next Steps

### Immediate TODOs:

1. ✅ Create smoke test checklist
2. ✅ Set up Jest configuration
3. ✅ Create unit tests for CSV parser
4. ✅ Create unit tests for duplicate detection
5. ✅ Create unit tests for enrichment cache
6. ✅ Create test fixtures
7. 🔄 Run smoke tests manually
8. 🔄 Run unit tests and verify they pass
9. 🔄 Create integration tests
10. 🔄 Create E2E tests
11. 🔄 Set up CI/CD pipeline
12. 🔄 Achieve target coverage

### Future Enhancements:

- Visual regression testing
- Load testing
- Security testing
- Accessibility testing
- Mobile testing
- Cross-browser testing

---

## Resources

- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Playwright Documentation:** https://playwright.dev/docs/intro
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro/
- **Test Coverage Tools:** https://istanbul.js.org/

---

## Questions?

If you have questions about testing:
1. Check this documentation
2. Review existing tests for examples
3. Ask in team Slack/Discord
4. Open an issue in GitHub

---

**Last Updated:** October 24, 2025
**Maintained By:** Development Team
