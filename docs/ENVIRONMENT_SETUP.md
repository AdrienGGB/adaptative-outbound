# Multi-Environment Supabase Setup

## Overview
This project uses a 3-environment setup for Supabase:
- **Local** (Docker) - for development
- **Staging** (Cloud) - for testing and preview deployments
- **Production** (Cloud) - for live users

## Environment Configuration

### 1. Local Development (Supabase Docker)

**Status:** ✅ Running

**Configuration:**
- API URL: `http://127.0.0.1:54331`
- Database URL: `postgresql://postgres:postgres@127.0.0.1:54332/postgres`
- Studio URL: `http://127.0.0.1:54333`
- Inbucket (Email Testing): `http://127.0.0.1:54334`

**Environment File:** `web-app/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NODE_ENV=development
```

**Commands:**
```bash
# Start local Supabase
cd "/Users/adriengaignebet/Documents/Tech/Adaptive Outbound"
supabase start

# Stop local Supabase
supabase stop

# View status
supabase status

# Reset database (reapply all migrations)
supabase db reset

# Open Studio in browser
open http://127.0.0.1:54333
```

**Database Tables Created:**
- ✅ profiles
- ✅ workspaces
- ✅ workspace_members
- ✅ workspace_invitations
- ✅ user_sessions
- ✅ api_keys
- ✅ audit_logs
- ✅ system_controls

---

### 2. Staging Environment (Supabase Cloud)

**Status:** ⚠️ Migration Pending

**Project Details:**
- Project Ref: `hymtbydkynmkyesoaucl`
- Project URL: `https://hymtbydkynmkyesoaucl.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl`

**Environment File:** `web-app/.env.staging`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hymtbydkynmkyesoaucl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bXRieWRreW5ta3llc29hdWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTc0NjksImV4cCI6MjA3NTA3MzQ2OX0.4vS3hNZ_e49k050AsIk8cdFAQfidMXUHiTIA_hz41tM
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_DASHBOARD]
NODE_ENV=staging
```

**How to Apply Migration to Staging:**

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl/editor
2. Click on "SQL Editor"
3. Copy the contents of `supabase/migrations/001_auth_and_workspaces.sql`
4. Paste and run the SQL
5. Verify tables are created in "Table Editor"

**Option 2: Via Supabase CLI** (requires database password)
```bash
# Link to staging project (requires DB password from dashboard)
supabase link --project-ref hymtbydkynmkyesoaucl

# Push migration
supabase db push
```

**Get Database Password:**
1. Go to https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl/settings/database
2. Click "Reset database password" if you don't have it
3. Save it securely (1Password, etc.)

**Get Service Role Key:**
1. Go to https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl/settings/api
2. Copy "service_role" key (under "Project API keys")
3. Update `web-app/.env.staging` file

---

### 3. Production Environment (Supabase Cloud)

**Status:** ⏳ Not Created Yet

**To Create Production Project:**

1. **Create New Supabase Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Organization: Choose your org
   - Name: `adaptive-outbound-production` (or similar)
   - Database Password: Generate strong password and save securely
   - Region: Choose closest to your users (e.g., `eu-west-3` for Europe)
   - Pricing Plan: Select appropriate plan

2. **Get Credentials**
   - After creation, go to Settings > API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` secret key (keep secure!)

3. **Update Environment File**

   Create/update `web-app/.env.production`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
   NODE_ENV=production
   ```

4. **Apply Migration**

   **Option 1: Via Dashboard**
   - Go to SQL Editor
   - Run `supabase/migrations/001_auth_and_workspaces.sql`

   **Option 2: Via CLI**
   ```bash
   supabase link --project-ref [production-ref]
   supabase db push
   ```

5. **Configure Authentication**
   - Go to Authentication > URL Configuration
   - Add redirect URLs:
     - `https://yourdomain.com/auth/callback`
     - `https://yourdomain.com/**` (wildcard)

6. **Set Up Storage Buckets** (if needed)
   - Go to Storage
   - Create buckets: `avatars`, `uploads`, etc.
   - Configure policies

---

## Vercel Configuration

### Staging (Preview Deployments)

Set environment variables for **Preview** environment in Vercel:

```bash
# Via Vercel Dashboard
1. Go to your project > Settings > Environment Variables
2. Add variables with scope = "Preview":
   - NEXT_PUBLIC_SUPABASE_URL=https://hymtbydkynmkyesoaucl.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
   - SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]
   - NODE_ENV=staging

# Via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add NODE_ENV preview
```

### Production (Main Branch)

Set environment variables for **Production** environment in Vercel:

```bash
# Via Vercel Dashboard
1. Go to your project > Settings > Environment Variables
2. Add variables with scope = "Production":
   - NEXT_PUBLIC_SUPABASE_URL=[production-url]
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
   - SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]
   - NODE_ENV=production

# Via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NODE_ENV production
```

---

## Switching Between Environments

### Local Development (Default)
```bash
# .env.local is used automatically by Next.js
cd web-app
npm run dev
# App connects to local Supabase (port 54331)
```

### Test Against Staging Locally
```bash
# Option 1: Temporarily copy .env.staging to .env.local
cp web-app/.env.staging web-app/.env.local
npm run dev

# Option 2: Use dotenv-cli
npm install --save-dev dotenv-cli
npx dotenv -e .env.staging npm run dev

# Don't forget to restore .env.local when done!
```

### Deploy to Staging
```bash
# Push to any branch (not main)
git checkout -b feature/my-feature
git push origin feature/my-feature
# Vercel automatically deploys with Preview (staging) environment
```

