# Adaptive Outbound - Project Structure

**Last Updated:** 2025-10-25
**Branch:** feature/F044-data-pipeline

## Overview

This document provides a complete overview of the Adaptive Outbound monorepo structure, explaining where different types of files belong.

## Root Directory Structure

```
Adaptive Outbound/
├── .claude/                    # Claude Code configuration
│   ├── agents/                # Specialized AI agents
│   └── CONTEXT7.md           # MCP server configuration
├── .github/                   # GitHub workflows and configs
│   └── BRANCHING_STRATEGY.md # Git workflow documentation
├── docs/                      # Project documentation (see below)
├── mobile-app/                # React Native mobile app
├── shared/                    # Shared code (planned)
├── supabase/                  # Database and backend
│   ├── migrations/           # Database migrations
│   ├── debug-queries/        # SQL debugging scripts
│   └── seed_test_data.sql   # Test data seeding
├── web-app/                   # Next.js web application
├── CLAUDE.md                  # Claude Code instructions
└── README.md                  # Project overview

```

## Documentation Structure (docs/)

### Root-Level Documentation
```
docs/
├── README.md                   # Documentation index
├── ARCHITECTURE_DIAGRAM.md     # System architecture overview
├── DEPLOYMENT_STRATEGY.md      # Deployment guidelines
├── ENVIRONMENT_SETUP.md        # Environment configuration
├── FOLDER_ORGANIZATION.md      # File organization guide
├── PROJECT_STRUCTURE.md        # This file
├── QUICK_START.md             # Quick setup guide
└── SETUP_CHECKLIST.md         # Setup verification checklist
```

**Purpose:** High-level guides for setting up and understanding the project.

### Subdirectories

#### `/bug-fixes` - Bug Reports and Fixes
```
docs/bug-fixes/
├── BUG001_apollo_api_key_save_failure.md
├── BUG001_FIX_REPORT.md
├── BUG001_SUMMARY.md
├── BUG-003_NEXTJS15_ASYNC_PARAMS.md
├── BUG_FIXES_APPLIED.md
├── BUG_FIXES_CODE.md
├── CRITICAL_BUGS_SUMMARY.md
├── F044-signup-database-error-fix.md
├── MEMBER_PAGE_400_ERROR_FIX.md
├── MEMBER_PAGE_COMPLETE_FIX_SUMMARY.md
├── PRODUCTION_MIGRATION_GUIDE.md
├── RLS_RECURSION_FIX_SUMMARY.md
├── WORKSPACE_DELETE_FIX.md
└── WORKSPACE_DELETE_SUMMARY.md
```

**Purpose:** Detailed bug reports, fixes, and post-mortems.

#### `/design` - Design Specifications
```
docs/design/
└── BRAND_COLORS.md             # Brand color palette
```

**Purpose:** Design system documentation, UI/UX specs, brand guidelines.

#### `/development` - Development Guides
```
docs/development/
├── APPLY_MIGRATION_TO_STAGING.md   # Migration deployment guide
├── F044-deployment-workflow.md     # F044 deployment steps
├── INTEGRATION_REVIEW.md           # Integration testing guide
├── PROJECT_HISTORY.md              # Chronological development log
└── UI_LAYOUT_GUIDELINES.md         # UI layout standards
```

**Purpose:** Developer guides, workflows, and project history.

#### `/features` - Feature Specifications
```
docs/features/
├── F001: Data Integration Hub.md
├── F002: Account Database & Core Data Schema.md
├── F002_PRODUCTION_READINESS_REPORT.md
├── F004: User Authentication & Authorization System.md
├── F004_COMPLETION_SUMMARY.md
├── F005: API Gateway.md
├── F007: Account Scoring.md
├── F008: Target List Builder.md
├── F016: AI Message Generator.md
├── F019: Sequence Builder.md
├── F020: Email Integration.md
├── F023: Sequence Executor.md
├── F026: Performance Analytics.md
├── F030: CRM Native Integrations.md
├── F044-A-testing-guide.md
├── F044-csv-import-specification.md
├── F044: Data Pipeline.md
├── F045: Multi-Provider Enrichment.md
├── OAUTH_SETUP_GUIDE.md
└── UX001-navigation-redesign.md
```

**Purpose:** Detailed feature specifications, requirements, and completion reports.

#### `/reports` - Analysis and Test Reports
```
docs/reports/
├── ENVIRONMENT_SETUP_REPORT.md
├── F004-WORKSPACE-CREATION-TEST-REPORT.md
├── F004_FINAL_TEST_REPORT.md
├── F004_IMPLEMENTATION_REPORT.md
├── F004_STAGING_DEPLOYMENT_GUIDE.md
├── TEST-RESULTS-SUMMARY.md
└── WORKSPACE_CREATION_FIX_SUMMARY.md
```

