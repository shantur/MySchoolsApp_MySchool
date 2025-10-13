# MySchoolWeb Firebase Hosting Deployment Guide

**Document Version:** 1.0  
**Date:** October 13, 2025  
**Status:** Ready for Implementation

## Overview

This guide provides step-by-step instructions for deploying MySchoolWeb to Firebase Hosting with the custom domain `myschoolweb.myschools.app`.

## Prerequisites

1. **Firebase CLI** installed: `npm install -g firebase-tools`
2. **Access** to the `myschoolweb-19261` Firebase project
3. **GitHub repository** with appropriate permissions
4. **Domain access** to configure DNS for `myschoolweb.myschools.app`

## Quick Start

For automated setup, run the provided script:

```bash
cd myschoolweb
./setup-firebase-deployment.sh
```

This script will:
- Verify Firebase project access
- Generate required tokens and secrets
- Enable Firebase Hosting
- Deploy security rules
- Provide all GitHub Secrets needed for CI/CD

## Manual Setup Steps

### Step 1: Firebase Authentication

Generate a CI/CD token for GitHub Actions:

```bash
firebase login:ci
```

Copy the generated token - this will be used as the `FIREBASE_TOKEN` GitHub Secret.

### Step 2: Project Configuration

Verify the project configuration:

```bash
cd myschoolweb
firebase use myschoolweb-19261
```

Check that `.firebaserc` points to the correct project:

```json
{
  "projects": {
    "default": "myschoolweb-19261"
  }
}
```

### Step 3: Service Account Setup

Generate a service account key for the backend:

```bash
firebase apps:sdkconfig admin --json > firebase-admin-key.json
```

Convert to base64 for GitHub Secrets:

```bash
cat firebase-admin-key.json | base64 -w 0
```

### Step 4: GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

#### Required Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `FIREBASE_TOKEN` | CI/CD token from `firebase login:ci` | Deployment authentication |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | Base64 service account | Backend authentication |
| `SESSION_SECRET` | 64+ character random string | JWT signing secret |

#### Client SDK Secrets (from Firebase Console)

Generate these from Firebase Console → Project Settings → General → Your Apps:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key | Firebase client authentication |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | Cloud Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | Firebase app identifier |

### Step 5: Enable Firebase Hosting

```bash
firebase hosting:sites:create myschoolweb-19261 --project=myschoolweb-19261
```

### Step 6: Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project=myschoolweb-19261

# Deploy Storage rules
firebase deploy --only storage:rules --project=myschoolweb-19261
```

### Step 7: Custom Domain Setup

1. **Add Custom Domain in Firebase Console:**
   - Go to Firebase Console → Hosting → Custom Domains
   - Click "Add Custom Domain"
   - Enter: `myschoolweb.myschools.app`

2. **DNS Verification:**
   - Firebase will provide TXT records for verification
   - Add these records to your DNS configuration
   - Wait for verification (can take up to 24 hours)

3. **A Record Configuration:**
   - After verification, Firebase will provide A records
   - Configure these in your DNS settings

#### Required DNS Records

**TXT Record (for verification):**
```
Type: TXT
Name: _acme-challenge.myschoolweb
Value: [provided-by-firebase]
TTL: 300 (or as low as your DNS provider allows)
```

**A Records (after verification):**
```
Type: A
Name: myschoolweb
Value: 199.36.158.100
TTL: 3600

Type: A
Name: myschoolweb
Value: 199.36.158.101
TTL: 3600

Type: A
Name: myschoolweb
Value: 199.36.158.102
TTL: 3600

Type: A
Name: myschoolweb
Value: 199.36.158.103
TTL: 3600
```

### Step 8: Trigger Deployment

Push to the `main` or `develop` branch to trigger the CI/CD pipeline:

```bash
git add .
git commit -m "Configure Firebase deployment for myschoolweb-19261"
git push origin main
```

## CI/CD Pipeline

The deployment pipeline includes:

1. **Quality Gates:**
   - ESLint checks (zero warnings)
   - TypeScript compilation
   - Unit tests with coverage
   - API tests
   - Service tests
   - E2E tests

2. **Build Process:**
   - Next.js production build
   - Cloud Functions preparation
   - Deployment size validation (<350MB)

3. **Deployment:**
   - Firebase Hosting deployment
   - Cloud Functions deployment
   - Security rules deployment
   - Health check verification

## Monitoring and Verification

### Post-Deployment Checklist

- [ ] `https://myschoolweb.myschools.app` loads successfully
- [ ] SSL certificate is valid
- [ ] Health check endpoint returns HTTP 200
- [ ] Firebase Console shows successful deployment
- [ ] All tests pass in CI/CD pipeline
- [ ] Deployment size is within limits

### Health Check

The application includes a health check endpoint. Verify it's working:

```bash
curl -I https://myschoolweb.myschools.app/health
```

Expected response: `HTTP/2 200`

### Firebase Console Monitoring

Monitor deployment in:
- Firebase Console → Hosting → Deploy history
- Firebase Console → Functions → Logs
- GitHub Actions → Workflow runs

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Verify `FIREBASE_TOKEN` is correct
   - Check service account permissions
   - Ensure project ID is correct

2. **DNS Propagation:**
   - DNS changes can take 24-48 hours
   - Use `dig` or `nslookup` to verify records
   - Check TTL settings

3. **Build Failures:**
   - Review GitHub Actions logs
   - Check deployment size limits
   - Verify all dependencies are installed

4. **SSL Certificate Issues:**
   - Wait for automatic provisioning (up to 24 hours)
   - Ensure DNS records are correct
   - Check domain ownership verification

### Rollback Procedure

If deployment fails:

1. **Firebase Hosting Rollback:**
   ```bash
   firebase hosting:rollback --project=myschoolweb-19261
   ```

2. **Previous Version:**
   - Go to Firebase Console → Hosting
   - Select previous deployment
   - Click "Rollback"

## Performance Targets

- **Cold Start:** < 3 seconds
- **Warm Requests:** < 500ms
- **Memory Usage:** < 1.5GB under load
- **Deployment Size:** < 350MB (target), < 500MB (maximum)

## Security Considerations

1. **Secrets Management:**
   - Never commit credentials to version control
   - Rotate secrets regularly
   - Use GitHub Secrets for CI/CD

2. **Firebase Security Rules:**
   - Review Firestore rules before deployment
   - Test rules with Firebase Emulator
   - Monitor for unauthorized access

3. **Domain Security:**
   - Ensure HTTPS is enforced
   - Monitor SSL certificate status
   - Consider implementing HSTS

## Support

For issues:
1. Check GitHub Actions logs
2. Review Firebase Console logs
3. Consult the troubleshooting section
4. Contact the DevOps team

---

**Status:** ✅ Ready for Implementation  
**Next Steps:** Execute setup script and configure GitHub Secrets