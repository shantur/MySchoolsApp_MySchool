# GitHub Environment Setup Guide for MySchoolWeb Cloudflare Workers Deployment

## Overview

This guide provides step-by-step instructions for the Product Owner to set up the GitHub Environment `staging` with the required environment variables and secrets for deploying MySchoolWeb to Cloudflare Workers using OpenNext.js and Supabase.

## Prerequisites

Before starting, ensure you have:
1. ✅ GitHub repository access with admin permissions
2. ✅ Supabase project created with credentials available
3. ✅ Cloudflare account with Workers enabled
4. ✅ Cloudflare API Token with Workers permissions

## Step 1: Create GitHub Environment 'staging'

### 1.1 Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/YOUR_ORG/myschoolweb`
2. Click on **Settings** tab
3. In the left sidebar, click on **Environments**

### 1.2 Create Staging Environment

1. Click the **New environment** button
2. Enter environment name: `staging`
3. Click **Configure environment**

### 1.3 Optional: Add Environment Protection Rules

For additional security, you can configure:
- **Required reviewers**: Add team members who must approve deployments
- **Wait timer**: Add a delay before deployment proceeds
- **Deployment branches**: Restrict which branches can deploy to staging

**Recommendation for Staging:**
- No required reviewers (to allow automatic deployments)
- No wait timer
- Allow `develop` branch only

## Step 2: Configure Supabase Credentials

You'll need three Supabase credentials. Obtain them from your Supabase project dashboard.

### 2.1 Get Supabase Credentials

1. Go to **Supabase Dashboard**: https://app.supabase.com/
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmno.supabase.co`)
   - **anon / public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **KEEP THIS SECRET!**

### 2.2 Add Supabase Secrets to GitHub Environment

In your GitHub repository's `staging` environment:

1. Scroll down to **Environment secrets**
2. Click **Add secret** and create three secrets:

#### Secret 1: SUPABASE_URL
- **Name:** `SUPABASE_URL`
- **Value:** Your Supabase Project URL (e.g., `https://abcdefghijklmno.supabase.co`)
- Click **Add secret**