**Purpose:** Implementation reports, deployment guides, and analysis summaries.

#### `/testing` - Testing Documentation
```
docs/testing/
├── F001-SMOKE-TEST-RESULTS.md      # F001 test results
├── F002_COMPREHENSIVE_TESTING_REPORT.md
├── F002_COMPREHENSIVE_TEST_STRATEGY.md
├── F002_TESTING_REPORT.md
├── F004_TESTING_GUIDE.md           # F004 testing guide
├── F044-F001-SMOKE-TESTS.md        # F044-F001 smoke tests
├── F044-F001-TEST-SUMMARY.md
├── F044-F001-TESTING-GUIDE.md
└── TESTING-QUICK-REFERENCE.md
```

**Purpose:** Test strategies, test guides, and test results.

#### `/tests` - Test Scripts and Queries
```
docs/tests/
├── QUICK-TEST-CHECKLIST.md
├── START-HERE.md
├── test-workspace-creation.sql
└── verify-workspace-creation.sql
```

**Purpose:** Executable test scripts, SQL queries, and checklists.

## Web App Structure (web-app/)

### Source Code Organization
```
web-app/src/
├── __tests__/                  # Unit tests
│   ├── lib/                   # Library tests
│   └── services/              # Service tests
├── app/                        # Next.js 15 App Router pages
│   ├── accounts/              # Account pages
│   ├── activities/            # Activities pages
│   ├── api/                   # API routes
│   ├── auth/                  # Authentication pages
│   ├── contacts/              # Contact pages
│   ├── duplicates/            # Duplicate management (F001)
│   ├── invitations/           # Invitation handling
│   ├── jobs/                  # Background jobs UI
│   ├── tasks/                 # Tasks pages
│   └── workspace/             # Workspace pages
├── components/                 # React components
│   ├── accounts/              # Account-specific components
│   ├── activities/            # Activity components
│   ├── auth/                  # Auth components
│   ├── contacts/              # Contact components
│   ├── import/                # CSV import components
│   ├── layout/                # Layout components (AppShell, Sidebar, etc.)
│   ├── tags/                  # Tag components
│   ├── tasks/                 # Task components
│   ├── ui/                    # shadcn/ui components
│   └── workspace/             # Workspace components
├── hooks/                      # Custom React hooks
│   ├── use-badge-counts.tsx   # Badge count state
│   ├── use-breadcrumbs.tsx    # Breadcrumb generation
│   └── use-sidebar.tsx        # Sidebar state
├── lib/                        # Utilities and configurations
│   ├── auth/                  # Auth context and helpers
│   ├── supabase/              # Supabase client setup
│   ├── validations/           # Zod validation schemas
│   ├── apollo-client.ts       # Apollo.io API client
│   ├── csv-parser.ts          # CSV parsing utility
│   ├── navigation.ts          # Navigation configuration
│   └── utils.ts               # General utilities
├── services/                   # Business logic services
│   ├── accounts.ts            # Account operations
│   ├── activities.ts          # Activity operations
│   ├── contacts.ts            # Contact operations
│   ├── custom-fields.ts       # Custom field operations
│   ├── duplicate-detection.ts # Duplicate detection (F001)
│   ├── enrichment-cache.ts    # Enrichment caching (F001)
│   ├── jobs.ts                # Background job operations
│   ├── tags.ts                # Tag operations
│   ├── tasks.ts               # Task operations
│   └── workspace-settings.ts  # Workspace settings
├── types/                      # TypeScript type definitions
│   ├── account.ts             # Account types
│   ├── activity.ts            # Activity types
│   ├── auth.ts                # Auth types
│   ├── contact.ts             # Contact types
│   ├── custom-field.ts        # Custom field types
│   ├── database.types.ts      # Generated Supabase types
│   ├── duplicates.ts          # Duplicate types (F001)
│   ├── enrichment-cache.ts    # Cache types (F001)
│   ├── import.ts              # Import types
│   ├── jobs.ts                # Job types
│   ├── tag.ts                 # Tag types
│   ├── task.ts                # Task types
│   └── workspace-settings.ts  # Workspace types
└── workers/                    # Background job workers
    ├── duplicate-detector.ts   # Duplicate detection worker
    ├── enrichment-processor.ts # Enrichment worker
    └── job-worker.ts          # Base job worker

```

### Testing Structure
```
web-app/
├── __tests__/                  # Unit tests (Jest)
├── tests/                      # E2E tests (Playwright)
│   ├── e2e/                   # E2E test specs
│   │   ├── accounts.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── contacts.spec.ts
│   │   ├── helpers/          # Test helpers
│   │   └── tasks.spec.ts
│   └── fixtures/              # Test data fixtures
└── test-results/               # Playwright test results
```

## Database Structure (supabase/)

