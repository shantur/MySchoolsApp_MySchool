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
 * Note: This is a simplified authentication for the testbed.
 * In production, you would use Firebase Client SDK for
 * actual password verification.
 * 
 * @param {string} email - User email
 * @param {string} password - User password (not used in this implementation)
 * @return {Promise<UserSession | null>} User session data or null
 */
export async function authenticateUser(
  email: string,
  _password: string
): Promise<UserSession | null> {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    if (!adminAuth || !adminDb) {
      console.error('Firebase Admin SDK not initialized');
      return null;
    }
    
    // Get user by email from Firebase Auth
    const userRecord = await adminAuth.getUserByEmail(email);
    
    // Fetch user document from Firestore
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
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
  } catch {
    // User not found or authentication failed
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
