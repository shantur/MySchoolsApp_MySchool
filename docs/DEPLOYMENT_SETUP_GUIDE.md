# MySchoolsWeb - Deployment Setup Guide

## Current Status

✅ **Completed**:
- Next.js configured for standalone mode
- Dockerfile created for Cloud Run
- Firebase Hosting configured to use Cloud Run
- Build scripts updated in package.json
- Deployment script created

⚠️ **Required**: Google Cloud SDK (gcloud) installation

## Prerequisites Installation

### 1. Install Google Cloud SDK

#### macOS (using Homebrew)
```bash
brew install --cask google-cloud-sdk
```

#### macOS (manual installation)
```bash
# Download and install
curl https://sdk.cloud.google.com | bash

# Restart your shell
exec -l $SHELL

# Initialize gcloud
gcloud init
```

#### Alternative: Use Docker
If you don't want to install gcloud locally, you can use the Google Cloud SDK Docker image:

```bash
# Run deployment from Docker container
docker run -it \
  -v ~/.config/gcloud:/root/.config/gcloud \
  -v $(pwd):/workspace \
  -w /workspace \
  google/cloud-sdk:alpine \
  bash

# Then inside the container:
gcloud auth login
./deploy-cloud-run.sh
```

### 2. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set the project
gcloud config set project myschoolweb-19261

# Enable application default credentials
gcloud auth application-default login
```

### 3. Verify Firebase CLI

```bash
# Check Firebase CLI version (should be installed already)
firebase --version

# Login to Firebase if needed
firebase login
```

## Deployment Process

### Step 1: Install Google Cloud SDK (if not done)

Choose one of the installation methods above.

### Step 2: Authenticate and Configure

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set project
gcloud config set project myschoolweb-19261

# Verify current project
gcloud config get-value project
```

### Step 3: Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

### Step 4: Deploy to Cloud Run

```bash
cd /Users/shantur/Coding/MySchoolsApp/myschoolweb

# Run the deployment script
./deploy-cloud-run.sh
```

This will:
1. Build the Docker image using Cloud Build
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Configure service with optimal settings

### Step 5: Deploy Firebase Hosting

```bash
# Deploy Firebase Hosting to route traffic to Cloud Run
firebase deploy --only hosting
```

### Step 6: Test the Deployment

```bash
# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe myschoolweb-nextjs \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

# Test GET endpoint
curl "$SERVICE_URL/api/test-simple"

# Test POST endpoint (the main fix!)
curl -X POST "$SERVICE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test via Firebase Hosting
curl -X POST "https://myschoolweb-19261.web.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Environment Variables Configuration

Before first deployment, you may want to set production environment variables:

```bash
# Get Firebase config from Firebase Console
# Project Settings → General → Your apps → Web app config

# Set environment variables on Cloud Run
gcloud run services update myschoolweb-nextjs \
  --region us-central1 \
  --set-env-vars "\
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myschoolweb-19261.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myschoolweb-19261,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myschoolweb-19261.appspot.com,\
SESSION_SECRET=$(openssl rand -base64 32)"
```

## Quick Commands Reference

```bash
# Deploy everything
npm run deploy

# Deploy only Cloud Run
npm run deploy:cloudrun

# Deploy only Firebase Hosting
npm run deploy:hosting

# View Cloud Run logs
gcloud run services logs read myschoolweb-nextjs --region us-central1

# View Cloud Run details
gcloud run services describe myschoolweb-nextjs --region us-central1

# List Cloud Run services
gcloud run services list
```

## Troubleshooting

### "gcloud: command not found"

**Solution**: Install Google Cloud SDK (see Prerequisites above)

### "Permission denied" errors

**Solution**: 
```bash
gcloud auth login
gcloud auth application-default login
```

### Build fails with Docker errors

**Solution**: Cloud Build handles the build remotely, no local Docker needed. Just ensure you're authenticated with gcloud.

### POST requests still timeout

**Solution**: 
1. Verify Cloud Run deployment succeeded
2. Test Cloud Run URL directly (bypass Firebase Hosting)
3. Check Cloud Run logs: `gcloud run services logs read myschoolweb-nextjs --region us-central1`
4. Verify firebase.json uses `"run"` not `"function"`

## Cost Estimation

With the current configuration:
- **Min instances**: 0 (scales to zero)
- **Max instances**: 100
- **Memory**: 1 GB
- **CPU**: 1

**Estimated monthly cost**: $0-5 for low traffic (Google Cloud free tier covers most usage)

## Next Steps After Deployment

1. ✅ Verify POST endpoints work
2. ✅ Set up custom domain (if needed)
3. ✅ Configure production environment variables
4. ✅ Set up monitoring and alerts
5. ✅ Remove old Cloud Functions (if no longer needed)
6. ✅ Update CI/CD pipelines

## Support

For detailed information, see:
- `CLOUD_RUN_DEPLOYMENT.md` - Complete deployment documentation
- `DEPLOYMENT_POST_HANG_ROOT_CAUSE.md` - Root cause analysis
- [Next.js on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nextjs-service)
- [Firebase Hosting + Cloud Run](https://firebase.google.com/docs/hosting/cloud-run)
