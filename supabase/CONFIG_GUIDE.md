# Supabase Configuration Guide for MySchoolWeb

## Overview

This document explains the Supabase local development configuration for the MySchoolWeb application. The configuration is defined in `supabase/config.toml` and is optimized for local development with production-like settings.

## Configuration Highlights

### Project Identity
- **Project ID**: `MySchoolsApp`
- **Purpose**: Distinguishes this Supabase instance from others on the same host

### API Configuration (`[api]`)
- **Port**: `54321`
- **Schemas Exposed**: `public`, `graphql_public`
- **Max Rows**: `1000` (prevents oversized payloads from listing queries)
- **TLS**: Disabled for local dev (HTTP only)

**Why these settings?**
- Port 54321 is the standard Supabase local port
- Max rows of 1000 is sufficient for notice listings, user management, and admin operations
- Public schema contains all application tables (schools, users, groups, notices, etc.)

### Database Configuration (`[db]`)
- **Port**: `54322` (Direct PostgreSQL connection)
- **Shadow Port**: `54320` (Used by `supabase db diff`)
- **PostgreSQL Version**: `17` (Latest stable, provides best performance and security)
- **Migrations**: Enabled (auto-applied on `supabase start` and `supabase db reset`)
- **Seed Data**: Enabled (loads `seed.sql` after migrations during reset)

**Why PostgreSQL 17?**
- Latest security patches and performance improvements
- Better JSON/JSONB handling (used for attachments, audit logs)
- Improved indexing for faster queries

### Storage Configuration (`[storage]`)
- **Global File Size Limit**: `50MiB`
- **Buckets** (created via migrations):
  - **`attachments`** (private):
    - Purpose: Notice attachments (PDFs, documents, images)
    - File Size Limit: 50MB
    - Access: School-scoped RLS policies
    - MIME Types: PDF, Word, Excel, Images, ZIP
  - **`school-logos`** (public):
    - Purpose: School branding logos
    - File Size Limit: 5MB
    - Access: Public read, admin write only
    - MIME Types: JPEG, PNG, SVG, WebP

**Why these buckets?**
- Matches Firebase Storage structure for seamless migration
- Private attachments ensure data privacy per school
- Public logos enable efficient CDN-style serving

### Authentication Configuration (`[auth]`)
- **Site URL**: `http://127.0.0.1:3000` (Next.js dev server)
- **JWT Expiry**: `3600` seconds (1 hour)
- **Refresh Token Rotation**: Enabled (security best practice)
- **Signup**: Enabled (for testing school admin registration)
- **Anonymous Sign-ins**: Disabled (not needed for school portal)
- **Minimum Password Length**: `8` characters
- **Password Requirements**: `lower_upper_letters_digits_symbols` (strong passwords enforced)

**Why these settings?**
- 1-hour JWT expiry balances security and user experience for school admins
- Strong password requirements protect school data
- Refresh token rotation prevents token theft attacks

### Email Configuration (`[auth.email]`)
- **Email Signup**: Enabled
- **Email Confirmations**: Disabled (for local dev convenience)
- **Secure Password Change**: Disabled (for local dev)
- **OTP Length**: 6 characters
- **OTP Expiry**: 3600 seconds (1 hour)

**Production Considerations:**
- Enable email confirmations in production
- Enable secure password change in production
- Configure SMTP server (currently using Inbucket for local testing)

### Studio Configuration (`[studio]`)
- **Port**: `54323`
- **Purpose**: Web-based database management UI
- **Features**:
  - Browse and edit tables
  - Run SQL queries
  - Manage storage buckets
  - View logs and analytics
  - Configure RLS policies

**Access**: http://127.0.0.1:54323

### Inbucket Configuration (`[inbucket]`)
- **Port**: `54324`
- **Purpose**: Email testing server (captures outgoing emails)
- **Features**:
  - View signup confirmation emails
  - View password reset emails
  - Test email templates

**Access**: http://127.0.0.1:54324

### Realtime Configuration (`[realtime]`)
- **Enabled**: Yes
- **Use Case**: Live updates for notices, read receipts
- **Benefits**: Parents see new notices instantly without refreshing

### Edge Runtime Configuration (`[edge_runtime]`)
- **Enabled**: Yes
- **Policy**: `oneshot` (hot reload for development)
- **Deno Version**: `1`
- **Inspector Port**: `8083` (Chrome DevTools debugging)

### Analytics Configuration (`[analytics]`)
- **Enabled**: Yes
- **Port**: `54327`
- **Backend**: `postgres` (stores analytics in local database)

## Migration Strategy

### Phase-by-Phase Configuration Evolution

1. **Phase 1-2 (Current)**: Basic configuration, schema migrations, RLS policies
2. **Phase 3-4**: Authentication and API integration
3. **Phase 5**: Storage migration from Firebase
4. **Phase 6-8**: Service migration and testing
5. **Phase 9**: Remove Firebase configurations, Supabase-only

### Environment Variable Alignment

The `config.toml` is designed to work seamlessly with `.env.local`:

```bash
# From config.toml
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # [api] port
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>        # From supabase status
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>    # From supabase status
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres  # [db] port
```

## Testing the Configuration

### Automated Testing

Run the comprehensive configuration test:

```bash
cd myschoolweb
node supabase/test_config.js
```

This validates:
- ✅ API connectivity (anon and service role)
- ✅ Schema accessibility (all 6 tables)
- ✅ Storage buckets (attachments, school-logos)
- ✅ Database features (inserts, updates, triggers, UUID generation)

### Manual Testing

1. **Start Supabase**:
   ```bash
   cd myschoolweb
   supabase start
   ```

2. **Check Status**:
   ```bash
   supabase status
   ```

3. **Reset Database** (applies migrations and seed data):
   ```bash
   supabase db reset
   ```

4. **Access Studio**:
   - Open: http://127.0.0.1:54323
   - Browse tables under "Table Editor"
   - Verify RLS policies under "Authentication" → "Policies"
   - Check storage buckets under "Storage"

5. **Verify Schema**:
   ```bash
   node supabase/verify_schema.js
   ```

## Common Operations

### Starting/Stopping Supabase

```bash
# Start all services
supabase start

# Stop all services (data persists)
supabase stop

# Stop and remove volumes (data deleted)
supabase stop --no-backup
```

### Database Operations

```bash
# Apply new migrations
supabase db reset

# Create a new migration
supabase migration new <migration_name>

# Generate migration from remote changes
supabase db diff -f <migration_name>

# Push local changes to remote
supabase db push
```

### Viewing Logs

```bash
# All services
supabase logs

# Specific service
supabase logs db
supabase logs storage
supabase logs auth
```

## Port Summary

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| API (REST/GraphQL) | 54321 | http://127.0.0.1:54321 | Application API endpoints |
| PostgreSQL | 54322 | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct DB access |
| Studio | 54323 | http://127.0.0.1:54323 | Web UI for DB management |
| Inbucket | 54324 | http://127.0.0.1:54324 | Email testing |
| Analytics | 54327 | http://127.0.0.1:54327 | Usage analytics |
| Edge Runtime Inspector | 8083 | http://127.0.0.1:8083 | Edge function debugging |

## Security Considerations

### Local Development vs Production

| Setting | Local | Production |
|---------|-------|------------|
| Email Confirmations | Disabled | **Enabled** |
| Secure Password Change | Disabled | **Enabled** |
| Signup | Open | **Controlled** (invite-only) |
| TLS/HTTPS | Disabled | **Enabled** |
| SMTP | Inbucket (fake) | **Real SMTP** (SendGrid, etc.) |
| JWT Secret | Default | **Custom** (strong random) |
| Service Role Key | Default | **Custom** (never commit) |

### RLS Policies

All tables have Row Level Security (RLS) enabled with these principles:
- **Schools**: Admin-only write, school-scoped read
- **Users**: Self-read, admin-write
- **Groups**: School-scoped read, admin-write
- **Notices**: School-scoped read, admin-write, group-scoped
- **Notice Reads**: User-own read/write, admin-read all
- **Audit Logs**: Admin-read only, system-write

See `supabase/migrations/20251015000002_row_level_security.sql` for full policy definitions.

## Troubleshooting

### Issue: `supabase start` fails

**Solution**: Check Docker is running:
```bash
docker ps
```

### Issue: Port already in use

**Solution**: Check what's using the port:
```bash
lsof -i :54321  # or other port numbers
```

Stop conflicting services or change ports in `config.toml`.

### Issue: Migrations not applying

**Solution**: Force a reset:
```bash
supabase db reset
```

### Issue: Storage bucket not accessible

**Solution**: Verify bucket creation:
```bash
# Open Studio → Storage
# Or query directly:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT * FROM storage.buckets;"
```

### Issue: Authentication not working

**Solution**: Check environment variables:
```bash
# Verify .env.local has correct keys
cat .env.local | grep SUPABASE

# Get fresh keys
supabase status | grep key
```

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Local Development Guide**: https://supabase.com/docs/guides/local-development
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **Schema Design**: `supabase/PHASE_2_SCHEMA_DESIGN.md`
- **Storage Structure**: `supabase/STORAGE_STRUCTURE.md`
- **Local Credentials**: `supabase/LOCAL_CREDENTIALS.md`

## Next Steps

After configuration is validated:

1. **Phase 3**: Implement authentication service (`AuthService`)
2. **Phase 4**: Implement API client for Next.js
3. **Phase 5**: Migrate storage from Firebase
4. **Phase 6**: Deploy to Cloudflare Workers
5. **Phase 7-8**: Testing and migration of existing data
6. **Phase 9**: Remove Firebase dependencies

## Configuration Update History

- **2025-10-17**: Initial configuration with enhanced comments and documentation
  - Added project-specific comments for API, DB, Storage, Auth sections
  - Updated password requirements to enforce strong passwords (8 chars, symbols)
  - Documented storage bucket structure and RLS policies
  - Created comprehensive test suite (`test_config.js`)
  - Validated all services and migrations
