# Testing Quick Reference Card

Quick commands and info for testing F044 & F001 features.

---

## Run Tests

```bash
cd web-app

# All tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Specific file
npm test -- csv-parser.test.ts

# E2E tests
npm run test:e2e
```

---

## Test Files

| File | Tests | What It Tests |
|------|-------|---------------|
| `csv-parser.test.ts` | 16 | CSV parsing, validation, transformations |
| `duplicate-detection.test.ts` | 46 | Fuzzy matching, similarity scoring |
| `enrichment-cache.test.ts` | 27 | Cache hit/miss, expiration, stats |

**Total:** 89 tests ✅

---

## Test Fixtures

Location: `/web-app/tests/fixtures/`

- `test-accounts-valid.csv` - 5 valid accounts
- `test-accounts-missing-required.csv` - Missing required fields
- `test-accounts-invalid-types.csv` - Invalid data types
- `test-accounts-invalid.csv` - Malformed CSV

---

## Manual Smoke Tests

See: `/docs/testing/F044-F001-SMOKE-TESTS.md`

**25 smoke tests** covering:
- CSV Import (10 tests)
- Enrichment Cache (5 tests)
- Duplicate Detection (10 tests)

---

## Key Algorithms

### CSV Parser
- `parseCSVFile()` - Parse CSV with papaparse
- `validateRow()` - Validate single row
- `transformValue()` - Convert data types

### Duplicate Detection
- `normalizeDomain()` - Clean domain names
- `fuzzyMatch()` - String similarity (0-1 score)
- `calculateAccountSimilarity()` - Account duplicate score

**Scoring:**
- Accounts: Domain (40) + Name (30) + Email (20) + City (10) = 100
- Contacts: Email (50) + Name (30) + LinkedIn (20) = 100
- Threshold: 80%+ = duplicate

### Enrichment Cache
- `checkCache()` - Look up cached data
- `writeCache()` - Store enrichment data
- TTL: 30 days

---

## Coverage

```bash
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

**Target:** 70%+ coverage for critical files

---

## Debugging

```bash
# Verbose output
npm test -- --verbose

# Debug specific test
npm test -- -t "should validate a valid row"

# Run in Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## CI/CD (Future)

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npm test -- --coverage
```

---

## Status

| Category | Status |
|----------|--------|
| Unit Tests | ✅ 89 passing |
| Integration Tests | 🔄 Pending |
| E2E Tests | 🔄 Pending |
| Smoke Tests | 🔄 Manual testing required |

---

## Next Steps

1. **Run manual smoke tests** - Use checklist
2. **Check coverage** - `npm run test:coverage`
3. **Fix bugs found** - Update tests
4. **Add integration tests** - Database, API routes
5. **Add E2E tests** - Critical user flows

---

## Help

- **Smoke Tests:** `/docs/testing/F044-F001-SMOKE-TESTS.md`
- **Full Guide:** `/docs/testing/F044-F001-TESTING-GUIDE.md`
- **Summary:** `/docs/testing/F044-F001-TEST-SUMMARY.md`
- **This Card:** `/docs/testing/TESTING-QUICK-REFERENCE.md`

---

**Updated:** October 24, 2025
