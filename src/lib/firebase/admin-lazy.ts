/**
 * Firebase Admin SDK Lazy Initialization
 * 
 * This module provides lazy initialization for Firebase Admin SDK
 * to prevent build-time initialization issues.
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Lazy-loaded admin app instance
let _adminApp: admin.app.App | null = null;
let _adminDb: admin.firestore.Firestore | null = null;
let _adminAuth: admin.auth.Auth | null = null;
let _adminStorage: admin.storage.Storage | null = null;

/**
 * Get the service account credentials from environment variables
 */
function getServiceAccount(): admin.ServiceAccount | null {
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
      return JSON.parse(serviceAccountJson) as admin.ServiceAccount;
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
      return JSON.parse(serviceAccountJson) as admin.ServiceAccount;
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
function getAdminApp(): admin.app.App | null {
  if (_adminApp !== null) {
    return _adminApp;
  }

  // Check if already initialized by another module (e.g., Cloud Functions wrapper)
  if (admin.apps.length > 0) {
    _adminApp = admin.app();
    console.log('[Firebase Admin Lazy] Using existing Firebase Admin SDK instance');
    return _adminApp;
  }

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
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${(serviceAccount as { project_id: string }).project_id}.appspot.com`,
    });
    console.log('Firebase Admin SDK initialized with service account (lazy)');
  } else {
    // No configuration available
    console.log('Firebase Admin SDK not initialized - no configuration available (lazy)');
    return null;
  }

  // Initialize services
  if (_adminApp) {
    _adminDb = admin.firestore();
    _adminAuth = admin.auth();
    _adminStorage = admin.storage();
    
    // Connect to emulators in development
    if (useEmulators) {
      try {
        admin.firestore().settings({
          host: '127.0.0.1:8080',
          ssl: false
        });
        // Check if useEmulator method exists before calling it
        const auth = admin.auth();
        const authWithEmulator = auth as { useEmulator?: (url: string) => void };
        if ('useEmulator' in auth && typeof authWithEmulator.useEmulator === 'function') {
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
export function getAdminDb(): admin.firestore.Firestore | null {
  if (_adminDb === null) {
    const app = getAdminApp();
    if (app) {
      _adminDb = admin.firestore();
    }
  }
  return _adminDb;
}

/**
 * Get Auth instance (lazy initialized)
 */
export function getAdminAuth(): admin.auth.Auth | null {
  if (_adminAuth === null) {
    const app = getAdminApp();
    if (app) {
      _adminAuth = admin.auth();
    }
  }
  return _adminAuth;
}

/**
 * Get Storage instance (lazy initialized)
 */
export function getAdminStorage(): admin.storage.Storage | null {
  if (_adminStorage === null) {
    const app = getAdminApp();
    if (app) {
      _adminStorage = admin.storage();
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