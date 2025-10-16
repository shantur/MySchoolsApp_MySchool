# Quick Start: Cloudflare Workers Deployment Checklist

## Product Owner Quick Reference

This is a condensed checklist for setting up MySchoolWeb deployment to Cloudflare Workers. For detailed instructions, see `GITHUB_ENVIRONMENT_SETUP_GUIDE.md`.

## Prerequisites ✅

- [ ] GitHub repository admin access
- [ ] Supabase project created and credentials available
- [ ] Cloudflare account with Workers enabled
- [ ] Cloudflare Workers Paid plan activated ($5/month) - **REQUIRED for Next.js**

## Step 1: Gather Credentials (15 minutes)

### Supabase Credentials
Navigate to: https://app.supabase.com/ → Your Project → Settings → API

- [ ] Copy **Project URL**: `https://____________.supabase.co`
- [ ] Copy **anon / public key**: `eyJ...` (starts with eyJ)
- [ ] Copy **service_role key**: `eyJ...` (starts with eyJ) - **KEEP SECRET!**

### Cloudflare Credentials
Navigate to: https://dash.cloudflare.com/

- [ ] Copy **Account ID**: (right sidebar, format: `1a2b3c4d...`)
- [ ] Generate **API Token**: My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template
- [ ] Copy API Token immediately: `a1B2c3D4...` - **SHOWN ONLY ONCE!**

### Session Secret
Generate a secure random string (64+ characters):
```bash
openssl rand -base64 48
```
- [ ] Copy generated string: `kJ8n2Lm9...`

## Step 2: Create GitHub Environment (5 minutes)

1. Go to: `https://github.com/YOUR_ORG/myschoolweb/settings/environments`
2. Click **New environment**
3. Name: `staging`
4. Click **Configure environment**

## Step 3: Add GitHub Secrets (5 minutes)

In the `staging` environment, click **Add secret** for each:

### 6 Secrets Required:

- [ ] `SUPABASE_URL` = Your Supabase Project URL
- [ ] `SUPABASE_ANON_KEY` = Your Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service_role key
- [ ] `CLOUDFLARE_ACCOUNT_ID` = Your Cloudflare Account ID
- [ ] `CLOUDFLARE_API_TOKEN` = Your Cloudflare API Token
- [ ] `SESSION_SECRET` = Your generated random string

## Step 4: Add GitHub Variables (2 minutes)

In the `staging` environment, click **Add variable** for each:

### 2 Variables Required:

- [ ] `CLOUDFLARE_WORKERS_DEV_NAME` = `myschoolweb-dev`
- [ ] `CLOUDFLARE_WORKERS_STAGING_NAME` = `myschoolweb-staging`

## Step 5: Verify Configuration (1 minute)

Check that `staging` environment has:
- ✅ 6 secrets
- ✅ 2 variables

## Step 6: Trigger Deployment (5 minutes)

### Option A: Automatic (Recommended)
```bash
git checkout develop
git pull origin develop
git commit --allow-empty -m "test: Trigger staging deployment"
git push origin develop
```

### Option B: Manual
1. Go to: `https://github.com/YOUR_ORG/myschoolweb/actions`
2. Select: **Deploy MySchoolWeb to Cloudflare Workers**
3. Click: **Run workflow**
4. Branch: `develop`
5. Environment: `staging`
6. Click: **Run workflow**

## Step 7: Monitor Deployment (10 minutes)

1. Go to Actions tab
2. Click on running workflow
3. Watch:
   - ✅ Build and Test job (~5 minutes)
   - ✅ Deploy to Staging job (~3 minutes)
4. Check deployment summary at bottom

## Step 8: Verify Application (2 minutes)

Once deployment succeeds:
1. Go to deployment summary
2. Click application URL: `https://myschoolweb-staging.{your-account-id}.workers.dev`
3. Verify:
   - [ ] Page loads (HTTP 200)
   - [ ] Login page displays
   - [ ] No console errors

## Troubleshooting Quick Reference

### "Secret not found" Error
→ Add secrets to `staging` **environment**, not repository secrets

### "Cloudflare API authentication failed"
→ Regenerate API Token with Workers permissions

### "Worker deployment failed"
→ Check deployment size <5MB, verify Account ID

### "Supabase connection failed"
→ Verify URL format: `https://PROJECT_ID.supabase.co`, check keys not swapped

### "Health check failed (404 or 500)"
→ Wait 2-3 minutes for Worker initialization, check Worker logs

## View Deployment Logs

```bash
# Install Wrangler CLI (first time only)
npm install -g wrangler

# Authenticate (first time only)
wrangler login

# View live logs
wrangler tail --env staging
```

## Total Time Estimate

- Gathering credentials: **15 minutes**
- GitHub setup: **7 minutes**
- Deployment: **10 minutes**
- Verification: **2 minutes**

**Total: ~35 minutes**

## Need Help?

- **Detailed Guide**: `GITHUB_ENVIRONMENT_SETUP_GUIDE.md`
- **Implementation Summary**: `../PHASE_8_DEVOPS_IMPLEMENTATION_SUMMARY.md`
- **DevOps Engineer**: Review GitHub Actions logs for detailed errors

---

**Quick Start Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**For Detailed Instructions:** See `GITHUB_ENVIRONMENT_SETUP_GUIDE.md`
