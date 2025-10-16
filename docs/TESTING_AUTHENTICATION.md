# Authentication Testing Guide

## Overview

This guide explains how to test the unified Firebase Authentication system in the MySchoolWeb application. The system uses Firebase Auth REST API for all environments (emulator and production).

## Prerequisites

1. **Firebase Emulators Running**
   ```bash
   npm run emulators
   ```
   This starts:
   - Firebase Auth Emulator (port 9099)
   - Firestore Emulator (port 8080)
   - Firebase Emulator UI (port 4000)

2. **Environment Configuration**
   Ensure your `.env.local` file contains:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=emulator-api-key
   USE_FIREBASE_EMULATORS=true
   ```

## Test User Setup

### Initial Setup

Before running tests for the first time, create test users in the Firebase Auth Emulator:

```bash
npm run setup-test-users
```

This script creates the following test users:

| Email | Password | Role | School ID |
|-------|----------|------|-----------|
| admin@test.com | TestAdmin123! | admin | test-school-123 |
| user@test.com | TestUser123! | user | test-school-123 |

### When to Re-run Setup

Re-run the setup script when:
- Starting with a fresh emulator (no imported data)
- After clearing emulator data
- Test user passwords need to be updated

## Running Tests

### Unit Tests

Test the authentication service and login handler:

```bash
# Run all authentication unit tests
npm test -- auth

# Run specific test suites
npm test -- auth.service.test.ts
npm test -- login-handler.test.ts
```

**Expected Results**:
- `auth.service.test.ts`: 13/13 passing
- `login-handler.test.ts`: 5/5 passing

### E2E Tests

Test complete authentication flows in the browser:

```bash
# Run all authentication E2E tests
npm run test:e2e -- tests/e2e/auth-test.spec.ts

# Run with UI for debugging
npm run test:e2e:ui -- tests/e2e/auth-test.spec.ts

# Run in debug mode
npm run test:e2e:debug -- tests/e2e/auth-test.spec.ts
```

**Expected Results**:
- Successful Login: ✅ PASS
- Failed Login with Incorrect Password: ✅ PASS
- Failed Login with Non-existent User: ✅ PASS

### API Testing

Test the login API endpoint directly:

```bash
# Test with correct credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"TestAdmin123!"}'

# Expected: 200 OK with session cookie

# Test with incorrect password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"WrongPassword"}'

# Expected: 401 Unauthorized

# Test with non-existent user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"password"}'

# Expected: 401 Unauthorized
```

## Testing Workflow

### Complete Testing Sequence

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Setup test users (first time or after reset)
npm run setup-test-users

# Terminal 3: Run tests
npm test -- auth                # Unit tests
npm run test:e2e -- tests/e2e/auth-test.spec.ts  # E2E tests
```

### Development Workflow

When developing authentication features:

1. **Start Services**:
   ```bash
   # Terminal 1: Emulators
   npm run emulators
   
   # Terminal 2: Dev server
   npm run dev
   ```

2. **Setup Test Data**:
   ```bash
   npm run setup-test-users
   ```

3. **Develop & Test**:
   - Write/modify code
   - Run unit tests: `npm test -- auth`
   - Test in browser: http://localhost:3000/login
   - Run E2E tests: `npm run test:e2e`

4. **Verify**:
   - Check Firebase Emulator UI: http://localhost:4000
   - Verify users in Auth section
   - Check Firestore for user documents

## Authentication Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Login Form                              │   │
│  │  - Email: admin@test.com                         │   │
│  │  - Password: TestAdmin123!                       │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/auth/login
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Route                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │    login-handler.ts                              │   │
│  │    - Validates input                             │   │
│  │    - Calls authenticateUser()                    │   │
│  │    - Creates session                             │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           auth.service.ts                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Firebase Auth REST API                          │   │
│  │  - Environment detection                         │   │
│  │  - Endpoint selection                            │   │
│  │  - Password verification                         │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│         Firebase Services                                │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  Firebase Auth    │  │  Firestore               │    │
│  │  (Emulator)       │  │  (Emulator)              │    │
│  │  - Verify password│  │  - User documents        │    │
│  │  - Return UID     │  │  - Role data             │    │
│  └──────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **User submits login form** with email and password
2. **Login handler validates** input (email and password required)
3. **Auth service calls** Firebase Auth REST API
   - Emulator: `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
   - Production: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
4. **Firebase Auth verifies** password
   - Success: Returns user UID and tokens
   - Failure: Returns error (INVALID_PASSWORD, EMAIL_NOT_FOUND, etc.)
5. **Auth service fetches** user data from Firestore using Admin SDK
6. **Login handler creates** session token (JWT)
7. **Session token stored** in HTTP-only cookie
8. **User redirected** to dashboard

## Troubleshooting

### Issue: Authentication fails with "INVALID_PASSWORD"

**Solution**: Recreate test users
```bash
npm run setup-test-users
```

### Issue: "Firebase API key not configured"

**Solution**: Check `.env.local` file
```env
NEXT_PUBLIC_FIREBASE_API_KEY=emulator-api-key
```

### Issue: "Cannot connect to Firebase Auth Emulator"

**Solution**: Ensure emulators are running
```bash
npm run emulators
```

### Issue: Tests pass but login fails in browser

**Solution**: Check dev server environment
```bash
# Ensure dev server is using emulator config
cat .env.local | grep USE_FIREBASE_EMULATORS
# Should output: USE_FIREBASE_EMULATORS=true
```

## Security Best Practices

### Error Messages
All authentication failures return the same generic error message:
```
"Invalid email or password"
```

This prevents user enumeration attacks by not revealing whether:
- User exists
- Password is incorrect
- Account is disabled

### Password Requirements
While the emulator allows any password, production should enforce:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Required for Firebase Auth REST API
- `USE_FIREBASE_EMULATORS`: Determines endpoint selection
- Never commit actual `.env.local` files to version control

## Additional Resources

- Firebase Auth REST API: https://firebase.google.com/docs/reference/rest/auth
- Firebase Emulator Suite: https://firebase.google.com/docs/emulator-suite
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

## Support

For issues or questions:
1. Check this guide
2. Review test results
3. Check Firebase Emulator UI (http://localhost:4000)
4. Review implementation summary in `client/evidences/`