### Deploy to Production
```bash
# Merge to main branch
git checkout main
git pull origin main
git merge dev
git push origin main
# Vercel automatically deploys with Production environment
```

---

## Database Migrations

### Creating a New Migration

```bash
# Make changes to your local database using Studio
# Then generate a migration file
supabase db diff -f migration_name

# This creates: supabase/migrations/[timestamp]_migration_name.sql
```

### Applying Migrations

**Local:**
```bash
supabase db reset  # Applies all migrations from scratch
# or
supabase db push   # Applies new migrations only
```

**Staging/Production:**
```bash
# Option 1: CLI (requires link)
supabase db push --db-url [connection-string]

# Option 2: Manual via Dashboard
# Copy SQL from migration file
# Paste in SQL Editor and run
```

### Migration Best Practices

1. **Always test migrations locally first**
   ```bash
   supabase db reset  # Test full migration chain
   ```

2. **Apply to staging before production**
   ```bash
   # 1. Test locally
   # 2. Apply to staging
   # 3. Verify in staging
   # 4. Apply to production
   ```

3. **Backup before major changes**
   - Use Supabase dashboard to create backups
   - Or use `pg_dump` for local backups

4. **Never edit migration files after they're applied**
   - Create a new migration to make changes
   - Keep migration history intact

---

## Troubleshooting

### Local Supabase Won't Start

**Port conflicts:**
```bash
# Check which ports are in use
lsof -i :54331
lsof -i :54332
lsof -i :54333

# Stop conflicting services or change ports in supabase/config.toml
```

**Docker issues:**
```bash
# Restart Docker Desktop
# Or stop all Supabase containers
docker ps | grep supabase
docker stop [container-id]
```

### Cannot Connect to Cloud Database

**Check credentials:**
```bash
# Verify environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Check RLS policies:**
- Ensure Row Level Security policies allow your operations
- Test in Supabase Studio SQL editor with auth context

### Migration Fails

**Check for errors:**
```bash
# Run with debug flag
supabase db reset --debug
```

**Common issues:**
- Table already exists (drop manually or use `IF NOT EXISTS`)
- Foreign key constraints (ensure tables are created in correct order)
- RLS policies reference non-existent tables (create tables before policies)

---

## Security Best Practices

### Environment Variables

**DO:**
- ✅ Store in `.env.local`, `.env.staging`, `.env.production` (git-ignored)
- ✅ Use Vercel environment variables for deployments
- ✅ Keep service role keys secure (never expose to client)
- ✅ Commit `.env.example` as a template

**DON'T:**
- ❌ Commit actual `.env` files to git
- ❌ Share keys in Slack, email, or public channels
- ❌ Use production keys in development
- ❌ Expose service role key to frontend

### Database Access

**DO:**
- ✅ Use Row Level Security (RLS) policies
- ✅ Test policies thoroughly
- ✅ Use anon key for client-side operations
- ✅ Use service role key only for server-side admin operations

**DON'T:**
- ❌ Disable RLS on production tables
- ❌ Use wildcard policies (`USING (true)`) in production
- ❌ Store database password in code

---

## Quick Reference

### Supabase URLs

| Environment | URL | Dashboard |
|------------|-----|-----------|
| Local | http://127.0.0.1:54331 | http://127.0.0.1:54333 |
| Staging | https://hymtbydkynmkyesoaucl.supabase.co | [Dashboard](https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl) |
| Production | TBD | TBD |

### Common Commands

```bash
# Local Development
supabase start              # Start local instance
supabase stop               # Stop local instance
supabase status             # View connection info
supabase db reset           # Reset and reapply migrations
supabase db diff -f name    # Create new migration

# Cloud Deployment
supabase link --project-ref [ref]  # Link to cloud project
supabase db push                   # Push migrations to cloud
supabase db pull                   # Pull schema from cloud

# Web App
npm run dev                 # Start Next.js (uses .env.local)
npm run build               # Build for production
npm run start               # Start production server
```

### File Structure

```
/
├── supabase/
│   ├── config.toml                    # Local Supabase configuration
│   └── migrations/
│       └── 001_auth_and_workspaces.sql  # Database schema
├── web-app/
│   ├── .env.local              # Local environment (git-ignored)
│   ├── .env.staging            # Staging environment (git-ignored)
│   ├── .env.production         # Production environment (git-ignored)
│   ├── .env.example            # Template (git-committed)
│   └── src/
│       └── lib/
│           └── supabase/
│               ├── client.ts   # Browser client
│               └── server.ts   # Server client
└── docs/
    └── ENVIRONMENT_SETUP.md    # This file
```

---

## Next Steps

### Immediate Actions Required:

1. **Apply Migration to Staging:**
   - [ ] Go to Supabase Dashboard for staging project
   - [ ] Run migration SQL in SQL Editor
   - [ ] Get service role key and update `.env.staging`
   - [ ] Update Vercel preview environment variables

2. **Create Production Environment:**
   - [ ] Create new Supabase project
   - [ ] Apply migration
   - [ ] Get all credentials
   - [ ] Update `.env.production`
   - [ ] Update Vercel production environment variables

3. **Test Each Environment:**
   - [ ] Test local: Sign up, create workspace, invite user
   - [ ] Test staging: Deploy preview and verify
   - [ ] Test production: Deploy and smoke test

### Future Enhancements:

- Set up automated migration deployment via CI/CD
- Configure database backups
- Set up monitoring and alerting
- Add database seeding for development
- Configure OAuth providers (Google, Microsoft, etc.)

---

**Last Updated:** October 5, 2025
**Maintained By:** Development Team
