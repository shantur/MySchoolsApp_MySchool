/**
 * Firebase Admin SDK Lazy Initialization
 * 
 * This module provides lazy initialization for Firebase Admin SDK
 * to prevent build-time initialization issues.
 */

console.log('[Admin Lazy] Module loading started');
import { readFileSync } from 'fs';
console.log('[Admin Lazy] Module loading complete');

// Lazy-loaded admin app instance
let _adminApp: any | null = null;
let _adminDb: any | null = null;
let _adminAuth: any | null = null;
let _adminStorage: any | null = null;

// Get firebase-admin using require (not import) to avoid webpack bundling issues
function getFirebaseAdmin() {
  console.log('[Admin Lazy] Loading firebase-admin via require...');
  // Use require instead of import to ensure it's truly lazy and not bundled by webpack
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require('firebase-admin');
  console.log('[Admin Lazy] firebase-admin loaded');
  return admin;
}

/**
 * Get the service account credentials from environment variables
 */
function getServiceAccount(): any | null {
  // Skip during build time - check for Next.js build indicator
  if (process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NODE_ENV === 'production' && !process.env.FIREBASE_ADMIN_KEY_PATH && !process.env.FIREBASE_ADMIN_KEY_BASE64 ||
      !process.env.FIREBASE_ADMIN_KEY_PATH && 
      !process.env.FIREBASE_ADMIN_KEY_BASE64) {
    return null;
  }
  
  // Option A: Load from file path (Development)
  if (process.env.FIREBASE_ADMIN_KEY_PATH) {
    try {
      const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY_PATH;
      const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
      return JSON.parse(serviceAccountJson);
    } catch (error) {
      console.warn('Failed to load service account from file:', error);
      return null;
    }
  }
  
  // Option B: Load from base64 string (Production/CI/CD)
  if (process.env.FIREBASE_ADMIN_KEY_BASE64) {
    try {
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_ADMIN_KEY_BASE64,
        'base64'
      ).toString('utf8');
      return JSON.parse(serviceAccountJson);
    } catch (error) {
      console.warn('Failed to load service account from base64:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Initialize Firebase Admin SDK lazily (only when first accessed)
 */
function getAdminApp(): any | null {
  console.log('[Admin Lazy] getAdminApp() called');
  
  // Get firebase-admin (lazy loaded via require)
  const admin = getFirebaseAdmin();
  
  // Return existing instance if available
  if (_adminApp) {
    console.log('[Admin Lazy] Returning cached app instance');
    return _adminApp;
  }

  // Check if already initialized by another module (e.g., Cloud Functions wrapper)
  if (admin.apps.length > 0) {
    console.log('[Admin Lazy] Found existing Firebase Admin SDK instance');
    _adminApp = admin.app();
    console.log('[Firebase Admin Lazy] Using existing Firebase Admin SDK instance');
    return _adminApp;
  }
  
  console.log('[Admin Lazy] No existing app found, will initialize new one');

  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Firebase Admin SDK initialization skipped during build');
    return null;
  }

  // Detect if running in Cloud Functions environment
  const isCloudFunctions = process.env.FUNCTION_TARGET !== undefined || 
                          process.env.FUNCTION_NAME !== undefined ||
                          process.env.K_SERVICE !== undefined;

  // Check if we should use emulators (development or test without service account)
  const useEmulators = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && 
                       process.env.USE_FIREBASE_EMULATORS === 'true';

  console.log(`[Firebase Admin Lazy] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Firebase Admin Lazy] USE_FIREBASE_EMULATORS: ${process.env.USE_FIREBASE_EMULATORS}`);
  console.log(`[Firebase Admin Lazy] isCloudFunctions: ${isCloudFunctions}`);
  console.log(`[Firebase Admin Lazy] useEmulators: ${useEmulators}`);

  // Get service account credentials if available
  const serviceAccount = getServiceAccount();

  // Initialize Firebase Admin SDK only if not already initialized
  if (useEmulators) {
    // Initialize with emulator settings (no credentials needed)
    _adminApp = admin.initializeApp({
      projectId: 'myschools-app-dev',
      storageBucket: 'myschools-app-dev.appspot.com',
    });
    console.log('Firebase Admin SDK initialized for emulators (lazy)');
  } else if (isCloudFunctions) {
    // Running in Cloud Functions - use Application Default Credentials (ADC)
    // ADC automatically uses the Cloud Functions runtime service account
    _adminApp = admin.initializeApp({
      // No credential needed - Cloud Functions provides ADC automatically
      // storageBucket will be auto-detected from the project
    });
    console.log('Firebase Admin SDK initialized with Application Default Credentials in Cloud Functions (lazy)');
  } else if (serviceAccount) {
    // Initialize with service account credentials
    _adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      storageBucket: `${(serviceAccount as any).project_id}.appspot.com`,
    });
    console.log('Firebase Admin SDK initialized with service account (lazy)');
  } else {
    // No configuration available
    console.log('Firebase Admin SDK not initialized - no configuration available (lazy)');
    return null;
  }

  // Initialize services
  if (_adminApp) {
    _adminDb = _adminApp.firestore();
    _adminAuth = _adminApp.auth();
    _adminStorage = _adminApp.storage();
    
    // Connect to emulators in development
    if (useEmulators) {
      try {
        _adminDb.settings({
          host: '127.0.0.1:8080',
          ssl: false
        });
        // Check if useEmulator method exists before calling it
        const authWithEmulator = _adminAuth as any;
        if (authWithEmulator && 'useEmulator' in authWithEmulator && typeof authWithEmulator.useEmulator === 'function') {
          authWithEmulator.useEmulator('http://127.0.0.1:9099');
        }
        console.log('Connected to Firebase emulators (lazy)');
      } catch (error) {
        console.log('Firebase emulator connection failed (lazy):', error);
      }
    }
  }
  
  return _adminApp;
}

/**
 * Get Firestore instance (lazy initialized)
 */
export function getAdminDb(): any | null {
  if (_adminDb === null) {
    const app = getAdminApp();
    if (app) {
      _adminDb = app.firestore();
    }
  }
  return _adminDb;
}

/**
 * Get Auth instance (lazy initialized)
 */
export function getAdminAuth(): any | null {
  if (_adminAuth === null) {
    const app = getAdminApp();
    if (app) {
      _adminAuth = app.auth();
    }
  }
  return _adminAuth;
}

/**
 * Get Storage instance (lazy initialized)
 */
export function getAdminStorage(): any | null {
  if (_adminStorage === null) {
    const app = getAdminApp();
    if (app) {
      _adminStorage = app.storage();
    }
  }
  return _adminStorage;
}

/**
 * Reset all cached instances (useful for testing)
 */
export function resetAdminInstances(): void {
  _adminApp = null;
  _adminDb = null;
  _adminAuth = null;
  _adminStorage = null;
}