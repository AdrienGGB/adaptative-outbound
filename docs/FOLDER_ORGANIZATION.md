# Project Folder Organization

This document describes the reorganized folder structure of the Adaptive Outbound project.

## Root Directory Structure

```
adaptive-outbound/
├── .github/                    # GitHub configuration
│   └── workflows/             # CI/CD pipelines
├── .vscode/                   # VSCode workspace settings
│   └── settings.json          # Shared VSCode configuration
├── docs/                      # All project documentation (see below)
├── mobile-app/                # React Native mobile application
├── shared/                    # Shared code between web and mobile
├── supabase/                  # Supabase backend configuration
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge functions
│   └── debug-queries/        # SQL debug scripts
├── web-app/                   # Next.js web application
├── .gitignore                # Git ignore rules
├── CLAUDE.md                 # Claude Code development guide
└── README.md                 # Project overview
```

## Documentation Organization (`docs/`)

All documentation has been organized into logical subdirectories:

### `/docs/bug-fixes/`
Bug fix reports and resolution documentation:
- `BUG_FIXES_APPLIED.md` - Applied bug fixes log
- `BUG_FIXES_CODE.md` - Code-level bug fix details
- `CRITICAL_BUGS_SUMMARY.md` - Critical bugs overview
- `RLS_RECURSION_FIX_SUMMARY.md` - RLS infinite recursion fixes

### `/docs/testing/`
Testing strategies, reports, and guides:
- `F002_COMPREHENSIVE_TESTING_REPORT.md` - Comprehensive test report
- `F002_COMPREHENSIVE_TEST_STRATEGY.md` - Full test strategy
- `F002_TESTING_REPORT.md` - Testing execution report

### `/docs/development/`
Development history and logs:
- `PROJECT_HISTORY.md` - Complete project development history

### `/docs/features/`
Feature-specific documentation and specifications

### `/docs/reports/`
Analysis reports, audits, and reviews

### `/docs/setup/`
Setup guides and configuration documentation

### `/docs/tests/`
Test specifications and test-related documentation

### Root-level docs
Key documents that remain at the docs root:
- `README.md` - Documentation index
- `QUICK_START.md` - Quick start guide
- `ARCHITECTURE_DIAGRAM.md` - System architecture
- `DEPLOYMENT_STRATEGY.md` - Deployment guidelines
- `ENVIRONMENT_SETUP.md` - Environment setup
- `OAUTH_SETUP_GUIDE.md` - OAuth configuration
- `SETUP_CHECKLIST.md` - Setup checklist

## Key Changes Made

### Before (Root Directory)
```
adaptive-outbound/
├── BUG_FIXES_APPLIED.md
├── BUG_FIXES_CODE.md
├── CLAUDE.md
├── CRITICAL_BUGS_SUMMARY.md
├── F002_COMPREHENSIVE_TESTING_REPORT.md
├── F002_COMPREHENSIVE_TEST_STRATEGY.md
├── F002_TESTING_REPORT.md
├── PROJECT_HISTORY.md
├── RLS_RECURSION_FIX_SUMMARY.md
├── debug_members_query.sql
├── settings.json
├── docs/
├── mobile-app/
├── shared/
├── supabase/
└── web-app/
```

### After (Organized)
```
adaptive-outbound/
├── .vscode/
│   └── settings.json          # Moved from root
├── docs/
│   ├── bug-fixes/            # Bug fix docs moved here
│   ├── testing/              # Testing docs moved here
│   ├── development/          # Development history moved here
│   └── ...
├── supabase/
│   └── debug-queries/        # SQL debug files moved here
├── CLAUDE.md                 # Kept at root (main dev guide)
├── README.md                 # New project overview
└── ...
```

## Benefits of This Organization

1. **Cleaner Root** - Only essential files at project root
2. **Logical Grouping** - Related documents grouped together
3. **Easy Navigation** - Clear hierarchy makes finding docs easier
4. **Scalability** - Easy to add new docs in appropriate categories
5. **Standard Structure** - Follows common monorepo conventions

## Finding Documents

### Quick Reference

| Document Type | Location | Example |
|--------------|----------|---------|
| Bug fixes | `docs/bug-fixes/` | RLS recursion fixes |
| Testing | `docs/testing/` | Test strategies |
| Development logs | `docs/development/` | Project history |
| Features | `docs/features/` | Feature specs |
| Setup guides | `docs/setup/` or `docs/*.md` | Environment setup |
| SQL debug scripts | `supabase/debug-queries/` | Debug queries |
| IDE settings | `.vscode/` | VSCode config |

### Main Entry Points

1. **New to the project?** → Start with [README.md](../README.md)
2. **Setting up development?** → See [CLAUDE.md](../CLAUDE.md)
3. **Need quick start?** → Check [docs/QUICK_START.md](./QUICK_START.md)
4. **Understanding architecture?** → Read [docs/ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
5. **Deploying?** → Follow [docs/DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)

## Maintenance Guidelines

### Adding New Documentation

1. **Bug fixes** → `docs/bug-fixes/[descriptive-name].md`
2. **Test reports** → `docs/testing/[feature-or-test-name].md`
3. **Feature docs** → `docs/features/[feature-name]/`
4. **Analysis reports** → `docs/reports/[report-type].md`
5. **Development logs** → Append to `docs/development/PROJECT_HISTORY.md`

### Naming Conventions

- Use descriptive, kebab-case names: `rls-recursion-fix.md`
- Prefix with feature codes when applicable: `F002_TESTING_REPORT.md`
- Use uppercase for important root docs: `README.md`, `CLAUDE.md`
- Date-stamp time-sensitive reports: `performance-audit-2024-10.md`

### Git Ignore Rules

- Debug SQL files at root are ignored: `**/debug_*.sql`
- Debug files in `supabase/debug-queries/` are tracked
- VSCode settings are tracked, but other `.vscode/` files are ignored

## Migration Checklist

- [x] Create organized folder structure
- [x] Move bug fix documentation to `docs/bug-fixes/`
- [x] Move testing documentation to `docs/testing/`
- [x] Move development history to `docs/development/`
- [x] Move SQL debug files to `supabase/debug-queries/`
- [x] Move settings.json to `.vscode/`
- [x] Update CLAUDE.md with new structure
- [x] Create README.md at root
- [x] Update .gitignore for new structure
- [x] Create this organization guide

## Questions?

Refer to [CLAUDE.md](../CLAUDE.md) for complete development guidelines or check the [docs README](./README.md) for documentation index.
