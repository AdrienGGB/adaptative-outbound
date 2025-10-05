# Multi-Environment Supabase Setup - Complete Report

**Date:** October 5, 2025
**Project:** Adaptive Outbound
**Status:** ✅ Local Complete | ⚠️ Staging Pending | ⏳ Production Pending

---

## Executive Summary

Successfully configured a complete 3-environment Supabase setup for the Adaptive Outbound project:

- ✅ **Local Development** (Docker) - Fully operational
- ⚠️ **Staging** (Cloud) - Configuration ready, migration pending
- ⏳ **Production** (Cloud) - Awaiting creation

All environment files are configured, migration is tested and ready, and comprehensive documentation has been created.

---

## 1. Local Development Environment ✅

### Status: FULLY OPERATIONAL

**Configuration Details:**
- **API URL:** http://127.0.0.1:54331
- **Database URL:** postgresql://postgres:postgres@127.0.0.1:54332/postgres
- **Studio URL:** http://127.0.0.1:54333
- **Inbucket (Email):** http://127.0.0.1:54334

**Credentials:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**Database Tables Created:**
| Table | Status | Description |
|-------|--------|-------------|
| profiles | ✅ Created | User profiles (extends auth.users) |
| workspaces | ✅ Created | Team workspaces |
| workspace_members | ✅ Created | Workspace membership with RBAC |
| workspace_invitations | ✅ Created | Pending team invitations |
| user_sessions | ✅ Created | Session tracking for "logout all devices" |
| api_keys | ✅ Created | Programmatic API access |
| audit_logs | ✅ Created | Activity audit trail |
| system_controls | ✅ Created | Feature flags & system settings |

**Initial Data Seeded:**
- 6 system control records (feature flags)
- Default settings configured

**Verification:**
- ✅ Supabase containers running
- ✅ Database migration applied successfully
- ✅ All tables and indexes created
- ✅ RLS policies enabled
- ✅ Helper functions deployed
- ✅ Web app builds successfully
- ✅ Environment file configured

**Start/Stop Commands:**
```bash
# Start
cd "/Users/adriengaignebet/Documents/Tech/Adaptive Outbound"
supabase start

# Stop
supabase stop

# Reset database
supabase db reset
```

---

## 2. Staging Environment (Cloud) ⚠️

### Status: CONFIGURATION READY, MIGRATION PENDING

**Project Details:**
- **Project Ref:** hymtbydkynmkyesoaucl
- **Project URL:** https://hymtbydkynmkyesoaucl.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
- **Region:** eu-west-3 (Paris)

**Credentials Configured:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hymtbydkynmkyesoaucl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bXRieWRreW5ta3llc29hdWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTc0NjksImV4cCI6MjA3NTA3MzQ2OX0.4vS3hNZ_e49k050AsIk8cdFAQfidMXUHiTIA_hz41tM
SUPABASE_SERVICE_ROLE_KEY=[NEEDS TO BE OBTAINED FROM DASHBOARD]
```

**Environment File:** `web-app/.env.staging` (created, needs service role key)

**Actions Required:**

1. **Apply Database Migration** (2 options):

   **Option A: Via Supabase Dashboard (Recommended)**
   - Go to SQL Editor in dashboard
   - Run `supabase/migrations/001_auth_and_workspaces.sql`
   - Detailed instructions: `docs/APPLY_MIGRATION_TO_STAGING.md`

   **Option B: Via CLI** (requires database password)
   ```bash
   supabase link --project-ref hymtbydkynmkyesoaucl
   supabase db push
   ```

2. **Get Service Role Key:**
   - Dashboard > Settings > API > service_role key
   - Update `web-app/.env.staging`

3. **Configure Vercel Environment Variables** (Preview scope):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hymtbydkynmkyesoaucl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]
   NODE_ENV=staging
   ```

4. **Test Deployment:**
   ```bash
   git checkout -b test-staging
   git push origin test-staging
   # Vercel auto-deploys preview with staging environment
   ```

**Migration File Ready:**
- Location: `/Users/adriengaignebet/Documents/Tech/Adaptive Outbound/supabase/migrations/001_auth_and_workspaces.sql`
- Status: ✅ Tested locally, ready to apply
- Size: 540 lines

---

## 3. Production Environment (Cloud) ⏳

### Status: NOT CREATED YET

**To Create:**

1. **Create Supabase Project:**
   - Go to: https://supabase.com/dashboard
   - Click "New Project"
   - Name: `adaptive-outbound-production`
   - Region: eu-west-3 (or closest to users)
   - Generate strong database password
   - Save password securely

