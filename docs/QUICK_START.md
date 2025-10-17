# Quick Start Guide - Supabase Multi-Environment

## 🚀 Get Started in 3 Steps

### 1. Start Local Supabase

```bash
cd "/Users/adriengaignebet/Documents/Tech/Adaptive Outbound"
supabase start
```

**Output you'll see:**
- API URL: http://127.0.0.1:54331
- Studio: http://127.0.0.1:54333

### 2. Start Web App

```bash
cd web-app
npm run dev
```

**Opens:** http://localhost:3000

### 3. Access Supabase Studio

Open http://127.0.0.1:54333 to:
- View tables
- Run SQL queries
- Manage auth users
- Test storage

---

## 📁 Environment Files

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.local` | Local dev | ❌ Ignored |
| `.env.staging` | Staging/preview | ❌ Ignored |
| `.env.production` | Production | ❌ Ignored |
| `.env.example` | Template | ✅ Committed |

---

## 🔄 Common Workflows

### Daily Development

```bash
# Morning - start services
supabase start
cd web-app && npm run dev

# Evening - stop services
supabase stop
```

### Making Database Changes

```bash
# 1. Make changes in Studio (http://127.0.0.1:54333)

# 2. Generate migration
supabase db diff -f my_changes

# 3. Test migration
supabase db reset

# 4. Commit migration file
git add supabase/migrations/
git commit -m "feat: add new feature schema"
```

### Deploying

```bash
# Deploy to staging (preview)
git checkout -b feature/my-feature
git push origin feature/my-feature
# Vercel auto-deploys with staging Supabase

# Deploy to production
git checkout main
git merge dev
git push origin main
# Vercel auto-deploys with production Supabase
```

---

## 🔑 Environment Variables

### Local (.env.local) - Already Configured ✅

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Staging (.env.staging) - Needs Service Role Key ⚠️

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hymtbydkynmkyesoaucl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_DASHBOARD]
```

**Get Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl/settings/api
2. Copy `service_role` key
3. Update `.env.staging`

### Production (.env.production) - Not Created Yet ⏳

**To create:**
1. Go to https://supabase.com/dashboard
2. Create new project: `adaptive-outbound-production`
3. Get credentials from Settings > API
4. Update `.env.production`

---

## 🗄️ Database Schema

**Tables created by migration:**
- `profiles` - User profiles
- `workspaces` - Team workspaces
- `workspace_members` - Team membership
- `workspace_invitations` - Pending invites
- `user_sessions` - Active sessions
- `api_keys` - API access keys
- `audit_logs` - Activity logs
- `system_controls` - Feature flags

**View in Studio:** http://127.0.0.1:54333/project/default/editor

---

## 🛠️ Troubleshooting

### "Port already allocated" error

```bash
# Change ports in supabase/config.toml or stop other Supabase instances
supabase stop --project-id other_project
```

### "Cannot connect to Supabase"

```bash
# Verify Supabase is running
supabase status

# Check environment variables
cat web-app/.env.local
```

### Reset everything

```bash
# Stop Supabase
supabase stop

# Remove volumes
docker volume prune

# Start fresh
supabase start
```

---

## 📚 More Information

- Full docs: `docs/ENVIRONMENT_SETUP.md`
- Project setup: `CLAUDE.md`
- Supabase CLI: https://supabase.com/docs/guides/cli

---

## 🎯 Current Status

| Environment | Status | Action Needed |
|-------------|--------|---------------|
| Local | ✅ Running | None |
| Staging | ⚠️ Migration pending | Apply migration via dashboard |
| Production | ⏳ Not created | Create Supabase project |

---

**Need help?** Check `docs/ENVIRONMENT_SETUP.md` for detailed instructions.
