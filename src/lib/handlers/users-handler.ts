/**
 * Users Handler
 *
 * Handles user-related data operations for the MySchool application.
 */

import { getAdminDb } from '@/lib/firebase/admin-lazy';
import { User } from '@/lib/types';

// Lazy initialization of Firestore
const getDb = () => {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore is not available');
  }
  return db;
};

/**
 * Get all users (admin only)
 *
 * @returns Promise<User[]> - Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const db = getDb();
    const usersSnapshot = await db.collection('users').get();

    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        schoolId: data.schoolId,
        role: data.role,
        displayName: data.displayName,
        groupIds: data.groupIds || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Get user by UID
 *
 * @param uid - User UID
 * @returns Promise<User | null> - User data or null if not found
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    console.log(`[UsersHandler] Getting user by UID: ${uid}`);
    const db = getDb();
    if (!db) {
      console.log(`[UsersHandler] Firestore not available`);
      return null;
    }
    console.log(`[UsersHandler] Firestore available, fetching document...`);
    const userDoc = await db.collection('users').doc(uid).get();
    console.log(`[UsersHandler] Document exists: ${userDoc.exists}`);

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data()!;
    return {
      uid: userDoc.id,
      email: data.email,
      schoolId: data.schoolId,
      role: data.role,
      displayName: data.displayName,
      groupIds: data.groupIds || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}