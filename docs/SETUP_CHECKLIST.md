# Supabase Multi-Environment Setup Checklist

## ✅ Completed

- [x] Initialize Supabase locally
- [x] Configure custom ports to avoid conflicts
- [x] Create and test database migration
- [x] Start local Supabase instance
- [x] Apply migration to local database
- [x] Verify all tables created (8 tables)
- [x] Configure local environment variables (.env.local)
- [x] Create staging environment file (.env.staging)
- [x] Create production environment template (.env.production)
- [x] Update .env.example template
- [x] Update .gitignore for security
- [x] Test web app build with local Supabase
- [x] Create comprehensive documentation
- [x] Create quick start guide
- [x] Create staging migration guide

## ⏳ Pending - Staging Environment

### Apply Migration to Staging

- [ ] Go to https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
- [ ] Open SQL Editor
- [ ] Copy contents of `supabase/migrations/001_auth_and_workspaces.sql`
- [ ] Paste and run SQL in editor
- [ ] Verify all 8 tables are created
- [ ] Check system_controls table has 6 feature flag rows

### Configure Staging Credentials

- [ ] Go to Settings > API in Supabase dashboard
- [ ] Copy `service_role` key
- [ ] Update `web-app/.env.staging` with service role key
- [ ] Save file securely

### Configure Vercel for Staging

- [ ] Go to Vercel project settings
- [ ] Navigate to Environment Variables
- [ ] Add these variables with **Preview** scope:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NODE_ENV=staging
- [ ] Save all variables

### Test Staging Deployment

- [ ] Create test branch: `git checkout -b test-staging-setup`
- [ ] Make commit: `git commit --allow-empty -m "test: staging environment"`
- [ ] Push: `git push origin test-staging-setup`
- [ ] Check Vercel deployment
- [ ] Open preview URL
- [ ] Test user signup
- [ ] Verify user appears in Supabase Dashboard > Authentication

## ⏳ Pending - Production Environment

### Create Production Supabase Project

- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Fill in details:
  - [ ] Name: `adaptive-outbound-production` (or similar)
  - [ ] Organization: Choose your org
  - [ ] Database Password: Generate strong password
  - [ ] Region: `eu-west-3` (or closest to users)
  - [ ] Plan: Select appropriate tier
- [ ] Save password securely (1Password, etc.)
- [ ] Wait for project creation (2-3 minutes)

### Apply Migration to Production

- [ ] Go to new project dashboard
- [ ] Open SQL Editor
- [ ] Copy contents of `supabase/migrations/001_auth_and_workspaces.sql`
- [ ] Paste and run SQL
- [ ] Verify all tables created
- [ ] Check initial data seeded

### Get Production Credentials

- [ ] Go to Settings > API
- [ ] Copy and save:
  - [ ] Project URL
  - [ ] `anon` key (public)
  - [ ] `service_role` key (secret)
- [ ] Update `web-app/.env.production` with actual values

### Configure Production Authentication

- [ ] Go to Authentication > URL Configuration
- [ ] Add redirect URLs:
  - [ ] `https://yourdomain.com/auth/callback`
  - [ ] `https://yourdomain.com/**`
- [ ] Save configuration

### Configure Vercel for Production

- [ ] Go to Vercel project settings
- [ ] Navigate to Environment Variables
- [ ] Add these variables with **Production** scope:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NODE_ENV=production
- [ ] Save all variables

### Deploy to Production

- [ ] Merge to main: `git checkout main && git merge dev`
- [ ] Push: `git push origin main`
- [ ] Monitor Vercel deployment
- [ ] Open production URL
- [ ] Run smoke tests

## 🔐 Security Checklist

- [x] All .env files with credentials are git-ignored
- [x] .env.example committed as template (no real credentials)
- [ ] Service role keys stored securely (not in git)
- [ ] Database passwords stored securely (not in git)
- [ ] Vercel environment variables configured correctly
- [ ] RLS policies enabled on all tables
- [ ] No credentials exposed to frontend

## 📝 Documentation Checklist

- [x] `docs/ENVIRONMENT_SETUP.md` - Complete setup guide
- [x] `docs/QUICK_START.md` - Quick reference
- [x] `docs/APPLY_MIGRATION_TO_STAGING.md` - Staging steps
- [x] `ENVIRONMENT_SETUP_REPORT.md` - Summary report
- [x] This checklist file
- [ ] Update PROJECT_HISTORY.md with setup completion

## 🧪 Testing Checklist

### Local Environment
- [x] Supabase starts successfully
- [x] Database migration applies
- [x] All tables created
- [x] Web app builds
- [ ] User signup works
- [ ] Create workspace works
- [ ] RLS policies enforced

### Staging Environment
- [ ] Migration applied successfully
- [ ] All tables exist
- [ ] Web app connects to staging
- [ ] User signup works
- [ ] Authentication flow works
- [ ] Data persists correctly

### Production Environment
- [ ] Migration applied successfully
- [ ] All tables exist
- [ ] Web app connects to production
- [ ] SSL/HTTPS working
- [ ] Authentication flow works
- [ ] All features functional

## 🚀 Deployment Checklist

- [ ] Local → Staging pipeline tested
- [ ] Staging → Production process documented
- [ ] Rollback plan in place
- [ ] Database backup configured
- [ ] Monitoring set up
- [ ] Alerts configured

## 📚 Quick Reference

**Local Supabase:**
```bash
cd "/Users/adriengaignebet/Documents/Tech/Adaptive Outbound"
supabase start
open http://127.0.0.1:54333
```

**Staging Dashboard:**
https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl

**Documentation:**
- Setup guide: `docs/ENVIRONMENT_SETUP.md`
- Quick start: `docs/QUICK_START.md`
- Full report: `ENVIRONMENT_SETUP_REPORT.md`

---

**Progress:** 15/42 tasks completed (36%)

**Next Action:** Apply migration to staging environment (see `docs/APPLY_MIGRATION_TO_STAGING.md`)
