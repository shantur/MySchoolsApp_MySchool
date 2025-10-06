#!/bin/bash

# Firebase Credentials Setup Script for MySchool Next.js Application
# This script helps set up Firebase credentials for the myschools-app-dev project

set -e  # Exit on error

echo "================================================"
echo "Firebase Credentials Setup for MySchool App"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo "Running firebase login..."
    firebase login
else
    echo -e "${GREEN}✓ Already authenticated with Firebase${NC}"
fi

# Verify access to myschools-app-dev project
echo ""
echo "Checking access to myschools-app-dev project..."
cd ../backend/
if ! firebase use myschools-app-dev &> /dev/null; then
    echo -e "${RED}Error: Cannot access myschools-app-dev project${NC}"
    echo "Please ensure you have permissions to this project."
    exit 1
fi
echo -e "${GREEN}✓ Access to myschools-app-dev confirmed${NC}"
cd ../myschool/

# Step 1: Retrieve Client SDK Configuration
echo ""
echo "================================================"
echo "Step 1: Retrieving Firebase Client SDK Config"
echo "================================================"
cd ../backend/
CLIENT_SDK_OUTPUT=$(firebase apps:sdkconfig web 2>&1) || true
cd ../myschool/

# Check if we got valid output
if echo "$CLIENT_SDK_OUTPUT" | grep -q "apiKey"; then
    echo -e "${GREEN}✓ Client SDK config retrieved${NC}"
    echo ""
    echo "$CLIENT_SDK_OUTPUT"
    echo ""
    
    # Try to parse the values
    API_KEY=$(echo "$CLIENT_SDK_OUTPUT" | grep "apiKey" | cut -d'"' -f4)
    AUTH_DOMAIN=$(echo "$CLIENT_SDK_OUTPUT" | grep "authDomain" | cut -d'"' -f4)
    PROJECT_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "projectId" | cut -d'"' -f4)
    STORAGE_BUCKET=$(echo "$CLIENT_SDK_OUTPUT" | grep "storageBucket" | cut -d'"' -f4)
    MESSAGING_SENDER_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "messagingSenderId" | cut -d'"' -f4)
    APP_ID=$(echo "$CLIENT_SDK_OUTPUT" | grep "appId" | cut -d'"' -f4)
else
    echo -e "${YELLOW}⚠ Could not retrieve client SDK config automatically${NC}"
    echo "You may need to create a web app first:"
    echo "  1. Go to Firebase Console → Project Settings"
    echo "  2. Click 'Add app' → Web"
    echo "  3. Register the app and copy the config"
    echo ""
    echo "Using default values (you'll need to fill them in manually)..."
    API_KEY=""
    AUTH_DOMAIN="myschools-app-dev.firebaseapp.com"
    PROJECT_ID="myschools-app-dev"
    STORAGE_BUCKET="myschools-app-dev.appspot.com"
    MESSAGING_SENDER_ID=""
    APP_ID=""
fi

# Step 2: Generate Admin SDK Service Account Key
echo ""
echo "================================================"
echo "Step 2: Generating Firebase Admin SDK Key"
echo "================================================"

# Check if service account key already exists
if [ -f "firebase-admin-key.json" ]; then
    echo -e "${YELLOW}⚠ firebase-admin-key.json already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping Admin SDK key generation..."
        SKIP_ADMIN_KEY=true
    fi
fi

if [ "$SKIP_ADMIN_KEY" != "true" ]; then
    echo "Generating service account key..."
    cd ../backend/
    
    # Try to generate the key
    if firebase apps:sdkconfig admin --json > ../myschool/firebase-admin-key.json 2>/dev/null; then
        echo -e "${GREEN}✓ Admin SDK key generated: firebase-admin-key.json${NC}"
        cd ../myschool/
    else
        echo -e "${YELLOW}⚠ Could not generate Admin SDK key via CLI${NC}"
        echo "You'll need to generate it manually:"
        echo "  1. Go to Firebase Console → Project Settings → Service Accounts"
        echo "  2. Click 'Generate New Private Key'"
        echo "  3. Save the file as firebase-admin-key.json in the myschool/ directory"
        cd ../myschool/
        MANUAL_ADMIN_KEY=true
    fi
fi

# Step 3: Create .env.local file
echo ""
echo "================================================"
echo "Step 3: Creating .env.local file"
echo "================================================"

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local file..."
        exit 0
    fi
    # Backup existing file
    cp .env.local .env.local.backup
    echo "Backed up existing .env.local to .env.local.backup"
fi

# Create .env.local with retrieved values
cat > .env.local << EOF
# ============================================
# Firebase Client SDK Configuration (Public)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=${API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${APP_ID}

# ============================================
# Firebase Admin SDK Configuration (Private)
# ============================================
# Option A: Path to service account JSON file (Development)
FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json

# Option B: Base64 encoded service account (Production - uncomment when needed)
# FIREBASE_ADMIN_KEY_BASE64=

# ============================================
# Other Configuration
# ============================================
# Add any additional environment variables below
EOF

echo -e "${GREEN}✓ Created .env.local${NC}"

# Step 4: Update .gitignore
echo ""
echo "================================================"
echo "Step 4: Updating .gitignore"
echo "================================================"

if [ ! -f ".gitignore" ]; then
    touch .gitignore
    echo "Created .gitignore file"
fi

# Check if entries already exist
if ! grep -q "firebase-admin-key.json" .gitignore; then
    cat >> .gitignore << 'EOF'

# Firebase Admin SDK
firebase-admin-key.json
firebase-admin-key.b64
**/firebase-admin-key.json
**/firebase-admin-key.b64

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# Firebase cache
.firebase/
EOF
    echo -e "${GREEN}✓ Updated .gitignore${NC}"
else
    echo -e "${GREEN}✓ .gitignore already configured${NC}"
fi

# Final Summary
echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo -e "${GREEN}✓ Firebase credentials configured${NC}"
echo ""

if [ -z "$API_KEY" ] || [ -z "$APP_ID" ]; then
    echo -e "${YELLOW}⚠ ACTION REQUIRED:${NC}"
    echo "  Please fill in the missing values in .env.local:"
    echo "    - NEXT_PUBLIC_FIREBASE_API_KEY"
    echo "    - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    echo "    - NEXT_PUBLIC_FIREBASE_APP_ID"
    echo ""
fi

if [ "$MANUAL_ADMIN_KEY" = "true" ]; then
    echo -e "${YELLOW}⚠ ACTION REQUIRED:${NC}"
    echo "  Please generate the Admin SDK key manually:"
    echo "    1. Go to: https://console.firebase.google.com/project/myschools-app-dev/settings/serviceaccounts/adminsdk"
    echo "    2. Click 'Generate New Private Key'"
    echo "    3. Save as: firebase-admin-key.json"
    echo ""
fi

echo "Next Steps:"
echo "  1. Review .env.local and fill in any missing values"
echo "  2. Ensure firebase-admin-key.json is present"
echo "  3. Run 'npm install' to install dependencies"
echo "  4. Run 'npm run dev' to start the development server"
echo ""
echo "For detailed instructions, see:"
echo "  docs/devops/FIREBASE_CREDENTIALS_SETUP_GUIDE.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
