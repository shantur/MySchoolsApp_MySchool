# 🚀 MySchool Firebase Setup - Quick Start

## One-Command Setup

```bash
# 1. Authenticate with Firebase (opens browser)
firebase login

# 2. Run automated setup
cd myschool/
./setup-firebase-credentials.sh

# 3. Install dependencies and start dev server
npm install && npm run dev
```

---

## Manual Setup (If Script Fails)

### Get Client SDK Config
```bash
cd backend/
firebase apps:sdkconfig web
# Copy the output values to .env.local
```

### Get Admin SDK Key
```bash
cd backend/
firebase apps:sdkconfig admin --json > ../myschool/firebase-admin-key.json
```

### Create .env.local
```bash
cd ../myschool/
cp .env.local.example .env.local
# Fill in the values from above
```

---

## Verify Setup

```bash
# All three should show ✓
cat .env.local | grep "NEXT_PUBLIC_FIREBASE_API_KEY"
ls firebase-admin-key.json
git status --ignored | grep ".env.local"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Run `firebase login` |
| "No config found" | Create web app in [Firebase Console](https://console.firebase.google.com/project/myschools-app-dev) |
| "Permission denied" | Generate key manually in [Console](https://console.firebase.google.com/project/myschools-app-dev/settings/serviceaccounts/adminsdk) |

---

## Need More Help?

📖 **Detailed Guide:** `FIREBASE_SETUP.md` (in this directory)  
📚 **Complete Docs:** `../docs/devops/FIREBASE_CREDENTIALS_SETUP_GUIDE.md`  
🎯 **Handoff Doc:** `../FIREBASE_CREDENTIALS_HANDOFF.md`

---

**Project:** myschools-app-dev  
**Console:** https://console.firebase.google.com/project/myschools-app-dev
