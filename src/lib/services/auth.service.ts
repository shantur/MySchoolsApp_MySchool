/**
 * Authentication Service
 * 
 * Handles user authentication, account creation, and role management
 * using Firebase Admin SDK.
 */

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-lazy';
import { UserSession, User } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Parameters for creating a new user account
 */
export interface CreateUserParams {
  email: string;
  password: string;
  schoolId: string;
  role: 'user' | 'admin';
  displayName?: string;
  groupIds?: string[];
}

/**
 * Authenticate a user with email and password
 * 
 * Uses Firebase Auth REST API for password verification (works with both
 * emulators and production), then fetches user data from Firestore using
 * Admin SDK.
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @return {Promise<UserSession | null>} User session data or null
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<UserSession | null> {
  try {
    // Determine Firebase Auth endpoint based on environment
    const useEmulator = process.env.USE_FIREBASE_EMULATORS === 'true';
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!apiKey) {
      console.error('Firebase API key not configured');
      return null;
    }
    
    // Firebase Auth REST API endpoint
    const authEndpoint = useEmulator
      ? `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    
    console.log(`[Auth Service] Using Firebase Auth endpoint: ${useEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
    console.log(`[Auth Service] API Key present: ${!!apiKey}, length: ${apiKey?.length}`);
    
    // Verify password using Firebase Auth REST API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let authResponse;
    try {
      authResponse = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if ((fetchError as Error).name === 'AbortError') {
        console.error('[Auth Service] Firebase Auth request timed out after 10 seconds');
      } else {
        console.error('[Auth Service] Firebase Auth fetch error:', fetchError);
      }
      return null;
    }
    
    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      console.error('[Auth Service] Firebase Auth error:', errorData);
      return null;
    }
    
    console.log('[Auth Service] Firebase Auth successful');
    const authData = await authResponse.json();
    const uid = authData.localId;
    
    // Fetch user data from Firestore using Admin SDK
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Firebase Admin DB not initialized');
      return null;
    }
    
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.error('User document not found in Firestore');
      return null;
    }
    
    const userData = userDoc.data() as User;
    
    return {
      uid: userData.uid,
      email: userData.email,
      schoolId: userData.schoolId,
      role: userData.role,
      displayName: userData.displayName,
      groupIds: userData.groupIds,
    };
  } catch (error) {
    // Invalid credentials or user not found
    console.error('Authentication failed:', error);
    return null;
  }
}

/**
 * Create a new user account in Firebase Auth and Firestore
 * 
 * @param {CreateUserParams} params - User creation parameters
 * @return {Promise<User>} Created user data
 * @throws {Error} If user creation fails
 */
export async function createUserAccount(
  params: CreateUserParams
): Promise<User> {
  const { email, password, schoolId, role, displayName, groupIds } = params;
  
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  
  if (!adminAuth || !adminDb) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    
    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    
    // Create user document in Firestore
    const now = Timestamp.now();
    const userData: User = {
      uid: userRecord.uid,
      email: email,
      schoolId,
      role,
      displayName,
      groupIds: groupIds || [],
      createdAt: now,
      updatedAt: now,
    };
    
    await adminDb.collection('users').doc(userRecord.uid).set(userData);
    
    return userData;
  } catch (error) {
    throw error;
  }
}

/**
 * Set user role via custom claims
 * 
 * @param {string} uid - User ID
 * @param {'user' | 'admin'} role - User role
 * @return {Promise<void>}
 */
export async function setUserRole(
  uid: string,
  role: 'user' | 'admin'
): Promise<void> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  await adminAuth.setCustomUserClaims(uid, { role });
}
