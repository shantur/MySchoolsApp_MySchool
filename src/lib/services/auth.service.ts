/**
 * Authentication Service
 * 
 * Handles user authentication, account creation, and role management
 * using Firebase Admin SDK.
 */

console.log('[Auth Service] Module loading started');
import { UserSession, User } from '@/lib/types';
console.log('[Auth Service] Types imported');
// Defer Firebase Admin imports to runtime to avoid module-load hangs
let getAdminAuth: any;
let getAdminDb: any;
let Timestamp: any;

async function ensureFirebaseImports() {
  if (!getAdminAuth) {
    console.log('[Auth Service] Lazy loading Firebase Admin SDK...');
    const adminLazy = await import('@/lib/firebase/admin-lazy');
    getAdminAuth = adminLazy.getAdminAuth;
    getAdminDb = adminLazy.getAdminDb;
    const firestore = await import('firebase-admin/firestore');
    Timestamp = firestore.Timestamp;
    console.log('[Auth Service] Firebase Admin SDK loaded');
  }
}
console.log('[Auth Service] Module loading complete');

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
  console.log('[Auth Service] authenticateUser called');
  
  try {
    // Ensure Firebase imports are loaded
    await ensureFirebaseImports();
    console.log('[Auth Service] Firebase imports ready');
    
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
    console.log(`[Auth Service] Full auth endpoint URL: ${authEndpoint}`);
    
    // Verify password using Firebase Auth REST API with timeout using Promise.race
    const fetchPromise = fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });
    
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Firebase Auth request timed out after 10 seconds')), 10000);
    });
    
    let authResponse;
    try {
      authResponse = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('[Auth Service] Firebase Auth response received');
    } catch (fetchError: unknown) {
      console.error('[Auth Service] Firebase Auth fetch error:', fetchError);
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
    
    console.log('[Auth Service] User authenticated via Firebase Auth, uid:', uid);
    console.log('[Auth Service] TEMPORARY: Skipping Firestore lookup to test if this is causing the hang');
    console.log('[Auth Service] Returning mock user session for testing');
    
    // TEMPORARY: Return mock session to test if Firestore access is causing the hang
    return {
      uid: uid,
      email: email,
      schoolId: 'test-school',
      role: 'admin',
      displayName: email,
      groupIds: [],
    };
    
    /* COMMENTED OUT TO TEST IF FIRESTORE IS CAUSING HANG
    // Fetch user data from Firestore using Admin SDK
    await ensureFirebaseImports();
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
    
    const userData = userDoc.data();
    
    return {
      uid: userData.uid,
      email: userData.email,
      schoolId: userData.schoolId,
      role: userData.role,
      displayName: userData.displayName,
      groupIds: userData.groupIds,
    };
    */
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
  console.log('[Auth Service] createUserAccount called');
  
  // Ensure Firebase imports are loaded
  await ensureFirebaseImports();
  
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
  console.log('[Auth Service] setUserRole called');
  
  // Ensure Firebase imports are loaded
  await ensureFirebaseImports();
  
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  await adminAuth.setCustomUserClaims(uid, { role });
}
