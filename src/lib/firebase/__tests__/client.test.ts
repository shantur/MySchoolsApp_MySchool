/**
 * Unit tests for Firebase Client SDK initialization
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create mock instances
const mockApp = { name: 'test-app' };
const mockAuth = { currentUser: null };
const mockDb = { type: 'firestore' };
const mockStorage = { type: 'storage' };

// Mock firebase/app module
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => mockApp),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  connectAuthEmulator: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => mockStorage),
  connectStorageEmulator: jest.fn(),
}));

describe('Firebase Client SDK', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  });

  it('should export firebase app instance', async () => {
    // Set required environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

    const clientModule = await import('../client');
    
    expect(clientModule.app).toBeDefined();
  });

  it('should export auth instance', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

    const clientModule = await import('../client');
    
    expect(clientModule.auth).toBeDefined();
  });

  it('should export firestore instance', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

    const clientModule = await import('../client');
    
    expect(clientModule.db).toBeDefined();
  });

  it('should export storage instance', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

    const clientModule = await import('../client');
    
    expect(clientModule.storage).toBeDefined();
  });

  it('should initialize with valid configuration', async () => {
    // Set environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

    const clientModule = await import('../client');
    
    // Verify all instances are defined
    expect(clientModule.app).toBeDefined();
    expect(clientModule.auth).toBeDefined();
    expect(clientModule.db).toBeDefined();
    expect(clientModule.storage).toBeDefined();
  });
});
