/**
 * Users Handler
 *
 * Handles user-related data operations for the MySchool application.
 */

import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin-lazy';
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

/**
 * Update user by UID
 *
 * @param uid - User UID
 * @param updateData - Partial user data to update
 * @returns Promise<User> - Updated user data
 */
export async function updateUserHandler(
  uid: string,
  updateData: {
    email: string;
    schoolId: string;
    role: 'user' | 'admin';
    displayName?: string;
    groupIds?: string[];
  }
): Promise<User> {
  try {
    console.log(`[UsersHandler] Updating user: ${uid}`);
    const db = getDb();
    const auth = getAdminAuth();

    if (!db || !auth) {
      throw new Error('Firebase services not available');
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentData = userDoc.data()!;

    // Update email in Firebase Auth if changed
    if (updateData.email !== currentData.email) {
      await auth.updateUser(uid, { email: updateData.email });
    }

    // Prepare update data for Firestore
    const firestoreUpdateData: any = {
      email: updateData.email,
      schoolId: updateData.schoolId,
      role: updateData.role,
      updatedAt: new Date(),
    };

    if (updateData.displayName !== undefined) {
      firestoreUpdateData.displayName = updateData.displayName;
    }

    if (updateData.groupIds !== undefined) {
      firestoreUpdateData.groupIds = updateData.groupIds;
    }

    // Update user in Firestore
    await db.collection('users').doc(uid).update(firestoreUpdateData);

    // Fetch and return updated user
    const updatedUser = await getUserById(uid);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    console.log(`[UsersHandler] User updated successfully: ${uid}`);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error instanceof Error ? error : new Error('Failed to update user');
  }
}

/**
 * Delete user by UID
 *
 * @param uid - User UID
 * @returns Promise<void>
 */
export async function deleteUserHandler(uid: string): Promise<void> {
  try {
    console.log(`[UsersHandler] Deleting user: ${uid}`);
    const db = getDb();
    const auth = getAdminAuth();

    if (!db || !auth) {
      throw new Error('Firebase services not available');
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(uid);

    // Delete user from Firestore
    await db.collection('users').doc(uid).delete();

    console.log(`[UsersHandler] User deleted successfully: ${uid}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error instanceof Error ? error : new Error('Failed to delete user');
  }
}