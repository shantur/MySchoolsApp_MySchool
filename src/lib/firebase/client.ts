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

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if we should use emulators (can be controlled via env var)
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'false';
  
  if (useEmulators) {
    try {
      // Auth emulator
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      
      // Firestore emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
      
      // Storage emulator
      connectStorageEmulator(storage, 'localhost', 9199);
      
      console.log('Connected to Firebase Emulators');
    } catch (error) {
      // Emulators might already be connected, ignore error
      console.warn('Firebase Emulators connection warning:', error);
    }
  }
}

export { app, auth, db, storage };
