/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes the Firebase Admin SDK for server-side operations.
 * It supports two configuration methods:
 * 1. Loading service account from a JSON file (FIREBASE_ADMIN_KEY_PATH)
 * 2. Loading service account from a base64-encoded string (FIREBASE_ADMIN_KEY_BASE64)
 * 
 * The Admin SDK is used for privileged operations like:
 * - Creating and managing users
 * - Direct Firestore read/write operations
 * - Generating signed URLs for Storage
 * - Setting custom claims for user roles
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

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
 * Initialize Firebase Admin App (singleton pattern)
 */
let adminApp: admin.app.App;

// Check if we should use emulators (development without service account)
const useEmulators = process.env.NODE_ENV === 'development' && 
                     process.env.USE_FIREBASE_EMULATORS === 'true';

console.log(`[Firebase Admin] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Firebase Admin] USE_FIREBASE_EMULATORS: ${process.env.USE_FIREBASE_EMULATORS}`);
console.log(`[Firebase Admin] useEmulators: ${useEmulators}`);

// Get service account credentials if available
const serviceAccount = getServiceAccount();

// Initialize Firebase Admin SDK only if not already initialized
if (admin.apps.length === 0) {
  // Skip initialization during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    adminApp = null;
    console.log('Firebase Admin SDK skipped during build time');
  } else if (useEmulators) {
    // Initialize with emulator settings (no credentials needed)
    adminApp = admin.initializeApp({
      projectId: 'test-project',
    });
    console.log('Firebase Admin SDK initialized for emulators');
  } else if (serviceAccount) {
    // Initialize with service account credentials
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${(serviceAccount as { project_id: string }).project_id}.appspot.com`,
    });
    console.log('Firebase Admin SDK initialized with service account');
  } else {
    // Create a placeholder during build or when no config available
    adminApp = null;
    console.log('Firebase Admin SDK not initialized - no configuration available');
  }
} else {
  adminApp = admin.app();
}

/**
 * Initialize Firebase Admin services
 */
const adminDb = adminApp ? admin.firestore() : null;
const adminAuth = adminApp ? admin.auth() : null;
const adminStorage = adminApp ? admin.storage() : null;

/**
 * Connect to emulators in development
 */
if (adminApp && useEmulators) {
  // Connect to Firestore emulator
  try {
    admin.firestore().settings({
      host: 'localhost:8080',
      ssl: false
    });
    console.log('Connected to Firestore emulator');
  } catch (error) {
    console.log('Firestore emulator already connected or connection failed:', error);
  }
  
  // Connect to Auth emulator
  try {
    // Check if useEmulator method exists before calling it
    if ('useEmulator' in admin.auth()) {
      (admin.auth() as { useEmulator: (url: string) => void }).useEmulator('http://localhost:9099');
    }
    console.log('Connected to Auth emulator');
  } catch (error) {
    console.log('Auth emulator already connected or connection failed:', error);
  }
  
  console.log('Firebase Admin SDK configured for emulators');
}

export { adminApp, adminDb, adminAuth, adminStorage };
