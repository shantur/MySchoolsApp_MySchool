# MySchool E2E Testing Strategy

## Quick Reference

**Status:** 📋 Strategy Documented - Awaiting Frontend Implementation  
**Test Framework:** Playwright  
**Last Updated:** 2025-10-06

## Purpose

This document serves as a quick reference for the comprehensive E2E testing strategy documented in task file `tasks/done/myschool/task_172_2_implement_myschool_auth_user_management.md`.

## When to Start E2E Testing

E2E tests should be developed when **ANY** of these UI components are implemented:

- ✅ Login page UI (`/login`)
- ✅ Admin user management UI (`/admin/users`)
- ✅ Protected content pages (e.g., `/[schoolId]/notices`)
- ✅ Session management UI (logout buttons, notifications)

## Quick Start (Once Frontend is Ready)

```bash
# Install Playwright
npm install -D @playwright/test playwright
npx playwright install

# Create test structure
mkdir -p e2e/{auth,admin,html-parsing,fixtures,utils}

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Test Coverage Required

### Core Scenarios (15+ tests)

1. **Login Tests (7 tests)**
   - Successful admin/user login
   - Failed login (invalid credentials, missing fields, non-existent user)
   - UI elements verification
   - Session cookie verification

2. **Logout Tests (2 tests)**
   - Successful logout
   - Logout from different pages

3. **Session Tests (3 tests)**
   - Session persistence
   - Unauthorized access prevention
   - Expired session handling

4. **Admin User Creation Tests (5 tests)**
   - Successful user creation
   - Weak password validation
   - Missing fields validation
   - Duplicate email handling
   - School assignment verification

5. **HTML Parsing Tests (3 tests)**
   - Login page HTML structure
   - User list HTML structure
   - ARIA labels presence

## Key Recommendations

### Test Tool: Playwright ✅

**Why Playwright over Cypress:**
- ✅ Better Safari support
- ✅ Built-in parallel execution
- ✅ Modern auto-wait architecture
- ✅ Completely free
- ✅ Excellent TypeScript integration

### Test Organization

```
e2e/
├── auth/
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── session.spec.ts
├── admin/
│   ├── user-creation.spec.ts
│   └── user-management.spec.ts
├── html-parsing/
│   └── data-attributes.spec.ts
├── fixtures/
│   ├── test-users.json
│   └── test-schools.json
└── utils/
    ├── auth-helpers.ts
    └── html-validators.ts
```

### Screenshot Strategy

**Required Screenshots:**
1. Login page (initial state)
2. Login page (validation error)
3. Login page (auth error)
4. Admin dashboard (after login)
5. User creation form (empty)
6. User creation form (validation errors)
7. User creation success
8. User list page
9. User's school page (after login)

**Organization:**
```
e2e-screenshots/
└── attempt_1/
    ├── chromium/
    ├── firefox/
    └── webkit/
```

## CI/CD Integration

### GitHub Actions Workflow

- **Location:** `.github/workflows/e2e-tests.yml`
- **Browsers:** Chrome, Firefox, Safari (parallel)
- **Execution Time:** ~10-15 minutes
- **Artifacts:** Reports, screenshots, videos, traces

### Required Secrets

- `SESSION_SECRET` - JWT signing secret
- `FIREBASE_PROJECT_ID` - E2E testing project
- `FIREBASE_ADMIN_KEY_BASE64` - Service account key

## Implementation Checklist

### Prerequisites
- [ ] Frontend login page UI implemented
- [ ] Admin user management UI implemented
- [ ] Protected routes with session validation
- [ ] Error handling UI

### Setup
- [ ] Install Playwright
- [ ] Create `playwright.config.ts`
- [ ] Create test directory structure
- [ ] Add npm scripts

### Test Development
- [ ] Login tests
- [ ] Logout tests
- [ ] Session tests
- [ ] User creation tests
- [ ] HTML parsing tests
- [ ] Test utilities
- [ ] Test fixtures

### CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Configure secrets
- [ ] Set up E2E Firebase project
- [ ] Verify artifacts upload

### Validation
- [ ] All tests pass locally (3 browsers)
- [ ] All tests pass in CI/CD
- [ ] Screenshots captured
- [ ] HTML structure validated
- [ ] Execution time <15 minutes

## Full Documentation

For complete details, see:
- **Task File:** `tasks/done/myschool/task_172_2_implement_myschool_auth_user_management.md`
- **Section:** Manual Device QA Report (Sections 3-7)

## Support

**Questions?** Contact Manual Device QA Engineer

**Status Updates:** Check task file in `tasks/done/myschool/`