#### Secret 2: SUPABASE_ANON_KEY
- **Name:** `SUPABASE_ANON_KEY`
- **Value:** Your Supabase anon/public key (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- Click **Add secret**

#### Secret 3: SUPABASE_SERVICE_ROLE_KEY
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Your Supabase service_role key (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **⚠️ WARNING:** This key grants full database access - never expose it to client-side code!
- Click **Add secret**

## Step 3: Configure Cloudflare Workers Credentials

You'll need your Cloudflare Account ID and an API Token with Workers permissions.

### 3.1 Get Cloudflare Account ID

1. Go to **Cloudflare Dashboard**: https://dash.cloudflare.com/
2. Select your account (or any domain in your account)
3. Scroll down in the right sidebar to find **Account ID**
4. Click the **Copy** button to copy your Account ID (format: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`)

### 3.2 Generate Cloudflare API Token

1. In Cloudflare Dashboard, click your profile icon (top right)
2. Click **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template:
   - Click **Use template** next to "Edit Cloudflare Workers"
5. Configure token permissions:
   - **Account Resources**: Select your account
   - **Zone Resources**: Not needed for Workers
   - **Permissions**: Should be pre-configured for Workers (read/write)
6. Optional: Set token expiration date
7. Click **Continue to summary**
8. Click **Create Token**
9. **IMPORTANT:** Copy the token immediately - it won't be shown again!
   - Token format: `a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0`

### 3.3 Add Cloudflare Secrets to GitHub Environment

In your GitHub repository's `staging` environment:

1. Scroll down to **Environment secrets**
2. Click **Add secret** and create two secrets:

#### Secret 4: CLOUDFLARE_ACCOUNT_ID
- **Name:** `CLOUDFLARE_ACCOUNT_ID`
- **Value:** Your Cloudflare Account ID (e.g., `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`)
- Click **Add secret**

#### Secret 5: CLOUDFLARE_API_TOKEN
- **Name:** `CLOUDFLARE_API_TOKEN`
- **Value:** Your Cloudflare API Token (e.g., `a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0`)
- **⚠️ WARNING:** This token grants deployment access - keep it secure!
- Click **Add secret**

## Step 4: Configure Application Secrets

You need to generate a secure session secret for JWT signing.

### 4.1 Generate Session Secret

Use one of these methods to generate a secure 64+ character random string:

**Method 1: Using OpenSSL (Mac/Linux)**
```bash
openssl rand -base64 48
```

**Method 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

**Method 3: Using Online Generator**
- Go to https://randomkeygen.com/
- Copy a "Fort Knox Password" (64+ characters)

**Example output:** `kJ8n2Lm9Qp1Wx3Yz5Rt7Uv0Ab6Cd8Ef4Gh2Ij9Kl1Mn3Op5Qr7St9`

### 4.2 Add Session Secret to GitHub Environment

In your GitHub repository's `staging` environment:

1. Scroll down to **Environment secrets**
2. Click **Add secret**

#### Secret 6: SESSION_SECRET
- **Name:** `SESSION_SECRET`
- **Value:** Your generated random string (64+ characters)
- Click **Add secret**

## Step 5: Configure Environment Variables

Environment variables are non-sensitive configuration values.

### 5.1 Add Cloudflare Worker Names

In your GitHub repository's `staging` environment:

1. Scroll down to **Environment variables**
2. Click **Add variable** and create two variables:

#### Variable 1: CLOUDFLARE_WORKERS_DEV_NAME
- **Name:** `CLOUDFLARE_WORKERS_DEV_NAME`
- **Value:** `myschoolweb-dev`
- Click **Add variable**

#### Variable 2: CLOUDFLARE_WORKERS_STAGING_NAME
- **Name:** `CLOUDFLARE_WORKERS_STAGING_NAME`
- **Value:** `myschoolweb-staging`
- Click **Add variable**

**Note:** These names will be used as Cloudflare Worker names. They can be customized to match your naming conventions.

## Step 6: Verify Configuration

After adding all secrets and variables, your `staging` environment should have:

### Secrets (6 total):
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `SESSION_SECRET`

### Variables (2 total):
- ✅ `CLOUDFLARE_WORKERS_DEV_NAME`
- ✅ `CLOUDFLARE_WORKERS_STAGING_NAME`

## Step 7: Test Deployment

Once all secrets and variables are configured, you can trigger a deployment:

### 7.1 Automatic Deployment (Push to develop branch)
```bash
git checkout develop
git pull origin develop
# Make a small change or empty commit
git commit --allow-empty -m "test: Trigger staging deployment"
git push origin develop
```

### 7.2 Manual Deployment (GitHub Actions UI)
1. Go to **Actions** tab in your repository
2. Select **Deploy MySchoolWeb to Cloudflare Workers** workflow
3. Click **Run workflow**
4. Select branch: `develop`
5. Select environment: `staging`
6. Click **Run workflow**

### 7.3 Monitor Deployment
1. Click on the running workflow
2. Watch the **Build and Test** job
3. Watch the **Deploy to Staging** job
4. Check deployment summary at the bottom of the page

### 7.4 Verify Deployment
Once deployment succeeds, access your application at:
```
https://myschoolweb-staging.YOUR_CLOUDFLARE_ACCOUNT_ID.workers.dev
```

Replace `YOUR_CLOUDFLARE_ACCOUNT_ID` with your actual Cloudflare Account ID.

## Troubleshooting

### Issue 1: "Secret not found" Error
**Solution:** Ensure all 6 secrets are added to the `staging` environment (not repository secrets).

### Issue 2: "Cloudflare API authentication failed"
**Solution:** 
- Verify `CLOUDFLARE_API_TOKEN` is correct and hasn't expired
- Regenerate token with Workers permissions if needed

### Issue 3: "Worker deployment failed"
**Solution:**
- Check deployment size doesn't exceed 5MB (Cloudflare Workers Paid plan limit)
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct

### Issue 4: "Supabase connection failed"
**Solution:**
- Verify `SUPABASE_URL` format: `https://PROJECT_ID.supabase.co`
- Verify `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are not swapped
- Check Supabase project is active (not paused)

### Issue 5: "Health check failed (404 or 500)"
**Solution:**
- Wait 2-3 minutes for Worker to fully initialize
- Check Worker logs: `npx wrangler tail --env staging`
- Verify Supabase RLS policies allow read access for anon key

## Security Best Practices

1. ✅ **Never commit secrets to Git** - Always use GitHub Secrets
2. ✅ **Rotate secrets regularly** - Change API tokens every 90 days
3. ✅ **Limit token permissions** - Use least-privilege principle
4. ✅ **Monitor token usage** - Check Cloudflare dashboard for API token activity
5. ✅ **Use environment-specific secrets** - Different secrets for staging vs production
6. ✅ **Enable 2FA** - On GitHub, Cloudflare, and Supabase accounts

## Optional: Production Environment Setup

To set up the `production` environment, repeat Steps 1-6 with:
- Environment name: `production`
- Use production Supabase credentials
- Use different `SESSION_SECRET`
- Update `CLOUDFLARE_WORKERS_*_NAME` variables for production
- Add deployment protection rules (required reviewers, wait timer)

**Production deployment triggers:**
- Automatic: Push to `main` branch
- Manual: GitHub Actions UI with `production` environment selected

## Support

If you encounter issues not covered in this guide:
1. Check GitHub Actions workflow logs for detailed error messages
2. Review Cloudflare Worker logs: `npx wrangler tail --env staging`
3. Check Supabase Dashboard for database connection issues
4. Contact the DevOps Engineer or Backend Technical Lead

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-10-15  
**Author:** DevOps Engineer  
**Task:** Phase 8 - CI/CD & Deployment (Task 001: Firebase to Supabase Conversion)
