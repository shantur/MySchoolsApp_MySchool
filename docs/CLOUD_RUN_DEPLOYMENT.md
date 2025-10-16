# MySchoolsWeb - Cloud Run Deployment Guide

## Overview

This guide covers deploying MySchoolsWeb to Google Cloud Run, which provides full Next.js compatibility including POST request handling.

## Architecture

```
User Request
    ↓
Firebase Hosting (CDN, SSL, Custom Domain)
    ↓
Cloud Run Service (Next.js App)
    ↓
Firebase Services (Firestore, Auth, Storage)
```

## Prerequisites

1. **Google Cloud SDK (gcloud)** installed and authenticated
2. **Firebase CLI** installed and authenticated
3. **Docker** (optional - Cloud Build can build remotely)
4. **Firebase Project** with billing enabled

## Initial Setup (One-time)

### 1. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project myschoolweb-19261

# Authenticate for application default credentials
gcloud auth application-default login
```

### 2. Enable Required APIs

The deployment script will enable these automatically, but you can do it manually:

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Set Environment Variables

Cloud Run will need production Firebase configuration. Set them during deployment:

```bash
# Get your Firebase config from Firebase Console
# Project Settings → General → Your apps → Web app config

# These will be set via the deployment script
# Or manually via Cloud Run console
```

## Deployment Steps

### Quick Deploy (Recommended)

```bash
# Deploy everything (Cloud Run + Firebase Hosting)
npm run deploy
```

This runs:
1. Builds Docker image with Cloud Build
2. Deploys to Cloud Run
3. Deploys Firebase Hosting configuration

### Manual Deploy (Step-by-step)

#### Step 1: Deploy to Cloud Run

```bash
npm run deploy:cloudrun
```

This script:
- Builds Docker image using Cloud Build
- Deploys to Cloud Run in `us-central1`
- Configures service with:
  - 1 GB memory
  - 1 CPU
  - 60s timeout
  - 0-100 instances (auto-scaling)
  - Public access (unauthenticated)

#### Step 2: Verify Cloud Run Deployment

After deployment, test the Cloud Run service directly:

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe myschoolweb-nextjs \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

echo "Service URL: $SERVICE_URL"

# Test GET endpoint
curl "$SERVICE_URL/api/test-simple"

# Test POST endpoint
curl -X POST "$SERVICE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"TestAdmin123!"}'
```

#### Step 3: Deploy Firebase Hosting

```bash
npm run deploy:hosting
```

This updates Firebase Hosting to route traffic to Cloud Run.

#### Step 4: Test Production Deployment

```bash
# Access via Firebase Hosting URL
curl https://myschoolweb-19261.web.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"TestAdmin123!"}'
```

## Environment Variables

### Cloud Run Environment Variables

Set via deployment script or Cloud Run console:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `NEXT_TELEMETRY_DISABLED` | No | Set to `1` to disable telemetry |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `SESSION_SECRET` | Yes | Secure random string (min 32 chars) |

### Setting Environment Variables

```bash
# Update Cloud Run service with new environment variables
gcloud run services update myschoolweb-nextjs \
  --region us-central1 \
  --set-env-vars "SESSION_SECRET=your-secure-secret-here" \
  --set-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key"
```

## Firebase Admin SDK Authentication

Cloud Run automatically uses Google Cloud default credentials when running on Google Cloud Platform. **No service account key file is needed.**

The Firebase Admin SDK will automatically authenticate using the Cloud Run service account.

## Monitoring & Logs

### View Cloud Run Logs

```bash
# View logs in terminal
gcloud run services logs read myschoolweb-nextjs \
  --region us-central1 \
  --limit 100

# Or view in Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/myschoolweb-nextjs/logs
```

### View Metrics

```bash
# View metrics via gcloud
gcloud run services describe myschoolweb-nextjs \
  --region us-central1 \
  --format yaml

# Or view in Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/myschoolweb-nextjs/metrics
```

## Rollback

### Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list \
  --service myschoolweb-nextjs \
  --region us-central1

# Rollback to specific revision
gcloud run services update-traffic myschoolweb-nextjs \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

## Cost Optimization

Cloud Run pricing is based on:
- **CPU/Memory usage** (per 100ms)
- **Requests** (per million)
- **Networking** (egress)

Current configuration:
- Min instances: 0 (scales to zero when idle)
- Max instances: 100 (prevents runaway costs)
- Memory: 1 GB
- CPU: 1

**Expected costs for low traffic**: $0-5/month (with generous free tier)

## Troubleshooting

### Build Fails

```bash
# Check Cloud Build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log BUILD_ID
```

### Deployment Fails

```bash
# Check Cloud Run deployment status
gcloud run services describe myschoolweb-nextjs \
  --region us-central1 \
  --format yaml
```

### POST Requests Still Timeout

1. Verify Cloud Run deployment succeeded
2. Check Cloud Run logs for errors
3. Test Cloud Run URL directly (bypass Firebase Hosting)
4. Verify firebase.json uses `run` not `function`

### Environment Variables Not Working

```bash
# List current environment variables
gcloud run services describe myschoolweb-nextjs \
  --region us-central1 \
  --format "value(spec.template.spec.containers[0].env)"
```

## Local Testing with Docker

Build and test the Docker image locally before deploying:

```bash
# Build image
docker build -t myschoolweb-nextjs .

# Run locally
docker run -p 8080:8080 myschoolweb-nextjs

# Test
curl http://localhost:8080/api/test-simple
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: myschoolweb-19261
      
      - name: Deploy to Cloud Run
        run: npm run deploy:cloudrun
      
      - name: Deploy Firebase Hosting
        run: npm run deploy:hosting
```

## Migration from Cloud Functions

The following files are **no longer used** with Cloud Run:
- `functions/` directory (entire directory)
- Cloud Functions deployment scripts
- `build:functions` script in package.json

These can be removed after confirming Cloud Run deployment works.

## Support

For issues:
1. Check Cloud Run logs
2. Verify environment variables
3. Test Cloud Run URL directly
4. Review [Next.js on Cloud Run docs](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nextjs-service)
