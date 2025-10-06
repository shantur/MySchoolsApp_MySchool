# MySchool Setup Checklist

This checklist guides you through the final setup steps required to run the MySchool application.

## Prerequisites ✅ (Already Completed)

- [x] Node.js 18+ installed
- [x] npm package manager available
- [x] Firebase CLI installed (`firebase-tools`)
- [x] Next.js project initialized
- [x] All dependencies installed
- [x] Tests passing
- [x] Build successful

## Required Setup Steps (User Action Required)

### Step 1: Firebase Authentication 🔴 REQUIRED

The application needs Firebase credentials to function. Choose **one** of the following methods:

#### Method A: Automated Setup (Recommended) ⭐

```bash
# 1. Login to Firebase (opens browser for OAuth)
firebase login

# 2. Navigate to myschool directory
cd myschool/

# 3. Run the automated setup script
./setup-firebase-credentials.sh
```

This script will:
- ✅ Verify Firebase authentication
- ✅ Retrieve Firebase Client SDK configuration
- ✅ Generate Admin SDK service account key
- ✅ Create `.env.local` with all required variables
- ✅ Update `.gitignore` if needed

#### Method B: Manual Setup

If the automated script doesn't work, follow these manual steps:

**1. Create `.env.local` file:**
```bash
cp .env.local.example .env.local
```

**2. Get Firebase Client SDK Config:**
- Visit: https://console.firebase.google.com/project/myschools-app-dev/settings/general
- Scroll to "Your apps" section
- If no web app exists, click "Add app" → Web
- Copy the configuration values
- Paste them into `.env.local`:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myschools-app-dev.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=myschools-app-dev
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myschools-app-dev.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
  ```

**3. Download Admin SDK Service Account Key:**
- Visit: https://console.firebase.google.com/project/myschools-app-dev/settings/serviceaccounts/adminsdk
- Click "Generate New Private Key"
- Save the downloaded file as `firebase-admin-key.json` in the `myschool/` directory

**4. Verify `.env.local` contains:**
```
FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json
```

### Step 2: Verify Setup ✅

After completing Step 1, verify everything is working:

```bash
# Check that required files exist
ls -la .env.local firebase-admin-key.json

# Run tests to verify Firebase integration
npm test

# Expected output: All tests passing
```

### Step 3: Start Development Environment 🚀

**Terminal 1 - Firebase Emulators:**
```bash
npm run emulators
```

Wait for message: "All emulators ready!"

Emulator UI will be available at: http://localhost:4000

**Terminal 2 - Next.js Dev Server:**
```bash
npm run dev
```

Application will be available at: http://localhost:3000

## Verification Checklist

Use this checklist to confirm everything is set up correctly:

- [ ] Firebase authentication completed (`firebase login` successful)
- [ ] `.env.local` file exists in `myschool/` directory
- [ ] `.env.local` contains all `NEXT_PUBLIC_FIREBASE_*` variables
- [ ] `firebase-admin-key.json` exists in `myschool/` directory
- [ ] `npm test` shows all tests passing (13/13)
- [ ] `npm run build` completes without errors
- [ ] Firebase Emulators start successfully
- [ ] Next.js dev server starts on http://localhost:3000
- [ ] Can access home page at http://localhost:3000
- [ ] Emulator UI accessible at http://localhost:4000

## Security Verification ✅

**CRITICAL**: Ensure these files are NEVER committed to Git:

```bash
# Run this command to verify:
git status

# These should NOT appear in the output:
# ❌ .env.local
# ❌ firebase-admin-key.json
# ❌ node_modules/
# ❌ .next/
# ❌ coverage/

# If they do appear, they are NOT in .gitignore!
```

The `.gitignore` file is already configured correctly, but always verify before committing.

## Troubleshooting

### Issue: "Failed to authenticate"
**Solution**: Run `firebase login` and complete the browser authentication flow.

### Issue: "Firebase configuration is incomplete"
**Solution**: Check `.env.local` exists and contains all required `NEXT_PUBLIC_FIREBASE_*` variables.

### Issue: "Cannot find module './firebase-admin-key.json'"
**Solution**: Ensure `firebase-admin-key.json` is in the `myschool/` directory and `FIREBASE_ADMIN_KEY_PATH` in `.env.local` points to it.

### Issue: Emulators won't start
**Solution**: 
- Check if ports 8080, 9099, 9199, or 4000 are already in use
- Try stopping other services: `lsof -ti:8080 | xargs kill`

### Issue: "npm test" fails
**Solution**: 
- Delete `node_modules/` and run `npm install` again
- Clear Jest cache: `npx jest --clearCache`

### Issue: Build fails with TypeScript errors
**Solution**: 
- Check TypeScript version: `npx tsc --version`
- Should be 5.9.3 or compatible
- Run `npm install typescript@5.9.3 --save-dev`

## Quick Reference

### Important Files
| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.local` | Environment variables | ❌ NO |
| `firebase-admin-key.json` | Service account | ❌ NO |
| `.env.local.example` | Template | ✅ YES |
| `firebase.json` | Firebase config | ✅ YES |
| `.firebaserc` | Project alias | ✅ YES |
| `README.md` | Documentation | ✅ YES |

### Useful Commands
```bash
# Start development
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start Firebase Emulators
npm run emulators

# Export emulator data
npm run emulators:export

# Import emulator data
npm run emulators:import
```

### Port Reference
- **3000**: Next.js application
- **4000**: Firebase Emulator UI
- **8080**: Firestore Emulator
- **9099**: Auth Emulator
- **9199**: Storage Emulator

## Getting Help

If you encounter issues not covered here:

1. Check `README.md` for detailed troubleshooting
2. Review `IMPLEMENTATION_STATUS.md` for technical details
3. Consult `docs/spec/10_myschool_component.md` for specifications
4. Check Firebase Console: https://console.firebase.google.com/project/myschools-app-dev

## Next Steps After Setup

Once setup is complete and verified:

1. ✅ Review the home page at http://localhost:3000
2. ✅ Explore the Firebase Emulator UI at http://localhost:4000
3. ✅ Start implementing authentication pages
4. ✅ Begin feature development following TDD principles

---

**Setup Status**: 
- Infrastructure: ✅ Complete
- Firebase Auth: ⏳ Awaiting user action
- Ready for Development: ⏳ After Firebase auth

Last Updated: October 6, 2025
