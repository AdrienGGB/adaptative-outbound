# Supabase Multi-Environment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADAPTIVE OUTBOUND                             │
│                     Multi-Environment Setup                          │
└─────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────┐
                    │    DEVELOPER WORKSTATION      │
                    │                               │
                    │  ┌─────────────────────────┐ │
                    │  │   Next.js Web App       │ │
                    │  │   (localhost:3000)      │ │
                    │  │                         │ │
                    │  │   Reads: .env.local     │ │
                    │  └─────────────────────────┘ │
                    │              │                │
                    │              ↓                │
                    │  ┌─────────────────────────┐ │
                    │  │  Local Supabase (Docker)│ │
                    │  │                         │ │
                    │  │  • API: 127.0.0.1:54331│ │
                    │  │  • DB:  127.0.0.1:54332│ │
                    │  │  • Studio: :54333      │ │
                    │  │                         │ │
                    │  │  ✅ 8 Tables Created   │ │
                    │  │  ✅ RLS Enabled        │ │
                    │  │  ✅ Migrations Applied │ │
                    │  └─────────────────────────┘ │
                    └───────────────────────────────┘

                                  │
                                  │ git push
                                  ↓

┌────────────────────────────────────────────────────────────────────────┐
│                            GITHUB                                       │
│                                                                         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐│
│  │ dev branch   │ →    │ feature/*    │ →    │  main branch         ││
│  │ (development)│      │ (preview)    │      │  (production)        ││
│  └──────────────┘      └──────────────┘      └──────────────────────┘│
│                                                                         │
│  📁 Migrations:  supabase/migrations/001_auth_and_workspaces.sql       │
│  📁 Env Files:   .env.example (template only)                          │
│  🚫 Not in Git:  .env.local, .env.staging, .env.production            │
└────────────────────────────────────────────────────────────────────────┘

                                  │
                                  │ Auto-deploy on push
                                  ↓

┌────────────────────────────────────────────────────────────────────────┐
│                            VERCEL                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  PREVIEW DEPLOYMENTS (feature/*, dev branches)                    │ │
│  │                                                                   │ │
│  │  Environment Variables (Preview scope):                          │ │
│  │  • NEXT_PUBLIC_SUPABASE_URL → Staging URL                       │ │
│  │  • NEXT_PUBLIC_SUPABASE_ANON_KEY → Staging Key                  │ │
│  │  • SUPABASE_SERVICE_ROLE_KEY → Staging Service Key              │ │
│  │  • NODE_ENV=staging                                              │ │
│  │                                                                   │ │
│  │  Deployment URL: https://[random].vercel.app                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  PRODUCTION DEPLOYMENT (main branch)                             │ │
│  │                                                                   │ │
│  │  Environment Variables (Production scope):                       │ │
│  │  • NEXT_PUBLIC_SUPABASE_URL → Production URL                    │ │
│  │  • NEXT_PUBLIC_SUPABASE_ANON_KEY → Production Key               │ │
│  │  • SUPABASE_SERVICE_ROLE_KEY → Production Service Key           │ │
│  │  • NODE_ENV=production                                           │ │
│  │                                                                   │ │
│  │  Deployment URL: https://yourdomain.com                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘

                    │                              │
                    │                              │
                    ↓                              ↓

┌──────────────────────────────┐    ┌──────────────────────────────────┐
│   SUPABASE STAGING (Cloud)   │    │   SUPABASE PRODUCTION (Cloud)    │
│                              │    │                                  │
│  Project: hymtbydkynmkyesoaucl    │  Project: TBD (not created yet)  │
│  Region: eu-west-3 (Paris)   │    │  Region: TBD                     │
│                              │    │                                  │
│  Status: ⚠️  Migration Pending    │  Status: ⏳ Not Created          │
│                              │    │                                  │
│  📊 Database:                │    │  📊 Database:                    │
│    • PostgreSQL 17           │    │    • PostgreSQL 17               │
│    • ⏳ 0 tables (pending)   │    │    • ⏳ 0 tables (pending)       │
│    • RLS ready               │    │    • RLS ready                   │
│                              │    │                                  │
│  🔐 Auth:                    │    │  🔐 Auth:                        │
│    • Email/Password          │    │    • Email/Password              │
│    • OAuth (to configure)    │    │    • OAuth (to configure)        │
│                              │    │                                  │
│  💾 Storage:                 │    │  💾 Storage:                     │
│    • S3-compatible           │    │    • S3-compatible               │
│    • Buckets (to create)     │    │    • Buckets (to create)         │
│                              │    │                                  │
│  Dashboard:                  │    │  Dashboard:                      │
│  supabase.com/dashboard/     │    │  TBD                             │
│  project/hymtbydkynmkyesoaucl│    │                                  │
└──────────────────────────────┘    └──────────────────────────────────┘
```

---

## Database Schema (All Environments)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                             │
│                  (Applied to all environments)                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   auth.users     │  (Supabase managed)
│                  │
│  id (UUID)       │
│  email           │
│  created_at      │
└────────┬─────────┘
         │
         │ 1:1
         ↓
┌──────────────────────────────┐
│      profiles                │
│                              │
│  id → auth.users.id          │
│  first_name                  │
│  last_name                   │
│  avatar_url                  │
│  timezone                    │
│  status                      │
│                              │
│  🔒 RLS: User owns profile   │
└──────────────────────────────┘

         ┌──────────────────────────────┐
         │      workspaces              │
         │                              │
         │  id (UUID)                   │
         │  name                        │
         │  slug (unique)               │
         │  owner_id → auth.users       │
         │  plan (free/pro/enterprise)  │
         │  settings (JSONB)            │
         │                              │
         │  🔒 RLS: Members only        │
         └────────────┬─────────────────┘
                      │
                      │ 1:N
                      ↓
         ┌──────────────────────────────┐
         │   workspace_members          │
         │                              │
         │  workspace_id → workspaces   │
         │  user_id → auth.users        │
         │  role (admin/manager/ae/sdr) │
         │  status                      │
         │  joined_at                   │
         │                              │
         │  🔒 RLS: Admins manage       │
         └──────────────────────────────┘

┌──────────────────────────────┐
│   workspace_invitations      │
│                              │
│  workspace_id → workspaces   │
│  email                       │
│  role                        │
│  token (unique)              │
│  status                      │
│  expires_at                  │
│                              │
│  🔒 RLS: Admins only         │
└──────────────────────────────┘

┌──────────────────────────────┐    ┌──────────────────────────────┐
│      user_sessions           │    │        api_keys              │
│                              │    │                              │
│  user_id → auth.users        │    │  workspace_id → workspaces   │
│  workspace_id → workspaces   │    │  user_id → auth.users        │
│  device_name                 │    │  name                        │
│  ip_address                  │    │  key_hash (unique)           │
│  user_agent                  │    │  scopes []                   │
│                              │    │  status                      │
│  🔒 RLS: User owns           │    │                              │
│                              │    │  🔒 RLS: Admins only         │
└──────────────────────────────┘    └──────────────────────────────┘

┌──────────────────────────────┐    ┌──────────────────────────────┐
│       audit_logs             │    │    system_controls           │
│                              │    │                              │
│  workspace_id → workspaces   │    │  feature (unique)            │
│  user_id → auth.users        │    │  enabled (boolean)           │
│  event_type                  │    │  description                 │
│  event_data (JSONB)          │    │  updated_by → auth.users     │
│  ip_address                  │    │                              │
│  created_at                  │    │  🔒 RLS: Read all, admin write
│                              │    │                              │
│  🔒 RLS: Admins view,        │    │  📊 Initial Data:            │
│         system inserts       │    │    • user_signup             │
│                              │    │    • oauth_google            │
└──────────────────────────────┘    │    • workspace_creation      │
                                    │    • api_keys (+ 2 more)     │
                                    └──────────────────────────────┘
```

---

## Data Flow

### 1. User Signup Flow

```
┌─────────┐     signup      ┌──────────────┐    trigger    ┌─────────┐
│ Web App │ ──────────────→ │ Supabase Auth│ ────────────→ │ Profile │
└─────────┘                 └──────────────┘               └─────────┘
                                   │
                                   │ JWT token
                                   ↓
                            ┌──────────────┐
                            │  Web App     │
                            │  (Authenticated)
                            └──────────────┘
```

### 2. Workspace Creation Flow

```
┌─────────┐   create_workspace_with_owner()   ┌──────────────┐
│ Web App │ ────────────────────────────────→ │  Workspaces  │
└─────────┘                                    └──────────────┘
                                                      │
                                                      ↓
                                              ┌──────────────┐
                                              │workspace_    │
                                              │members       │
                                              │(owner=admin) │
                                              └──────────────┘
                                                      │
                                                      ↓
                                              ┌──────────────┐
                                              │ audit_logs   │
                                              │(create event)│
                                              └──────────────┘
```

### 3. Team Invitation Flow

```
┌─────────┐    invite      ┌──────────────────┐
│ Admin   │ ─────────────→ │workspace_        │
└─────────┘                │invitations       │
                           └──────────────────┘
                                   │
                                   │ email sent
                                   ↓
                           ┌──────────────────┐
                           │ New User         │
                           │ (clicks link)    │
                           └──────────────────┘
                                   │
                                   │ accept token
                                   ↓
                           ┌──────────────────┐
                           │workspace_members │
                           │(status=active)   │
                           └──────────────────┘
```

---

## Environment Comparison

| Feature | Local | Staging | Production |
|---------|-------|---------|------------|
| **Purpose** | Development | Testing/Preview | Live Users |
| **Data** | Fake/Test | Test/Demo | Real |
| **Supabase** | Docker (localhost) | Cloud (hymtbydkynmkyesoaucl) | Cloud (TBD) |
| **Database** | PostgreSQL 17 | PostgreSQL 17 | PostgreSQL 17 |
| **Auth** | Local | Cloud | Cloud |
| **Storage** | Local | Cloud | Cloud |
| **URL** | http://127.0.0.1:54331 | hymtbydkynmkyesoaucl.supabase.co | TBD |
| **Env File** | .env.local | .env.staging | .env.production |
| **Vercel** | N/A | Preview scope | Production scope |
| **Git Branch** | Any | feature/*, dev | main |
| **Status** | ✅ Running | ⚠️ Ready | ⏳ Not Created |

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

1. Network Layer
   ├── HTTPS/TLS (Vercel + Supabase)
   ├── CORS configured
   └── API rate limiting

2. Authentication Layer
   ├── Supabase Auth (JWT)
   ├── Email/Password
   ├── OAuth providers (configurable)
   └── Session management

3. Authorization Layer (RLS)
   ├── Row Level Security on all tables
   ├── Policy-based access control
   ├── Role hierarchy (admin > sales_manager > ae > sdr)
   └── Workspace-scoped data

4. Application Layer
   ├── Environment variable isolation
   ├── Service role key (server-side only)
   ├── Anon key (client-side)
   └── Input validation (Zod schemas)

5. Data Layer
   ├── Encrypted at rest
   ├── Encrypted in transit
   ├── Audit logging
   └── Point-in-time recovery (production)
```

---

## Deployment Pipeline

```
┌──────────────┐
│   Developer  │
└──────┬───────┘
       │
       │ 1. Code changes locally
       │ 2. Test with local Supabase
       ↓
┌──────────────────┐
│  git commit/push │
│  feature branch  │
└────────┬─────────┘
         │
         │ 3. Triggers Vercel
         ↓
┌──────────────────────┐
│  Vercel Preview      │
│  (uses staging DB)   │
└────────┬─────────────┘
         │
         │ 4. Review & test
         ↓
┌──────────────────────┐
│  Merge to main       │
└────────┬─────────────┘
         │
         │ 5. Auto-deploy
         ↓
┌──────────────────────┐
│  Vercel Production   │
│  (uses prod DB)      │
└──────────────────────┘
```

---

## File Structure

```
adaptive-outbound/
│
├── 📁 supabase/
│   ├── config.toml                    # Local Supabase config
│   └── migrations/
│       └── 001_auth_and_workspaces.sql  # Database schema
│
├── 📁 web-app/
│   ├── .env.local              ✅ Local (git-ignored)
│   ├── .env.staging            ⚠️  Staging (git-ignored)
│   ├── .env.production         ⏳ Production (git-ignored)
│   ├── .env.example            ✅ Template (committed)
│   │
│   └── src/
│       ├── lib/
│       │   └── supabase/
│       │       ├── client.ts   # Browser client
│       │       ├── server.ts   # Server client
│       │       └── middleware.ts # Auth middleware
│       │
│       └── types/
│           └── database.ts     # TypeScript types
│
├── 📁 docs/
│   ├── ENVIRONMENT_SETUP.md           # Complete guide
│   ├── QUICK_START.md                 # Quick reference
│   ├── APPLY_MIGRATION_TO_STAGING.md  # Staging steps
│   └── ARCHITECTURE_DIAGRAM.md        # This file
│
├── ENVIRONMENT_SETUP_REPORT.md  # Summary report
├── SETUP_CHECKLIST.md          # Task checklist
└── .gitignore                  # Ignore env files
```

---

## Next Steps Workflow

### 1. Apply Migration to Staging ⏳

```bash
# Manual via Dashboard:
1. Visit: https://supabase.com/dashboard/project/hymtbydkynmkyesoaucl
2. SQL Editor → New Query
3. Paste: supabase/migrations/001_auth_and_workspaces.sql
4. Run → Verify tables created
```

### 2. Configure Staging ⏳

```bash
# Get credentials:
1. Dashboard → Settings → API
2. Copy service_role key
3. Update web-app/.env.staging

# Configure Vercel:
1. Project Settings → Environment Variables
2. Add Preview scope variables
3. Redeploy preview branch
```

### 3. Create Production ⏳

```bash
# New Supabase project:
1. Dashboard → New Project
2. Name: adaptive-outbound-production
3. Apply same migration
4. Get credentials
5. Configure Vercel Production scope
6. Deploy main branch
```

---

**Last Updated:** October 5, 2025
**Status:** Local ✅ | Staging ⚠️ | Production ⏳