2. **Get Credentials:**
   - After creation: Settings > API
   - Copy Project URL, anon key, service_role key

3. **Update Environment File:**
   - Edit `web-app/.env.production` with actual credentials

4. **Apply Migration:**
   - Same process as staging
   - Use SQL Editor or CLI

5. **Configure Vercel (Production scope):**
   ```
   NEXT_PUBLIC_SUPABASE_URL=[production-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
   NODE_ENV=production
   ```

6. **Configure Auth Redirect URLs:**
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   ```

**Environment File Template:** `web-app/.env.production` (created with placeholders)

---

## 4. Files Created/Modified

### Configuration Files

| File | Status | Description |
|------|--------|-------------|
| `supabase/config.toml` | ✅ Updated | Configured custom ports to avoid conflicts |
| `supabase/migrations/001_auth_and_workspaces.sql` | ✅ Fixed | Reorganized to create tables before RLS policies |
| `web-app/.env.local` | ✅ Created | Local development configuration |
| `web-app/.env.staging` | ✅ Created | Staging configuration (needs service role key) |
| `web-app/.env.production` | ✅ Created | Production template |
| `web-app/.env.example` | ✅ Updated | Environment template for git |
| `.gitignore` | ✅ Updated | Added .env.staging and .env.production |

### Documentation Files

| File | Description |
|------|-------------|
| `docs/ENVIRONMENT_SETUP.md` | Comprehensive environment setup guide |
| `docs/QUICK_START.md` | Quick reference for developers |
| `docs/APPLY_MIGRATION_TO_STAGING.md` | Step-by-step staging migration guide |
| `ENVIRONMENT_SETUP_REPORT.md` | This file - complete setup report |

---

## 5. Supabase Configuration

### Ports Configuration (Local)

Custom ports to avoid conflicts with other local Supabase instances:

| Service | Port |
|---------|------|
| API/Kong | 54331 |
| PostgreSQL | 54332 |
| Studio | 54333 |
| Inbucket (Email) | 54334 |
| Analytics | 54337 |
| Pooler | 54339 |

### Database Schema

**8 Tables Created:**

1. **profiles** - User profile data
   - Links to auth.users
   - Auto-created on signup via trigger
   - RLS: Users can view/update own profile

2. **workspaces** - Team/organization workspaces
   - Owned by a user
   - Has plan (free/pro/enterprise)
   - RLS: Members can view, owners can update

3. **workspace_members** - Team membership
   - Links users to workspaces
   - RBAC roles: admin, sales_manager, sdr, ae
   - RLS: Members can view, admins can manage

4. **workspace_invitations** - Pending invites
   - Token-based invitations
   - 7-day expiration
   - RLS: Admins only

5. **user_sessions** - Session tracking
   - For "logout all devices" feature
   - Tracks device info
   - RLS: Users can view/delete own sessions

6. **api_keys** - Programmatic access
   - Scoped permissions
   - Revocable
   - RLS: Admins can manage

7. **audit_logs** - Activity logging
   - Workspace-level auditing
   - Immutable (insert only)
   - RLS: Admins can view

8. **system_controls** - Feature flags
   - Global feature toggles
   - RLS: Everyone can view, admins can update

**Helper Functions:**
- `create_workspace_with_owner()` - Creates workspace + adds owner as admin
- `get_user_workspace_role()` - Gets user's role in workspace
- `user_has_permission()` - Checks role hierarchy permissions
- `handle_new_user()` - Auto-creates profile on signup
- `update_updated_at_column()` - Auto-updates timestamps

---

## 6. Security Configuration

### Row Level Security (RLS)

**All tables have RLS enabled with appropriate policies:**

- ✅ profiles: User can only access their own
- ✅ workspaces: Members-only visibility
- ✅ workspace_members: Members can view, admins manage
- ✅ workspace_invitations: Admins only
- ✅ user_sessions: User's own sessions only
- ✅ api_keys: Admins only
- ✅ audit_logs: Admins can view, system can insert
- ✅ system_controls: Public read, admin write

### Environment Variables Security

**Git-ignored files:**
- ✅ .env.local
- ✅ .env.staging
- ✅ .env.production
- ✅ All .env*.local files

**Git-committed files:**
- ✅ .env.example (template only)
- ✅ No actual credentials in git

### Keys Management

**Local Development:**
- Using demo keys (safe for local use)
- No real user data

**Staging/Production:**
- Service role keys must be obtained from dashboard
- Never expose to frontend
- Store securely (1Password, env vars)

---

## 7. Vercel Deployment Configuration

### Environment Variable Scopes

| Environment | Vercel Scope | Supabase Project |
|-------------|--------------|------------------|
| Local Dev | N/A (uses .env.local) | Local Docker |
| Preview/Staging | Preview | hymtbydkynmkyesoaucl |
| Production | Production | TBD (not created) |

### Configuration Commands

**For Staging (Preview):**
```bash
# Via Vercel Dashboard
# Settings > Environment Variables > Add variables with "Preview" scope