```
supabase/
├── migrations/                 # Database migrations (sequential)
│   ├── 001_auth_and_workspaces.sql          # Initial schema
│   ├── 002_auto_create_default_workspace.sql
│   ├── 003_core_data_schema.sql             # F002 tables
│   ├── 20251019160926_f044_data_pipeline.sql # F044 jobs system
│   ├── 20251024000001_f001_enrichment_cache_and_duplicates.sql # F001
│   └── [timestamp]_[description].sql
├── debug-queries/              # SQL debugging and verification scripts
│   ├── apply_workspace_settings_fix.sql
│   ├── authenticated_member_queries.sql
│   ├── check_all_tables.sql
│   ├── check_profile_data.sql
│   ├── debug_members_query.sql
│   ├── find_missing_profiles.sql
│   ├── test_members_api_response.sql
│   ├── test_signup.sql
│   └── verify_email_migration.sql
└── seed_test_data.sql          # Test data for development
```

## File Naming Conventions

### Documentation Files
- **Bug Reports:** `BUG[###]_[short-description].md` or `[FEATURE]-[description]-fix.md`
- **Feature Specs:** `F###: [Feature Name].md`
- **Test Reports:** `[FEATURE]_[TYPE]_REPORT.md` or `[FEATURE]-TEST-RESULTS.md`
- **Guides:** `[DESCRIPTIVE_NAME]_GUIDE.md` or `[DESCRIPTION].md`
- **Reports:** `[FEATURE]_[TYPE]_REPORT.md`

### Database Migrations
- **Format:** `[timestamp]_[description].sql`
- **Example:** `20251024000001_f001_enrichment_cache_and_duplicates.sql`
- **Sequential numbering** for core migrations (001, 002, 003)

### Code Files
- **Components:** `kebab-case.tsx` (e.g., `account-card.tsx`)
- **Services:** `kebab-case.ts` (e.g., `duplicate-detection.ts`)
- **Types:** `kebab-case.ts` (e.g., `enrichment-cache.ts`)
- **Hooks:** `use-[name].tsx` (e.g., `use-sidebar.tsx`)
- **Tests:** `[filename].test.ts` (e.g., `csv-parser.test.ts`)

## Where to Put New Files

### Adding New Documentation
- **Bug fix:** → `docs/bug-fixes/BUG[###]_[description].md`
- **Feature spec:** → `docs/features/F###: [Feature Name].md`
- **Test report:** → `docs/testing/[FEATURE]-TEST-RESULTS.md`
- **Development guide:** → `docs/development/[GUIDE_NAME].md`
- **Design spec:** → `docs/design/[SPEC_NAME].md`
- **General setup/config:** → `docs/[NAME].md`

### Adding New Code
- **UI Component:** → `web-app/src/components/[category]/[component-name].tsx`
- **API Route:** → `web-app/src/app/api/[endpoint]/route.ts`
- **Page:** → `web-app/src/app/[route]/page.tsx`
- **Service:** → `web-app/src/services/[service-name].ts`
- **Type:** → `web-app/src/types/[type-name].ts`
- **Hook:** → `web-app/src/hooks/use-[hook-name].tsx`
- **Worker:** → `web-app/src/workers/[worker-name].ts`
- **Test:** → `web-app/src/__tests__/[category]/[filename].test.ts`

### Adding Database Changes
- **Migration:** → `supabase/migrations/[timestamp]_[description].sql`
- **Debug query:** → `supabase/debug-queries/[query-purpose].sql`
- **Seed data:** → `supabase/seed_test_data.sql`

## Key Principles

1. **Documentation follows code structure** - Each major feature has a folder
2. **Chronological migrations** - Database changes are timestamped and sequential
3. **Test files mirror source** - Tests in `__tests__` match `src` structure
4. **Component organization** - Group by feature/domain, not by type
5. **Type safety** - Every service has corresponding types
6. **Clear naming** - Descriptive file names that indicate purpose

## Migration Guide

If you need to move files, follow these steps:

1. **Identify the correct folder** using this guide
2. **Move the file** using `git mv` to preserve history
3. **Update any links** in other documentation files
4. **Commit with clear message** explaining the reorganization
5. **Update this guide** if adding new categories

## Quick Reference

**Looking for...**
- Setup instructions? → `docs/QUICK_START.md` or `docs/SETUP_CHECKLIST.md`
- Bug fix details? → `docs/bug-fixes/`
- Feature specifications? → `docs/features/`
- Test results? → `docs/testing/` or `docs/reports/`
- Database schema? → `supabase/migrations/`
- API endpoints? → `web-app/src/app/api/`
- React components? → `web-app/src/components/`
- Business logic? → `web-app/src/services/`
- Type definitions? → `web-app/src/types/`

---

*This document is maintained as the project evolves. Last updated during F001 implementation.*
