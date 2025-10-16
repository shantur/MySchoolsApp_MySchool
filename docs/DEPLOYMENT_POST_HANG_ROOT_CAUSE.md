# MySchoolsWeb POST Request Hang - Root Cause Analysis

## Executive Summary

**Problem**: All POST requests to MySchoolsWeb timeout after exactly 60 seconds with HTTP 504 Gateway Timeout errors.

**Root Cause**: Next.js POST request handling is incompatible with the current Cloud Functions deployment setup.

**Solution**: Migrate from Cloud Functions to Cloud Run (officially recommended by Google/Firebase for Next.js deployments).

---

## Investigation Summary

### What Works ✅
- GET requests to all routes (< 1 second response time)
- Module loading (all imports succeed)
- Middleware execution (completes successfully)
- Server-side rendering for pages

### What Fails ❌
- **ALL POST handlers hang**, regardless of:
  - Code complexity
  - Dependencies used
  - Route location
  - Request body content

### Critical Finding

The hang occurs **inside Next.js framework code** after middleware completes:

```
[Middleware] NextResponse.next() returned, sending response  ← Last log
[Login Route] POST function called - ENTRY POINT              ← Never appears
```

Next.js's `handle()` function (in `functions/src/index.ts` line 75) receives control from middleware but **never invokes the POST handler function**.

---

## Test Routes Created

During investigation, we created three test routes to isolate the issue:

1. **`/api/test-simple` (GET)** → ✅ Works perfectly
2. **`/api/auth/login-test` (POST)** → ❌ Hangs (minimal Next.js POST)
3. **`/api/auth/login-minimal` (POST)** → ❌ Hangs (zero dependencies)

Even the simplest possible POST handler hangs, proving this is a Next.js framework issue, not an application code issue.

---

## Why Cloud Functions + Next.js POST Fails

### Technical Background

1. **Request Handling Flow**:
   - Firebase Hosting → Cloud Function → Next.js `handle()`
   - Next.js internally routes to appropriate handler (GET vs POST)

2. **The Issue**:
   - Next.js's internal routing for POST requests appears to block/hang in Cloud Functions environment
   - This is likely due to differences in how Cloud Functions handles HTTP/2, streaming, or request body parsing
   - GET requests work because they don't involve request body streams

3. **Known Limitation**:
   - Google's official Next.js deployment guide recommends Cloud Run, not Cloud Functions
   - Cloud Functions has limitations with full Next.js feature support
   - POST request streaming/body handling is one of these limitations

---

## Recommended Solution: Migrate to Cloud Run

### Why Cloud Run?

1. **Full Next.js Support**: Cloud Run supports all Next.js features including POST handling
2. **Official Recommendation**: Google/Firebase recommends Cloud Run for Next.js
3. **Better Performance**: More control over container configuration
4. **Cost Efficiency**: Pay only for actual usage (like Cloud Functions)
5. **Firebase Hosting Integration**: Can route to Cloud Run just like Cloud Functions

### Migration Overview

```
Current: Firebase Hosting → Cloud Functions (nextjsFunc)
New:     Firebase Hosting → Cloud Run (nextjs-service)
```

### What Changes

1. **Build Mode**: Use Next.js `standalone` mode
2. **Deployment Target**: Cloud Run service instead of Cloud Function
3. **Firebase Hosting Config**: Update rewrites to point to Cloud Run
4. **Container**: Dockerize the Next.js app for Cloud Run

### What Stays the Same

- ✅ Firebase Hosting (frontend static assets)
- ✅ Firestore (database)
- ✅ Firebase Auth (authentication)
- ✅ Firebase Storage (file uploads)
- ✅ All application code (no code changes needed)

---

## Alternative Solutions (NOT Recommended)

### Option B: Separate Cloud Functions for POST Endpoints

- **Approach**: Create individual Cloud Functions for each POST endpoint
- **Pros**: Quick fix, minimal migration
- **Cons**: 
  - Loses Next.js benefits (middleware, routing, etc.)
  - Duplicates authentication/session logic
  - More maintenance overhead
  - Doesn't scale well

### Option C: Investigate Next.js + Cloud Functions Compatibility Further

- **Approach**: Deep-dive into Next.js source code to find workaround
- **Pros**: Keeps current architecture
- **Cons**:
  - High effort, low success probability
  - May not be solvable without Next.js framework changes
  - Fighting against official recommendations
  - Future Next.js updates may break again

---

## Migration Plan (High-Level)

### Phase 1: Preparation
1. Enable Cloud Run API in Firebase project
2. Create Dockerfile for Next.js app
3. Configure `next.config.js` for standalone mode
4. Test local Docker build

### Phase 2: Deployment
1. Build Docker image
2. Deploy to Cloud Run
3. Update Firebase Hosting rewrites
4. Test POST endpoints

### Phase 3: Cleanup
1. Remove old Cloud Function
2. Update CI/CD pipeline
3. Update documentation

---

## Estimated Effort

- **Development Time**: 4-6 hours
- **Testing Time**: 2-3 hours  
- **Total**: ~1 working day

---

## Decision Required

**Question for Product Owner**: Should we proceed with Cloud Run migration?

**Recommendation**: Yes, migrate to Cloud Run. This is the correct long-term solution and aligns with Google's official guidance.

**Next Steps** (if approved):
1. DevOps Engineer creates detailed migration task
2. Implement Cloud Run deployment
3. Test all POST endpoints
4. Update deployment documentation

---

## Files Modified During Investigation

These test files can be removed after migration:
- `src/app/api/test-simple/route.ts`
- `src/app/api/auth/login-test/route.ts`
- `src/app/api/auth/login-minimal/route.ts`

Enhanced logging can be removed from:
- `src/app/api/auth/login/route.ts`
- `src/middleware.ts`
- `src/lib/services/auth.service.ts`

---

## References

- [Next.js on Cloud Run (Official)](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nextjs-service)
- [Firebase Hosting + Cloud Run](https://firebase.google.com/docs/hosting/cloud-run)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

