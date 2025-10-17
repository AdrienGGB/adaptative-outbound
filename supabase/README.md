# Supabase Configuration

This directory contains the Supabase configuration and database migrations for the Adaptive Outbound project.

## 📁 Structure

```
supabase/
├── config.toml                          # Local Supabase configuration
├── migrations/
│   ├── 001_auth_and_workspaces.sql     # Initial schema migration
│   └── [future migrations]             # Additional migrations
├── .gitignore                          # Ignore temporary files
├── .temp/                              # Temporary files (git-ignored)
└── README.md                           # This file
```

## 🗄️ Database Schema

The database schema is defined in migration files and includes:

### Tables (8 total)

1. **profiles** - User profile data extending auth.users
2. **workspaces** - Team/organization workspaces
3. **workspace_members** - Team membership with RBAC
4. **workspace_invitations** - Pending team invitations
5. **user_sessions** - Session tracking for device management
6. **api_keys** - Programmatic API access
7. **audit_logs** - Activity audit trail
8. **system_controls** - Feature flags and system settings

### Security (RLS)

All tables have Row Level Security (RLS) enabled with appropriate policies:
- Users can only access their own data
- Workspace data is scoped to members
- Admin-only operations are protected
- Audit logs are immutable (insert only)

### Helper Functions

- `create_workspace_with_owner()` - Atomic workspace creation
- `get_user_workspace_role()` - Role lookup
- `user_has_permission()` - Permission check with role hierarchy
- `handle_new_user()` - Auto-create profile on signup
- `update_updated_at_column()` - Timestamp trigger

## 🚀 Usage

### Start Local Supabase

```bash
# From project root
supabase start

# This will:
# - Start all Supabase services in Docker
# - Apply all migrations automatically
# - Output connection details
```

### Stop Local Supabase

```bash
supabase stop
```

### View Status

```bash
supabase status

# Shows:
# - API URL: http://127.0.0.1:54331
# - Studio: http://127.0.0.1:54333
# - Database: postgresql://postgres:postgres@127.0.0.1:54332/postgres
```

### Reset Database

```bash
# Resets database and reapplies all migrations
supabase db reset
```

### Create New Migration

```bash
# Make changes in Studio (http://127.0.0.1:54333)
# Then generate migration file:
supabase db diff -f migration_name

# This creates: migrations/[timestamp]_migration_name.sql
```

### Apply Migrations to Cloud

```bash
# Link to cloud project (first time only)
supabase link --project-ref [project-ref]

# Push migrations
supabase db push
```

## 🔧 Configuration (config.toml)

### Custom Ports

We use custom ports to avoid conflicts with other local Supabase instances:

| Service | Port | Default | Our Port |
|---------|------|---------|----------|
| API (Kong) | 54321 | 54321 | **54331** |
| PostgreSQL | 54322 | 54322 | **54332** |
| Studio | 54323 | 54323 | **54333** |
| Inbucket (Email) | 54324 | 54324 | **54334** |
| Analytics | 54327 | 54327 | **54337** |

### Project ID

```toml
project_id = "Adaptive_Outbound"
```

This distinguishes our project from others on the same machine.

### Database

```toml
[db]
port = 54332
major_version = 17
```

PostgreSQL 17 for compatibility with cloud.

### Auth Configuration

```toml
[auth]
site_url = "http://127.0.0.1:3000"
enable_signup = true
minimum_password_length = 6
```

Configured for local development. Update `site_url` for production.

## 📊 Accessing Supabase Studio

Open http://127.0.0.1:54333 in your browser to access:

- **Table Editor** - View and edit data
- **SQL Editor** - Run custom queries
- **Authentication** - Manage users
- **Storage** - Manage files
- **API Docs** - Auto-generated API documentation

## 🔗 Linking to Cloud Projects

### Staging

```bash
supabase link --project-ref hymtbydkynmkyesoaucl
```

### Production (when created)

```bash
supabase link --project-ref [production-ref]
```

**Note:** Requires database password from Supabase dashboard.

## 📝 Migration Best Practices

### 1. Always Test Locally First

```bash
# Test migration
supabase db reset

# Verify in Studio
open http://127.0.0.1:54333
```

### 2. Use Descriptive Names

```bash
# Good
supabase db diff -f add_user_preferences_table
supabase db diff -f update_workspace_permissions

# Bad
supabase db diff -f changes
supabase db diff -f fix
```

### 3. One Logical Change Per Migration

Keep migrations focused on a single feature or change.

### 4. Never Edit Applied Migrations

Once a migration is applied to staging/production, create a new migration to make changes.

### 5. Include Rollback Strategy

Consider how to reverse the migration if needed.

## 🗂️ Migration File Format

```sql
-- Migration: [number]_[name]
-- Description: What this migration does

-- Create tables
CREATE TABLE ...

-- Add indexes
CREATE INDEX ...

-- Enable RLS
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY ...

-- Create functions
CREATE OR REPLACE FUNCTION ...

-- Insert initial data
INSERT INTO ...
```

## 🔒 Security Notes

### Local Development

- Uses demo JWT secrets (safe for local only)
- Database password: `postgres`
- No real user data

### Staging/Production

- Use strong database passwords
- Rotate service role keys regularly
- Enable SSL connections
- Configure network restrictions
- Set up database backups

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Stop other Supabase instances
supabase stop --project-id other_project

# Or change ports in config.toml
```

### Migration Fails

```bash
# Check for errors
supabase db reset --debug

# View logs
supabase logs db
```

### Cannot Connect

```bash
# Verify Supabase is running
supabase status

# Check Docker
docker ps | grep supabase
```

### Tables Already Exist

```bash
# Drop and recreate
supabase db reset

# Or manually drop in Studio
```

## 📚 Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Need Help?

- Check: `docs/ENVIRONMENT_SETUP.md` for detailed setup
- Check: `docs/QUICK_START.md` for quick commands
- Check: `ENVIRONMENT_SETUP_REPORT.md` for current status

---

**Last Updated:** October 5, 2025
**Schema Version:** 001 (auth_and_workspaces)
