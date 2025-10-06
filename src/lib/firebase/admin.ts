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
  // Skip during build time
  if (!process.env.FIREBASE_ADMIN_KEY_PATH && 
      !process.env.FIREBASE_ADMIN_KEY_BASE64) {
    return null;
  }
  
  // Option A: Load from file path (Development)
  if (process.env.FIREBASE_ADMIN_KEY_PATH) {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY_PATH;
    const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
    return JSON.parse(serviceAccountJson) as admin.ServiceAccount;
  }
  
  // Option B: Load from base64 string (Production/CI/CD)
  if (process.env.FIREBASE_ADMIN_KEY_BASE64) {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_ADMIN_KEY_BASE64,
      'base64'
    ).toString('utf8');
    return JSON.parse(serviceAccountJson) as admin.ServiceAccount;
  }
  
  return null;
}

/**
 * Initialize Firebase Admin App (singleton pattern)
 */
let adminApp: admin.app.App;

// Only initialize if we have service account credentials
const serviceAccount = getServiceAccount();

if (serviceAccount && admin.apps.length === 0) {
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${(serviceAccount as any).project_id}.appspot.com`,
  });
  
  console.log('Firebase Admin SDK initialized');
} else if (admin.apps.length > 0) {
  adminApp = admin.app();
} else {
  // Create a placeholder during build
  adminApp = null as any;
}

/**
 * Initialize Firebase Admin services
 */
const adminDb = adminApp ? admin.firestore() : (null as any);
const adminAuth = adminApp ? admin.auth() : (null as any);
const adminStorage = adminApp ? admin.storage() : (null as any);

/**
 * Connect to emulators in development
 */
if (process.env.NODE_ENV === 'development' && adminApp) {
  const useEmulators = process.env.USE_FIREBASE_EMULATORS !== 'false';
  
  if (useEmulators) {
    // Set Firestore emulator host
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    // Set Auth emulator host
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    
    // Set Storage emulator host
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    
    console.log('Firebase Admin SDK configured for emulators');
  }
}

export { adminApp, adminDb, adminAuth, adminStorage };
