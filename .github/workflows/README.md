# MySchoolWeb GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the MySchoolWeb Next.js application.

## Workflows

### 1. `deploy-firebase.yml`

**Purpose**: Automated CI/CD pipeline for building, testing, and deploying MySchoolWeb to Firebase Hosting and Cloud Functions.

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs**:

#### `test-and-build`
- **Purpose**: Run comprehensive tests and build the application
- **Steps**:
  1. Code checkout
  2. Node.js 18 setup with npm caching
  3. Dependency installation (`npm ci`)
  4. ESLint with zero warnings tolerance
  5. TypeScript compilation check
  6. Unit tests with coverage reporting
  7. API route tests
  8. Service layer tests
  9. Firebase Emulators setup
  10. E2E tests with Playwright
  11. Next.js build
  12. Cloud Functions build for deployment
  13. Deployment size validation (fails if >350MB)
  14. Artifact upload for deployment job

#### `deploy-firebase`
- **Purpose**: Deploy the built application to Firebase
- **Triggers**: Only runs on pushes to `main` or `develop`
- **Environment Strategy**:
  - `main` branch → Production environment
  - `develop` branch → Development environment
- **Steps**:
  1. Code checkout
  2. Node.js setup
  3. Dependency installation
  4. Build artifact download
  5. Firebase CLI installation
  6. Firebase project determination
  7. Environment variable configuration
  8. Firebase Hosting and Functions deployment
  9. Firestore and Storage rules deployment
  10. Post-deployment health check
  11. Deployment summary creation

#### `notify-on-failure`
- **Purpose**: Create detailed failure notifications
- **Triggers**: Runs only if any previous job fails
- **Steps**:
  1. Failure summary creation
  2. Job status reporting
  3. Next steps guidance

## Required GitHub Secrets

### Firebase Service Accounts
Create these secrets in your GitHub repository settings:

| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_DEV` | Base64-encoded service account JSON for development | Development |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Base64-encoded service account JSON for staging | Staging (Future) |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Base64-encoded service account JSON for production | Production (Future) |

### Environment Variables
| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SESSION_SECRET` | JWT signing secret (64+ characters) | Yes |
| `FIREBASE_TOKEN` | Firebase CI token (generated via `firebase login:ci`) | Yes |

### Public Environment Variables
These should be set in your repository settings (not as secrets):

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `myschools-app-dev` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abcdef` |

## Setup Instructions

### 1. Firebase Service Account Setup

For each environment (dev/staging/prod):

```bash
# 1. Create service account in Firebase Console
# Go to Project Settings → Service Accounts → Create Service Account

# 2. Download the JSON key file
# Save it as service-account.json

# 3. Encode to base64
base64 -w 0 service-account.json

# 4. Copy the output and add as GitHub Secret
# Name: FIREBASE_SERVICE_ACCOUNT_DEV (or _STAGING, _PROD)
```

### 2. Firebase CI Token Setup

```bash
# 1. Login to Firebase
firebase login

# 2. Generate CI token
firebase login:ci

# 3. Copy the token and add as GitHub Secret
# Name: FIREBASE_TOKEN
```

### 3. Session Secret Setup

Generate a strong random secret:

```bash
# Generate 64-character random string
openssl rand -base64 48

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Add as GitHub Secret: SESSION_SECRET
```

## Environment Configuration

### Development Environment
- **Firebase Project**: `myschools-app-dev`
- **Trigger**: Push to `develop` branch
- **URL**: `https://myschools-app-dev.web.app`

### Production Environment
- **Firebase Project**: `myschools-app-prod`
- **Trigger**: Push to `main` branch
- **URL**: `https://myschools-app-prod.web.app`

### Staging Environment (Future)
- **Firebase Project**: `myschools-app-staging`
- **Trigger**: Manual workflow dispatch with environment parameter
- **URL**: `https://myschools-app-staging.web.app`

## Quality Gates

The workflow includes several quality gates that will cause failures:

