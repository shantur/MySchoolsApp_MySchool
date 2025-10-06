# Firebase Setup for MySchool Next.js Application

## Quick Start

This directory contains the MySchool Next.js application that integrates with the `myschools-app-dev` Firebase project.

### Automated Setup (Recommended)

Run the automated setup script:

```bash
cd myschool/
./setup-firebase-credentials.sh
```

This script will:
1. ✅ Check Firebase CLI authentication
2. ✅ Retrieve Firebase Client SDK configuration
3. ✅ Generate Firebase Admin SDK service account key
4. ✅ Create `.env.local` with all necessary environment variables
5. ✅ Update `.gitignore` to prevent committing sensitive files

### Manual Setup

If you prefer manual setup or the automated script fails, follow the detailed guide:

📖 **[Complete Setup Guide](../docs/devops/FIREBASE_CREDENTIALS_SETUP_GUIDE.md)**

---

## Required Environment Variables

Your `.env.local` file must contain:

### Client SDK (Public - exposed to browser)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myschools-app-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myschools-app-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myschools-app-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Admin SDK (Private - server-side only)
```bash
FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json
# OR (for production)
FIREBASE_ADMIN_KEY_BASE64=<base64-encoded-service-account-json>
```

---

## Security Checklist

Before committing any code, ensure:

- [ ] `.env.local` is in `.gitignore`
- [ ] `firebase-admin-key.json` is in `.gitignore`
- [ ] No credentials are hardcoded in source files
- [ ] All sensitive files are listed in `.gitignore`

Run this to verify:
```bash
git status --ignored | grep -E "(\.env|firebase-admin-key)"
```

If these files show up, they're properly ignored. ✅

---

## Troubleshooting

### "Failed to authenticate, have you run firebase login?"

**Solution:**
```bash
firebase login
```

### "Could not retrieve client SDK config"

**Solution:** Create a web app in Firebase Console first:
1. Go to [Firebase Console](https://console.firebase.google.com/project/myschools-app-dev/settings/general)
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register app with nickname "MySchool Web"
4. Copy the config object and update `.env.local`

### "Permission denied when generating service account key"

**Solution:** Generate it manually:
1. Go to [Service Accounts](https://console.firebase.google.com/project/myschools-app-dev/settings/serviceaccounts/adminsdk)
2. Click "Generate New Private Key"
3. Save as `firebase-admin-key.json` in this directory

---

## Verification

Test your Firebase setup:

```bash
# Install dependencies first
npm install

# Test Client SDK
node -e "console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing')"

# Test Admin SDK
node -e "const fs=require('fs'); console.log('Admin Key:', fs.existsSync('./firebase-admin-key.json') ? '✓ Found' : '✗ Missing')"
```

---

## Next Steps

After Firebase setup is complete:

1. ✅ Install dependencies: `npm install`
2. ✅ Initialize Firebase in your Next.js app
3. ✅ Test Firebase connection
4. ✅ Implement Firebase services (Auth, Firestore, Storage, etc.)

---

## Additional Resources

- 📖 [Complete Setup Guide](../docs/devops/FIREBASE_CREDENTIALS_SETUP_GUIDE.md)
- 🔥 [Firebase Console](https://console.firebase.google.com/project/myschools-app-dev)
- 📚 [Firebase Documentation](https://firebase.google.com/docs)
- 🛠️ [Next.js Firebase Integration](https://firebase.google.com/docs/web/setup)

---

**Need Help?**

If you encounter issues:
1. Check the [detailed setup guide](../docs/devops/FIREBASE_CREDENTIALS_SETUP_GUIDE.md)
2. Verify Firebase project access in [Firebase Console](https://console.firebase.google.com/)
3. Ensure you're using the correct Firebase project: `myschools-app-dev`

---

**Last Updated:** 2025-10-06  
**Firebase Project:** myschools-app-dev  
**Environment:** Development
