#!/bin/bash

# Firebase Deployment Setup Script for MySchoolWeb
# This script helps set up Firebase deployment for the myschoolweb-19261 project

set -e  # Exit on error

echo "================================================"
echo "Firebase Deployment Setup for MySchoolWeb"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed.${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI found${NC}"

# Check if already authenticated
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠ Not authenticated with Firebase${NC}"
    echo ""
    echo "To authenticate for CI/CD deployment, run:"
    echo -e "${BLUE}firebase login:ci${NC}"
    echo ""
    echo "This will generate a token that you need to add as a GitHub Secret:"
    echo -e "${BLUE}FIREBASE_TOKEN${NC}"
    echo ""
    echo "After authentication, please run this script again."
    exit 1
else
    echo -e "${GREEN}✓ Already authenticated with Firebase${NC}"
fi

# Verify access to myschoolweb-19261 project
echo ""
echo "Checking access to myschoolweb-19261 project..."
if ! firebase use myschoolweb-19261 &> /dev/null; then
    echo -e "${RED}Error: Cannot access myschoolweb-19261 project${NC}"
    echo "Please ensure you have permissions to this project."
    echo ""
    echo "Available projects:"
    firebase projects:list
    exit 1
fi
echo -e "${GREEN}✓ Access to myschoolweb-19261 confirmed${NC}"

# Step 1: Generate CI/CD Token
echo ""
echo "================================================"
echo "Step 1: Generating Firebase CI/CD Token"
echo "================================================"
echo ""

if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${YELLOW}⚠ No FIREBASE_TOKEN found in environment${NC}"
    echo ""
    echo "To generate a token for CI/CD deployment:"
    echo -e "${BLUE}firebase login:ci${NC}"
    echo ""
    echo "Add the generated token as a GitHub Secret named:"
    echo -e "${BLUE}FIREBASE_TOKEN${NC}"
    echo ""
    read -p "Press Enter to continue after setting up the token..."
else
    echo -e "${GREEN}✓ FIREBASE_TOKEN found in environment${NC}"
fi

# Step 2: Generate Service Account Key
echo ""
echo "================================================"
echo "Step 2: Generating Service Account Key"
echo "================================================"

# Check if service account key already exists
if [ -f "firebase-admin-key.json" ]; then
    echo -e "${YELLOW}⚠ firebase-admin-key.json already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing service account key..."
        SKIP_ADMIN_KEY=true
    fi
fi

if [ "$SKIP_ADMIN_KEY" != "true" ]; then
    echo "Generating service account key..."
    
    # Try to generate the key
    if firebase apps:sdkconfig admin --json > firebase-admin-key.json 2>/dev/null; then
        echo -e "${GREEN}✓ Admin SDK key generated: firebase-admin-key.json${NC}"
    else
        echo -e "${YELLOW}⚠ Could not generate Admin SDK key via CLI${NC}"
        echo "You'll need to generate it manually:"
        echo "  1. Go to Firebase Console → Project Settings → Service Accounts"
        echo "  2. Click 'Generate New Private Key'"
        echo "  3. Save the file as firebase-admin-key.json in this directory"
        MANUAL_ADMIN_KEY=true
    fi
fi

# Step 3: Generate Base64 Encoded Service Account
echo ""
echo "================================================"
echo "Step 3: Generating Base64 Encoded Service Account"
echo "================================================"

if [ -f "firebase-admin-key.json" ]; then
    BASE64_KEY=$(cat firebase-admin-key.json | base64 -w 0)
    echo -e "${GREEN}✓ Base64 encoded service account generated${NC}"
    echo ""
    echo "Add this as a GitHub Secret named:"
    echo -e "${BLUE}FIREBASE_SERVICE_ACCOUNT_DEV${NC}"
    echo ""
    echo "Base64 value (copy this entire line):"
    echo -e "${BLUE}${BASE64_KEY}${NC}"
    echo ""
else
    echo -e "${RED}❌ firebase-admin-key.json not found${NC}"
    echo "Please generate the service account key first."
fi

# Step 4: Generate Session Secret
echo ""
echo "================================================"
echo "Step 4: Generating Session Secret"
echo "================================================"

SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo -e "${GREEN}✓ Session secret generated${NC}"
echo ""
echo "Add this as a GitHub Secret named:"
echo -e "${BLUE}SESSION_SECRET${NC}"
echo ""
echo "Session secret (copy this entire line):"
echo -e "${BLUE}${SESSION_SECRET}${NC}"
echo ""

# Step 5: Retrieve Client SDK Configuration
echo ""
echo "================================================"
echo "Step 5: Retrieving Firebase Client SDK Config"
echo "================================================"

CLIENT_SDK_OUTPUT=$(firebase apps:sdkconfig web 2>&1) || true

# Check if we got valid output
if echo "$CLIENT_SDK_OUTPUT" | grep -q "apiKey"; then
    echo -e "${GREEN}✓ Client SDK config retrieved${NC}"
    echo ""
    echo "$CLIENT_SDK_OUTPUT"
    echo ""
    
    # Parse the values for GitHub Secrets
    API_KEY=$(echo "$CLIENT_SDK_OUTPUT" | grep "apiKey" | cut -d'"' -f4)
    AUTH_DOMAIN=$(echo "$CLIENT_SDK_OUTPUT" | grep "authDomain" | cut -d'"' -f4)
    PROJECT_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "projectId" | cut -d'"' -f4)
    STORAGE_BUCKET=$(echo "$CLIENT_SDK_OUTPUT" | grep "storageBucket" | cut -d'"' -f4)
    MESSAGING_SENDER_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "messagingSenderId" | cut -d'"' -f4)
    APP_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "appId" | cut -d'"' -f4)
    
    echo "Add these as GitHub Secrets (with NEXT_PUBLIC_ prefix):"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_API_KEY${NC}: ${API_KEY}"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN${NC}: ${AUTH_DOMAIN}"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_PROJECT_ID${NC}: ${PROJECT_ID}"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET${NC}: ${STORAGE_BUCKET}"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID${NC}: ${MESSAGING_SENDER_ID}"
    echo -e "${BLUE}NEXT_PUBLIC_FIREBASE_APP_ID${NC}: ${APP_ID}"
    echo ""
