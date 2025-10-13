/**
 * Firebase Client SDK Configuration
 * 
 * This module initializes the Firebase Client SDK for browser-side interactions.
 * It uses environment variables prefixed with NEXT_PUBLIC_ to configure the SDK.
 * 
 * In development, it automatically connects to Firebase Emulators if available.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration is incomplete. ' +
    'Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'
  );
}

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Connect to emulators in development or when USE_FIREBASE_EMULATORS is explicitly set
const shouldUseEmulators = 
  (process.env.NODE_ENV === 'development' || process.env.USE_FIREBASE_EMULATORS === 'true') &&
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'false';

if (shouldUseEmulators) {
  try {
    // MySchoolWeb uses custom emulator ports (see firebase.json)
    // Auth emulator - port 19099 (NOT 9099)
    connectAuthEmulator(auth, 'http://localhost:19099', { disableWarnings: true });
    
    // Firestore emulator - port 18080 (NOT 8080)
    connectFirestoreEmulator(db, 'localhost', 18080);
    
    // Storage emulator - port 19199 (NOT 9199)
    connectStorageEmulator(storage, 'localhost', 19199);
    
    console.log('Connected to Firebase Emulators (custom ports: Auth 19099, Firestore 18080, Storage 19199)');
  } catch (error) {
    // Emulators might already be connected, ignore error
    console.warn('Firebase Emulators connection warning:', error);
  }
}

export { app, auth, db, storage };
