# MySchoolWeb CI/CD Setup Guide

**Purpose**: Quick setup guide for configuring GitHub Secrets and environment variables for MySchoolWeb CI/CD pipeline  
**Target Audience**: Developers and DevOps engineers  
**Time Required**: 15-30 minutes  

## Prerequisites

- Access to the MySchoolWeb GitHub repository
- Admin access to Firebase projects (dev/staging/prod)
- Firebase CLI installed locally
- Git configured for GitHub operations

## Step 1: Firebase Service Account Setup

### 1.1 Create Service Accounts

For each Firebase project (development, staging, production):

```bash
# 1. Go to Firebase Console: https://console.firebase.google.com
# 2. Select your project (e.g., myschools-app-dev)
# 3. Go to Project Settings → Service accounts
# 4. Click "Create service account"
# 5. Enter service account details:
#    - Name: "github-actions-deployer"
#    - Description: "GitHub Actions deployment service account"
# 6. Click "Create and continue"
# 7. Add roles (minimum required):
#    - Firebase Admin
#    - Cloud Functions Developer
#    - Firebase Hosting Admin
#    - Cloud Datastore User (for Firestore)
#    - Storage Object Admin (for Firebase Storage)
# 8. Click "Continue" and "Done"
# 9. Find your service account and click "Keys" tab
# 10. Click "Add Key" → "Create new key"
# 11. Select "JSON" and click "Create"
# 12. Save the downloaded JSON file securely
```

### 1.2 Encode Service Account Keys

For each downloaded JSON file:

```bash
# Encode the service account JSON to base64
base64 -w 0 service-account.json

# Example output (copy this entire string):
# ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXlzY2hvb2xzLWFwcC1kZXYiLAogICJwcml2YXRlX2tleV9pZCI6ICJleGFtcGxlLWtleS1pZCIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLSIsCiAgImNsaWVudF9lbWFpbCI6ICJnaXRodWItYWN0aW9uc0BteXNjaG9vbHMtYXBwLWRldi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICJleGFtcGxlLWNsaWVudC1pZCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIgp9Cg==
```

### 1.3 Add Service Account Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Environment |
|-------------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_DEV` | Base64 encoded dev service account | Development |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Base64 encoded staging service account | Staging |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Base64 encoded production service account | Production |

## Step 2: Firebase CI Token Setup

### 2.1 Generate Firebase CI Token

```bash
# Login to Firebase (opens browser for authentication)
firebase login

# Generate CI token (copy the output)
firebase login:ci

# Example output (copy this token):
# 1//0gExampleTokenStringThatIsVeryLongAndNeedsToBeCopiedExactly
```

### 2.2 Add Firebase Token to GitHub

1. In GitHub Secrets, click **New repository secret**
2. **Name**: `FIREBASE_TOKEN`
3. **Value**: Paste the token from Step 2.1
4. Click **Add secret**

## Step 3: Application Secrets Setup

### 3.1 Generate Session Secret

Generate a strong random secret for JWT signing:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 48

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 3.2 Add Session Secret to GitHub

1. In GitHub Secrets, click **New repository secret**
2. **Name**: `SESSION_SECRET`
3. **Value**: Paste the generated secret (64+ characters recommended)
4. Click **Add secret**

## Step 4: Public Environment Variables

### 4.1 Get Firebase Configuration

For each Firebase project, get the web app configuration:

```bash
# Method 1: Using Firebase CLI
firebase apps:sdkconfig web

# Method 2: From Firebase Console
# 1. Go to Project Settings → General
# 2. Scroll down to "Your apps" section
# 3. Click on your web app
# 4. Copy the "Firebase SDK snippet" configuration
```

### 4.2 Add Environment Variables to GitHub

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **Variables** tab (not Secrets)
3. Click **New repository variable**
4. Add the following variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIzaSyAbC123XyZ456789ExampleKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `myschools-app-dev.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `myschools-app-dev` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `myschools-app-dev.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789012:web:abcdef123456789` |

## Step 5: Verify Configuration

### 5.1 Check GitHub Secrets

Verify all secrets are configured correctly:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. **Secrets tab** should show:
   - ✅ `FIREBASE_SERVICE_ACCOUNT_DEV`
   - ✅ `FIREBASE_SERVICE_ACCOUNT_STAGING` (optional)
   - ✅ `FIREBASE_SERVICE_ACCOUNT_PROD` (optional)
   - ✅ `FIREBASE_TOKEN`
   - ✅ `SESSION_SECRET`

3. **Variables tab** should show:
   - ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
   - ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

### 5.2 Test Firebase Access Locally

```bash
# Test service account access
firebase projects:list

# Test deployment access (dry run)
firebase deploy --dry-run --only hosting

# Test functions config
firebase functions:config:get
```

## Step 6: First Deployment Test

### 6.1 Trigger Workflow