# Or via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add NODE_ENV preview
```

**For Production:**
```bash
# Same as above but with "Production" scope
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# etc...
```

---

## 8. Testing & Verification

### Local Environment Tests

**Completed:**
- ✅ Supabase starts successfully
- ✅ Database migration applies cleanly
- ✅ All tables created with correct schema
- ✅ RLS policies active
- ✅ Helper functions deployed
- ✅ Web app builds without errors
- ✅ Environment variables loaded correctly
- ✅ Supabase clients configured

**Test Commands:**
```bash
# Verify Supabase running
supabase status

# Check tables
docker exec supabase_db_Adaptive_Outbound psql -U postgres -c "\dt public.*"

# Build web app
cd web-app && npm run build

# Start dev server
npm run dev
```

### Staging Tests (Pending)

**After migration applied:**
1. [ ] Sign up test user via preview deployment
2. [ ] Verify user in Supabase Dashboard > Authentication
3. [ ] Create test workspace
4. [ ] Invite test user
5. [ ] Verify RLS policies work
6. [ ] Check audit logs

### Production Tests (Pending)

**After production setup:**
1. [ ] Smoke test all core features
2. [ ] Verify SSL/HTTPS
3. [ ] Test authentication flows
4. [ ] Monitor performance
5. [ ] Set up alerts

---

## 9. Migration Strategy

### Local to Staging

**Current Approach:**
1. ✅ Develop and test locally
2. ✅ Create migration file
3. ⏳ Apply manually to staging via dashboard
4. ⏳ Test in preview deployment
5. ⏳ Verify all features work

**Future: Automated via CLI**
```bash
# Once linked
supabase db push
```

### Staging to Production

**Recommended Flow:**
1. Test thoroughly in staging
2. Create production project
3. Apply same migration
4. Deploy via main branch
5. Monitor closely

**Rollback Plan:**
- Keep migration files version controlled
- Database backups before major changes
- Can restore from Supabase dashboard

---

## 10. Troubleshooting Guide

### Issue: Port Conflicts

**Symptoms:** "port already allocated" error

**Solution:**
```bash
# Stop other Supabase instances
supabase stop --project-id other_project

# Or change ports in supabase/config.toml
```

### Issue: Migration Fails

**Symptoms:** SQL errors during migration

**Solutions:**
- Check if tables already exist (drop first)
- Verify foreign key order
- Run with --debug flag
- Check RLS policies reference existing tables

### Issue: Web App Can't Connect

**Symptoms:** Connection errors in browser

**Solutions:**
```bash
# Verify Supabase is running
supabase status

# Check environment variables
cat web-app/.env.local

# Restart Next.js
cd web-app && npm run dev
```

### Issue: Vercel Deployment Fails

**Symptoms:** Build fails in Vercel

**Solutions:**
- Verify environment variables are set
- Check build logs for specific errors
- Ensure NEXT_PUBLIC_ prefix on client vars
- Test build locally first

---

## 11. Next Steps & Action Items

### Immediate Actions (Priority 1)

**Staging Environment:**
- [ ] Go to Supabase Dashboard for staging project
- [ ] Apply migration via SQL Editor (see `docs/APPLY_MIGRATION_TO_STAGING.md`)
- [ ] Get service role key from Settings > API
- [ ] Update `web-app/.env.staging` with service role key
- [ ] Configure Vercel Preview environment variables
- [ ] Deploy test branch and verify connection

**Production Environment:**
- [ ] Create new Supabase project for production
- [ ] Choose appropriate plan (Pro recommended)
- [ ] Apply migration
- [ ] Get all credentials
- [ ] Update `web-app/.env.production`
- [ ] Configure Vercel Production environment variables

### Short-term Improvements (Priority 2)

- [ ] Set up database backups (Supabase dashboard)
- [ ] Configure OAuth providers (Google, Microsoft)
- [ ] Set up custom email templates
- [ ] Configure auth redirect URLs for production domain
- [ ] Set up monitoring and alerts
- [ ] Create seed data for development

### Long-term Enhancements (Priority 3)

- [ ] Automate migration deployment via CI/CD
- [ ] Set up staging <-> production sync process
- [ ] Implement database seeding for tests
- [ ] Configure read replicas for production
- [ ] Set up Point-in-Time Recovery (PITR)
- [ ] Implement database migration testing in CI

---

## 12. Documentation Index

All documentation is in the `docs/` directory:

| Document | Purpose | Audience |
|----------|---------|----------|
| `ENVIRONMENT_SETUP.md` | Complete setup guide | All developers |
| `QUICK_START.md` | Quick reference | Daily development |
| `APPLY_MIGRATION_TO_STAGING.md` | Staging migration steps | DevOps/Admin |
| `ENVIRONMENT_SETUP_REPORT.md` | This summary report | Project stakeholders |

**Also see:**
- `CLAUDE.md` - Project setup and conventions
- `PROJECT_HISTORY.md` - Project timeline and decisions

---

## 13. Useful Commands Reference

### Supabase Local

```bash
# Start/stop
supabase start
supabase stop
supabase status