### Code Quality
- **ESLint**: Zero warnings tolerance
- **TypeScript**: No compilation errors
- **Unit Tests**: Must pass with coverage thresholds
- **API Tests**: Must pass
- **Service Tests**: Must pass

### Performance
- **Deployment Size**: Must be <350MB (Firebase limit is 500MB)
- **E2E Tests**: Must pass with Firebase Emulators

### Deployment
- **Health Check**: Deployed application must respond with HTTP 200
- **Environment Variables**: All required secrets must be configured

## Monitoring and Observability

### Build Artifacts
- **Build Artifacts**: Retained for 7 days
- **Coverage Reports**: Retained for 14 days
- **Test Results**: Retained for 14 days

### Deployment Summaries
Each successful deployment creates a summary with:
- Environment and project information
- Deployment size
- Access URLs
- Completed steps

### Failure Notifications
Failed workflows create detailed notifications with:
- Failed job identification
- Links to workflow logs
- Next steps for resolution

## Performance Targets

The workflow is designed to meet these performance targets:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold Start Time | <3 seconds | Cloud Functions monitoring |
| Warm Request Time | <500ms | Cloud Functions monitoring |
| Memory Usage | <1.5GB under load | Cloud Functions monitoring |
| Deployment Size | <300MB target, <350MB threshold | Build size check |
| Test Execution | <15 minutes total | Workflow duration |

## Troubleshooting

### Common Issues

#### 1. Firebase Service Account Errors
```
Error: Permission denied
```
**Solution**: Verify service account has required Firebase roles:
- Firebase Admin
- Cloud Functions Developer
- Firebase Hosting Admin

#### 2. Deployment Size Too Large
```
Error: Deployment size exceeds 350MB threshold
```
**Solution**: 
- Run `npm run check-size` locally
- Remove unnecessary dependencies
- Optimize Next.js build output

#### 3. E2E Test Failures
```
Error: Firebase Emulators not ready
```
**Solution**: 
- Check emulator startup logs
- Verify port availability
- Increase timeout in workflow

#### 4. Environment Variable Issues
```
Error: Missing required environment variable
```
**Solution**: 
- Verify all GitHub Secrets are set
- Check secret names match exactly
- Ensure base64 encoding is correct

### Debugging Steps

1. **Check Workflow Logs**: Review each step's output
2. **Download Artifacts**: Examine build artifacts and test results
3. **Local Reproduction**: Run failing commands locally
4. **Firebase Console**: Check deployment status and logs
5. **Emulator Testing**: Test with Firebase Emulators locally

## Security Considerations

### Secret Management
- Never commit service account keys to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly (recommended: every 90 days)
- Use minimum required permissions for service accounts

### Code Security
- Dependencies are installed with `npm ci` (uses package-lock.json)
- No external dependencies in workflow
- Firebase token has limited scope
- Environment variables are not logged

### Deployment Security
- Only `main` and `develop` branches trigger deployments
- PRs run tests but don't deploy
- Health checks verify successful deployment
- Rollback capability through Firebase Hosting

## Maintenance

### Regular Tasks
- **Monthly**: Review and rotate secrets
- **Quarterly**: Update Node.js version if needed
- **As needed**: Update Firebase CLI version
- **As needed**: Adjust deployment size thresholds

### Monitoring
- Monitor workflow duration and success rate
- Track deployment size trends
- Review test coverage reports
- Monitor Firebase usage and costs

## Future Enhancements

### Planned Improvements
1. **Multi-Environment Support**: Full staging environment setup
2. **Rollback Automation**: Automatic rollback on health check failure
3. **Performance Testing**: Load testing integration
4. **Security Scanning**: Dependency vulnerability scanning
5. **Notification Integration**: Slack/Teams notifications for deployments

### Optional Features
1. **Manual Approval**: Require approval for production deployments
2. **Blue-Green Deployment**: Zero-downtime deployments
3. **Canary Releases**: Gradual rollout for production
4. **A/B Testing**: Feature flag integration
5. **Cost Monitoring**: Deployment cost tracking and alerts