1. Create a test branch or push to `develop` branch
2. Go to **Actions** tab in GitHub
3. Click on "Deploy MySchoolWeb to Firebase" workflow
4. Monitor the workflow execution

### 6.2 Expected Workflow Steps

The workflow should execute these steps:

1. **test-and-build job**:
   - ✅ Code checkout
   - ✅ Node.js setup
   - ✅ Dependency installation
   - ✅ ESLint checks
   - ✅ TypeScript compilation
   - ✅ Unit tests
   - ✅ API tests
   - ✅ Service tests
   - ✅ E2E tests (with emulators)
   - ✅ Next.js build
   - ✅ Cloud Functions build
   - ✅ Size validation
   - ✅ Artifact upload

2. **deploy-firebase job** (only on main/develop branches):
   - ✅ Code checkout
   - ✅ Build artifact download
   - ✅ Firebase configuration
   - ✅ Hosting deployment
   - ✅ Functions deployment
   - ✅ Rules deployment
   - ✅ Health check
   - ✅ Deployment summary

### 6.3 Verify Deployment

1. Check the deployment summary in the workflow results
2. Visit the deployed application URL
3. Verify the application loads correctly
4. Check Firebase Console for deployment status

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Permission denied" errors
```
Error: Permission denied to access Firebase project
```
**Solution**: 
- Verify service account has required roles
- Check service account is enabled
- Ensure Firebase project ID is correct

#### Issue 2: "Invalid Firebase token" errors
```
Error: Invalid Firebase CI token
```
**Solution**:
- Regenerate Firebase CI token: `firebase login:ci`
- Update FIREBASE_TOKEN secret in GitHub
- Ensure token hasn't expired

#### Issue 3: "Missing environment variable" errors
```
Error: Missing required environment variable
```
**Solution**:
- Check all required secrets are set in GitHub
- Verify secret names match exactly (case-sensitive)
- Ensure base64 encoding is correct

#### Issue 4: "Deployment size too large" errors
```
Error: Deployment size exceeds 350MB threshold
```
**Solution**:
- Run `npm run check-size` locally
- Remove unnecessary dependencies
- Optimize Next.js build output

#### Issue 5: "E2E test failures" errors
```
Error: Firebase Emulators not ready
```
**Solution**:
- Check emulator startup logs
- Verify port availability
- Increase timeout in workflow

### Debugging Commands

```bash
# Test Firebase authentication
firebase login --reauth

# Check project access
firebase projects:list

# Test deployment configuration
firebase deploy --dry-run --only hosting,functions

# Check functions configuration
firebase functions:config:get

# Test local build
npm run build:functions
npm run check-size
```

## Security Best Practices

### Secret Management
- ✅ Never commit secrets to repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly (90 days recommended)
- ✅ Use minimum required permissions
- ✅ Monitor secret access logs

### Access Control
- ✅ Limit repository admin access
- ✅ Use branch protection for main branch
- ✅ Require PR reviews for main branch
- ✅ Monitor workflow execution logs

### Compliance
- ✅ Document secret rotation schedule
- ✅ Maintain audit trail of changes
- ✅ Regular security reviews
- ✅ Compliance with organizational policies

## Maintenance

### Regular Tasks
- **Monthly**: Review and rotate secrets
- **Quarterly**: Update dependencies and Firebase CLI
- **Semi-annually**: Review workflow performance
- **Annually**: Security audit and access review

### Monitoring
- **Daily**: Check workflow success/failure rates
- **Weekly**: Review deployment metrics
- **Monthly**: Analyze performance trends
- **Quarterly**: Cost and usage analysis

## Support Resources

### Documentation
- **Workflow Documentation**: `.github/workflows/README.md`
- **Implementation Summary**: `CI_CD_IMPLEMENTATION_SUMMARY.md`
- **Firebase Documentation**: https://firebase.google.com/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions

### Troubleshooting Help
- **Workflow Logs**: GitHub Actions tab
- **Firebase Console**: https://console.firebase.google.com
- **GitHub Support**: Repository settings → Support
- **Firebase Support**: Firebase Console → Help & Support

### Community Resources
- **GitHub Actions Community**: https://github.community/c/code-to-cloud/github-actions
- **Firebase Community**: https://firebase.google.com/community
- **Stack Overflow**: Tags [firebase], [github-actions]

---

## Setup Checklist

- [ ] Firebase service accounts created for all environments
- [ ] Service accounts encoded to base64 and added to GitHub Secrets
- [ ] Firebase CI token generated and added to GitHub Secrets
- [ ] Session secret generated and added to GitHub Secrets
- [ ] Public environment variables added to GitHub Variables
- [ ] Local Firebase access verified
- [ ] Test deployment executed successfully
- [ ] Production deployment verified
- [ ] Documentation reviewed and understood
- [ ] Security best practices implemented

**Estimated Setup Time**: 15-30 minutes  
**Support Contact**: DevOps Engineer or Technical Architect  

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0  
**Next Review**: January 12, 2026