# Database
supabase db reset              # Reset and reapply all migrations
supabase db diff -f name       # Create new migration
supabase db push              # Push to remote (when linked)

# Studio
open http://127.0.0.1:54333

# Logs
supabase logs db              # Database logs
supabase logs auth            # Auth logs
```

### Web App

```bash
# Development
cd web-app
npm run dev                   # Uses .env.local

# Build and test
npm run build
npm run start

# Test with different env
cp .env.staging .env.local
npm run dev
# (restore .env.local when done)
```

### Git & Deployment

```bash
# Deploy to staging (preview)
git checkout -b feature/my-feature
git push origin feature/my-feature

# Deploy to production
git checkout main
git merge dev
git push origin main

# Vercel CLI
vercel env ls                 # List environment variables
vercel env add KEY scope      # Add environment variable
```

---

## 14. Support & Resources

### Internal Documentation

- 📁 `/docs/ENVIRONMENT_SETUP.md` - Detailed setup guide
- 📁 `/docs/QUICK_START.md` - Quick reference
- 📁 `/docs/APPLY_MIGRATION_TO_STAGING.md` - Staging migration steps

### External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Project Links

- **Local Supabase Studio:** http://127.0.0.1:54333
- **Staging Dashboard:** https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
- **Production Dashboard:** TBD (project not created)

---

## 15. Summary & Success Metrics

### What Was Accomplished ✅

1. **Local Development Environment**
   - ✅ Supabase initialized and running
   - ✅ Database migration created and applied
   - ✅ 8 tables with full schema deployed
   - ✅ RLS policies configured
   - ✅ Helper functions deployed
   - ✅ Environment file configured
   - ✅ Web app tested and working

2. **Staging Configuration**
   - ✅ Environment file created
   - ✅ Credentials configured (except service role)
   - ✅ Migration ready to apply
   - ✅ Documentation created

3. **Production Preparation**
   - ✅ Environment file template created
   - ✅ Documentation for setup created
   - ✅ Migration tested and ready

4. **Documentation**
   - ✅ Comprehensive setup guide
   - ✅ Quick start reference
   - ✅ Staging migration steps
   - ✅ This complete report

### Success Criteria Status

| Criteria | Status |
|----------|--------|
| Local Supabase running in Docker | ✅ Complete |
| Migration applied to local | ✅ Complete |
| Staging Supabase configured | ✅ Ready (migration pending) |
| Production Supabase configured | ⏳ Template ready |
| Environment variables configured | ✅ Local complete, staging/prod ready |
| Vercel configuration documented | ✅ Complete |
| Documentation created | ✅ Complete |
| All environments tested | ✅ Local tested, staging/prod pending |

### Key Achievements

1. **Zero-configuration local development** - Developers can start coding immediately
2. **Clear migration path** - From local → staging → production
3. **Comprehensive documentation** - Step-by-step guides for all scenarios
4. **Security best practices** - No credentials in git, RLS enabled
5. **Scalable architecture** - Ready for team growth

---

## 16. Contact & Maintenance

**Last Updated:** October 5, 2025
**Maintained By:** Development Team
**Review Schedule:** Monthly or after major changes

**For Issues:**
- Check `docs/ENVIRONMENT_SETUP.md` troubleshooting section
- Review Supabase logs: `supabase logs`
- Contact DevOps team for cloud access issues

**To Update This Document:**
- Keep in sync with actual environment state
- Update after creating production environment
- Document any migration issues encountered

---

**END OF REPORT**