else
    echo -e "${YELLOW}⚠ Could not retrieve client SDK config automatically${NC}"
    echo "You may need to create a web app first:"
    echo "  1. Go to Firebase Console → Project Settings"
    echo "  2. Click 'Add app' → Web"
    echo "  3. Register the app and copy the config"
fi

# Step 6: Enable Firebase Hosting
echo ""
echo "================================================"
echo "Step 6: Enabling Firebase Hosting"
echo "================================================"

echo "Checking Firebase Hosting status..."
if firebase hosting:sites:list --project=myschoolweb-19261 | grep -q "No sites"; then
    echo "Enabling Firebase Hosting..."
    firebase hosting:sites:create myschoolweb-19261 --project=myschoolweb-19261
    echo -e "${GREEN}✓ Firebase Hosting enabled${NC}"
else
    echo -e "${GREEN}✓ Firebase Hosting already enabled${NC}"
fi

# Step 7: Deploy Security Rules
echo ""
echo "================================================"
echo "Step 7: Deploying Security Rules"
echo "================================================"

echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules --project=myschoolweb-19261

echo "Deploying Storage rules..."
firebase deploy --only storage:rules --project=myschoolweb-19261

echo -e "${GREEN}✓ Security rules deployed${NC}"

# Final Summary
echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo -e "${GREEN}✓ Firebase deployment configured for myschoolweb-19261${NC}"
echo ""
echo "Required GitHub Secrets:"
echo "1. ${BLUE}FIREBASE_TOKEN${NC} - Generate with: firebase login:ci"
echo "2. ${BLUE}FIREBASE_SERVICE_ACCOUNT_DEV${NC} - Base64 encoded service account"
echo "3. ${BLUE}SESSION_SECRET${NC} - 64+ character random string"
echo "4. ${BLUE}NEXT_PUBLIC_FIREBASE_API_KEY${NC} - From Client SDK config"
echo "5. ${BLUE}NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN${NC} - From Client SDK config"
echo "6. ${BLUE}NEXT_PUBLIC_FIREBASE_PROJECT_ID${NC} - From Client SDK config"
echo "7. ${BLUE}NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET${NC} - From Client SDK config"
echo "8. ${BLUE}NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID${NC} - From Client SDK config"
echo "9. ${BLUE}NEXT_PUBLIC_FIREBASE_APP_ID${NC} - From Client SDK config"
echo ""
echo "Next Steps:"
echo "1. Add all the GitHub Secrets to your repository"
echo "2. Push to main or develop branch to trigger deployment"
echo "3. Monitor the deployment in GitHub Actions"
echo ""
echo "Custom Domain Setup:"
echo "1. Go to Firebase Console → Hosting → Custom Domains"
echo "2. Add myschoolweb.myschools.app"
echo "3. Follow the DNS verification instructions"
echo ""
echo -e "${GREEN}Ready for deployment! 🚀${NC}"