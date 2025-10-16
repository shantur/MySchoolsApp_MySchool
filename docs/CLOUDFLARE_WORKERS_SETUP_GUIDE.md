# Cloudflare Workers Setup Guide for MySchoolWeb

**Date:** October 15, 2025  
**Phase:** 6 - Cloud Functions Migration (DevOps Engineer)  
**Status:** Infrastructure Setup Complete - Ready for Deployment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Build and Deploy](#build-and-deploy)
5. [Verification](#verification)
6. [Monitoring and Debugging](#monitoring-and-debugging)
7. [Custom Domain Setup](#custom-domain-setup-optional)
8. [Troubleshooting](#troubleshooting)
9. [Cost Estimation](#cost-estimation)
10. [Rollback Procedure](#rollback-procedure)

---

## Prerequisites

### Required Tools

1. **Node.js 18+**: Already installed (current: v20)
2. **npm**: Already installed
3. **Cloudflare Account**: Free or paid account
   - Sign up: https://dash.cloudflare.com/sign-up
4. **Wrangler CLI**: Already installed (if not: `npm install -g wrangler`)
5. **OpenNext.js CLI**: ✅ Already installed (v3.1.3)

### Required Information

Before proceeding, gather the following from your Cloudflare account:

- **Account ID**: Found at https://dash.cloudflare.com → Select account → Copy "Account ID"
- **Supabase Project URL**: For staging and production environments
- **Supabase Keys**: Anon key and Service Role key for each environment

---

## Initial Setup

### Step 1: Authenticate with Cloudflare

```bash
cd /Users/shantur/Coding/MySchoolsApp/myschoolweb

# Login to Cloudflare (opens browser for OAuth)
npm run wrangler:login

# Verify authentication
wrangler whoami
```

**Expected Output:**
```
 ⛅️ wrangler 3.x.x
-------------------
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
┌──────────────────────────────────┬──────────────────────────────────┐
│ Account Name                     │ Account ID                       │
├──────────────────────────────────┼──────────────────────────────────┤
│ Your Account Name                │ abc123def456...                  │
└──────────────────────────────────┴──────────────────────────────────┘
```

### Step 2: Update wrangler.toml with Your Account ID

Open `wrangler.toml` and replace the placeholder:

```toml
# Before:
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

# After (example):
account_id = "abc123def456ghi789jkl012mno345pqr"
```

### Step 3: Update Supabase URLs in wrangler.toml

Update the public environment variables for each environment:

```toml
# Development (default)
[vars]
NEXT_PUBLIC_SUPABASE_URL = "https://your-dev-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NODE_ENV = "production"

# Staging
[env.staging]
name = "myschoolweb-staging"
vars = { 
  NEXT_PUBLIC_SUPABASE_URL = "https://your-staging-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  NODE_ENV = "staging" 
}

# Production
[env.production]
name = "myschoolweb-prod"
vars = { 
  NEXT_PUBLIC_SUPABASE_URL = "https://your-production-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  NODE_ENV = "production" 
}
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are compiled into the Worker bundle (visible in browser)
- These are NOT secrets; they are public keys meant to be exposed
- Actual secrets (like `SUPABASE_SERVICE_ROLE_KEY`) are set separately (see below)

---

## Environment Variables Configuration

### Understanding Variable Types

Cloudflare Workers has two types of environment variables:

| Type | How to Set | Security | Use Case |
|------|-----------|----------|----------|
| **Public Vars** | `wrangler.toml` [vars] | Public (in bundle) | `NEXT_PUBLIC_*` keys, feature flags |
| **Secrets** | `wrangler secret put` | Encrypted | API keys, service role keys, JWT secrets |

### Required Secrets

#### 1. SUPABASE_SERVICE_ROLE_KEY (Required)

**Purpose:** Server-side Supabase operations (admin functions, bypassing RLS)

**How to Set:**

```bash
# For default (dev) environment
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# You'll be prompted to enter the value:
# Paste your Supabase Service Role Key and press Enter

# For staging
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging

# For production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
```

**Where to Find This Key:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy "service_role" key (🔑 secret, starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

**⚠️ Security Warning:** This key bypasses Row Level Security. NEVER expose it in client code or commit to git.

#### 2. SESSION_SECRET (Required)

**Purpose:** JWT signing for session tokens

**How to Set:**

```bash
# Generate a secure random string (64+ characters)
openssl rand -base64 64

# Copy the output and set it as a secret:
wrangler secret put SESSION_SECRET
# Paste the generated string when prompted

# Repeat for staging and production:
wrangler secret put SESSION_SECRET --env staging
wrangler secret put SESSION_SECRET --env production
```

**Important:**
- Use a DIFFERENT secret for each environment (dev, staging, production)
- Never reuse the same secret across environments
- Minimum 64 characters recommended

### Verify Configured Secrets

```bash
# List secrets for default environment
wrangler secret list

# List secrets for staging
wrangler secret list --env staging

# List secrets for production
wrangler secret list --env production
```

**Expected Output:**
```
[
  {
    "name": "SUPABASE_SERVICE_ROLE_KEY",
    "type": "secret_text"
  },
  {
    "name": "SESSION_SECRET",
    "type": "secret_text"
  }
]
```

**Note:** Wrangler only shows secret names, not values (for security).

### Delete a Secret (if needed)

```bash
# Delete a secret
wrangler secret delete SUPABASE_SERVICE_ROLE_KEY

# Delete from specific environment
wrangler secret delete SUPABASE_SERVICE_ROLE_KEY --env staging
```

---

## Build and Deploy

### Step 1: Build the Application

```bash
# Full build with OpenNext.js
npm run build:opennext
```

**What This Does:**
1. Runs `next build` to generate production Next.js build
2. Runs `open-next build --target cloudflare` to create Cloudflare Worker-compatible bundle
3. Outputs to `.open-next/` directory

**Expected Output:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
├ ○ /api/...                             ...      ...
...

✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (28/28)
✓ Collecting build traces
✓ Finalizing page optimization

OpenNext — Cloudflare
✓ Generated Cloudflare Worker in .open-next/
```

### Step 2: Check Bundle Size

```bash
# Check the deployment size
npm run build:check-size
```

**Expected Output:**
```
3.2M    .open-next/
```

**Size Limits:**
- Free tier: 1MB compressed (likely too small for Next.js SSR)
- Paid tier: 5MB compressed (recommended for Next.js)

**If bundle is too large:**
1. Analyze: `wrangler deploy --dry-run`
2. Remove unused dependencies
3. Use dynamic imports for large libraries
4. Consider code splitting

### Step 3: Dry Run (Recommended)

```bash
# Test deployment without actually deploying
npm run deploy:dry-run
```

**What This Checks:**
- Bundle size within limits
- Configuration validity
- Account authentication
- No deployment actually happens

**Expected Output:**
```
 ⛅️ wrangler 3.x.x
-------------------
Total Upload: 3.2 MB / gzip: 1.1 MB
✨ Your worker has the following bindings:
 - Vars:
   - NEXT_PUBLIC_SUPABASE_URL: "https://..."
   - NODE_ENV: "production"
✨ This was a dry run. Your worker was NOT deployed.
```

### Step 4: Deploy to Staging

```bash
# Deploy to staging environment for testing
npm run deploy:staging
```

**Expected Output:**
```
 ⛅️ wrangler 3.x.x
-------------------
Uploading worker bundle...
Uploaded myschoolweb-staging (3.2 MB gzipped: 1.1 MB)
Published myschoolweb-staging (0.42 sec)
  https://myschoolweb-staging.your-subdomain.workers.dev
Current Deployment ID: abc123-def456-ghi789
```

**Important:** Save the deployment URL! You'll need it for testing.

### Step 5: Verify Staging Deployment

```bash
# Test the staging URL
curl https://myschoolweb-staging.your-subdomain.workers.dev

# Or open in browser:
open https://myschoolweb-staging.your-subdomain.workers.dev
```

**Expected:** HTML response with Next.js app content

### Step 6: Deploy to Production (After Staging Verification)

```bash
# Only after thorough staging testing!
npm run deploy:production
```

**Pre-Production Checklist:**
- [ ] Staging deployment working correctly
- [ ] All E2E tests passing on staging
- [ ] Environment variables verified (production Supabase URL, keys)
- [ ] Production secrets configured (`SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/alerting set up
- [ ] Rollback plan reviewed

---

## Verification

### Health Check Endpoints

After deployment, verify these endpoints:

```bash
# 1. Homepage (should return HTML)
curl -I https://your-worker-url.workers.dev

# Expected: HTTP/2 200, Content-Type: text/html

# 2. API Health Check (if you have one)
curl https://your-worker-url.workers.dev/api/health

# Expected: {"status":"ok","timestamp":"2025-10-15T..."}

# 3. Login page
curl -I https://your-worker-url.workers.dev/login

# Expected: HTTP/2 200, Content-Type: text/html
```

### Functional Testing

1. **Authentication Flow:**
   - Visit `/login`
   - Enter test credentials
   - Verify successful login
   - Check session persistence

2. **Admin Dashboard:**
   - Login as admin user
   - Access admin routes
   - Verify authorization works

3. **Database Operations:**
   - Create a test school/notice
   - Verify data persists in Supabase
   - Check Supabase Dashboard → Table Editor

4. **Storage Operations:**
   - Upload a test attachment
   - Verify file appears in Supabase Storage
   - Download file and verify integrity

### Performance Verification

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test 100 requests
ab -n 100 -c 10 https://your-worker-url.workers.dev/

# Check response times:
# - Time per request: Should be < 200ms
# - 95th percentile: Should be < 500ms
```

**Expected Performance:**
- First request (cold start): < 100ms (Cloudflare Workers are fast!)
- Subsequent requests: < 50ms
- Database queries: < 100ms (Supabase)

---

## Monitoring and Debugging

### Live Logs (Development/Staging)

```bash
# Watch live logs from staging
npm run wrangler:tail:staging

# Watch live logs from production
npm run wrangler:tail:production
```

**What You'll See:**
- Incoming requests
- Console.log() output
- Errors and stack traces
- Response times

**Example Output:**
```
[2025-10-15 10:30:45] GET https://myschoolweb-staging.workers.dev/ - 200 OK (42ms)
[2025-10-15 10:30:47] POST https://myschoolweb-staging.workers.dev/api/auth/login - 200 OK (128ms)
```

### Cloudflare Dashboard Analytics

1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages"
3. Click on "myschoolweb-staging" (or production)
4. View:
   - **Invocations:** Request count over time
   - **Errors:** Error rate and types
   - **Duration:** P50, P99 response times
   - **CPU Time:** Execution time (watch for limits)

### Set Up Alerts (Recommended)

1. Dashboard → Workers → myschoolweb-prod → Notifications
2. Create alerts for:
   - Error rate > 5%
   - P99 latency > 500ms
   - CPU time > 40ms (approaching 50ms limit)
   - Requests > 90,000/day (approaching free tier limit)

### Error Tracking Integration

For production, consider integrating:
- **Sentry**: `npm install @sentry/nextjs`
- **LogDNA**: Cloudflare Logpush integration
- **Datadog**: Real-time monitoring

---

## Custom Domain Setup (Optional)

### Prerequisites

- Domain registered and managed in Cloudflare
- DNS configured for domain

### Steps

1. **Add Domain to Cloudflare:**
   - Dashboard → Add site
   - Follow DNS setup instructions

2. **Update wrangler.toml:**

```toml
# Production environment
[env.production]
name = "myschoolweb-prod"
routes = [
  { pattern = "myschoolweb.example.com/*", zone_name = "example.com" }
]
vars = { ... }
```

3. **Deploy with Custom Domain:**

```bash
npm run deploy:production
```

4. **Verify DNS Propagation:**

```bash
# Check DNS resolution
dig myschoolweb.example.com

# Test HTTPS
curl -I https://myschoolweb.example.com
```

**SSL Certificate:**
- Cloudflare automatically provisions and manages SSL certificates
- Free SSL included (Universal SSL)
- Certificate auto-renews

---

## Troubleshooting

### Common Issues

#### 1. "Account ID is required"

**Error:**
```
✘ [ERROR] Missing Account ID
```

**Fix:**
- Open `wrangler.toml`
- Replace `YOUR_CLOUDFLARE_ACCOUNT_ID` with actual Account ID from dashboard

#### 2. "Worker exceeded CPU time limit"

**Error:**
```
✘ [ERROR] Worker exceeded CPU time limit of 50ms
```

**Causes:**
- Slow database queries
- Large data processing
- Synchronous operations

**Fix:**
- Optimize Supabase queries (add indexes)
- Use `select('*')` only when needed; select specific columns
- Implement edge caching for static data
- Consider upgrading to paid plan (more CPU time)

#### 3. "Worker script too large"

**Error:**
```
✘ [ERROR] Script size exceeds 1MB limit
```

**Fix:**
- Run: `npm run deploy:dry-run` to check size
- Upgrade to paid plan ($5/month for 5MB limit)
- Remove unused dependencies
- Use dynamic imports

#### 4. "Cannot find module 'node:*'"

**Error:**
```
✘ [ERROR] Could not resolve "node:crypto"
```

**Fix:**
- Ensure `wrangler.toml` has:
  ```toml
  compatibility_flags = ["nodejs_compat"]
  ```
- Already configured in the generated `wrangler.toml`

#### 5. "Secret not found"

**Error:**
```
✘ [ERROR] Secret SUPABASE_SERVICE_ROLE_KEY not found
```

**Fix:**
```bash
# Set the secret
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production

# Verify it's set
wrangler secret list --env production
```

#### 6. "Deployment fails silently"

**Debug Steps:**
```bash
# 1. Check authentication
wrangler whoami

# 2. Verify configuration
wrangler deploy --dry-run --env production

# 3. Check for syntax errors in wrangler.toml
wrangler config

# 4. Try deploying with verbose output
wrangler deploy --env production --verbose
```

#### 7. "Environment variables not working in app"

**Issue:** `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined

**Fix:**
- Public vars must be in `[vars]` section of `wrangler.toml`
- Secrets must be set via `wrangler secret put`
- Rebuild after changing `wrangler.toml`: `npm run build:opennext`

### Getting Help

- **Cloudflare Workers Discord:** https://discord.gg/cloudflaredev
- **Cloudflare Community:** https://community.cloudflare.com/
- **OpenNext.js Issues:** https://github.com/opennextjs/opennextjs-cloudflare/issues
- **Project Team:** Internal Slack or documentation

---

## Cost Estimation

### Cloudflare Workers Pricing (as of 2024)

#### Free Tier
- **Requests:** 100,000/day (3M/month)
- **CPU Time:** 10ms per request
- **Bundle Size:** 1MB compressed
- **Cost:** $0

**Use Case:** Development, low-traffic staging

#### Paid Plan ($5/month)
- **Requests:** Unlimited (first 10M included, then $0.50/million)
- **CPU Time:** 50ms per request
- **Bundle Size:** 5MB compressed
- **Cost:** $5/month + usage overages

**Use Case:** Production, high-traffic applications

### Estimated Costs for MySchoolWeb

**Assumptions:**
- 10,000 users (in-house testing app)
- 5 requests per user per day
- 50,000 requests/day (1.5M/month)

**Cost Breakdown:**

| Component | Free Tier | Paid Plan |
|-----------|-----------|-----------|
| Workers | $0 (within 100k/day limit) | $5/month (no overages) |
| Supabase | Free tier or paid | Separate billing |
| Total | **$0-5/month** | **$5/month** |

**Recommendation:** Start with paid plan ($5/month) to avoid CPU time and bundle size limits.

### Cost Monitoring

```bash
# Check usage via Cloudflare API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/usage" \
     -H "Authorization: Bearer YOUR_API_TOKEN"
```

Or view in Dashboard → Workers → Analytics

---

## Rollback Procedure

### Quick Rollback (Emergency)

If production deployment has critical issues:

```bash
# 1. Check deployment history
wrangler deployments list --env production

# Output:
# Deployment ID       Created               Author
# abc123-def456       2025-10-15 10:00:00   you@example.com
# xyz789-uvw012       2025-10-14 15:30:00   you@example.com

# 2. Rollback to previous deployment
wrangler rollback abc123-def456 --env production

# 3. Verify rollback
curl -I https://myschoolweb-prod.your-subdomain.workers.dev
```

### Gradual Rollback (Recommended)

1. **Stop new deployments**
2. **Verify issue in staging** (reproduce the problem)
3. **Fix the issue** in code
4. **Deploy fix to staging** and test thoroughly
5. **Deploy fix to production**

### Rollback to Firebase (Nuclear Option)

If Cloudflare Workers deployment is fundamentally broken:

1. **Restore functions directory:**
   ```bash
   cd /Users/shantur/Coding/MySchoolsApp/myschoolweb
   tar -xzf functions_backup_20251015_143637.tar.gz
   ```

2. **Restore firebase.json** (from git history):
   ```bash
   git show HEAD~1:firebase.json > firebase.json
   ```

3. **Restore package.json scripts** (from git history):
   ```bash
   git show HEAD~1:package.json > package.json.backup
   # Manually merge relevant scripts
   ```

4. **Deploy to Firebase:**
   ```bash
   npm install  # Restore Firebase dependencies
   npm run build:functions
   firebase deploy --only functions,hosting
   ```

5. **Update DNS** (if using custom domain)

**Rollback Time:** 15-30 minutes

---

## Summary

### Completed Setup

✅ OpenNext.js CLI installed (v3.1.3)  
✅ `wrangler.toml` configured with placeholders  
✅ Build scripts added to `package.json`  
✅ Documentation created for environment variable setup  
✅ Deployment process documented

### Required Before Deployment

- [ ] Cloudflare Account ID in `wrangler.toml`
- [ ] Supabase URLs for each environment in `wrangler.toml`
- [ ] `wrangler login` authentication
- [ ] Secrets configured (`SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`)
- [ ] Staging deployment tested
- [ ] E2E tests passing on staging

### Next Steps

1. **DevOps Engineer:** Update `wrangler.toml` with actual Cloudflare Account ID
2. **Product Owner:** Approve staging deployment
3. **Backend Developer:** Verify Supabase integration on staging
4. **QA Engineer:** Run E2E tests on staging environment
5. **DevOps Engineer:** Deploy to production after approval

---

## References

- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/
- **OpenNext.js for Cloudflare:** https://opennext.js.org/cloudflare
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Maintained By:** DevOps Engineer Team
