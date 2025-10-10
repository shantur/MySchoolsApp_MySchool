/**
 * Shared TypeScript Type Definitions for MySchool
 * 
 * These types align with the Firestore data models defined in
 * docs/spec/10_myschool_component.md
 */

import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

/**
 * Flexible Timestamp type that works with both client and admin SDKs
 */
export type FirestoreTimestamp = ClientTimestamp | AdminTimestamp;

/**
 * School entity
 */
export interface School {
  schoolId: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

/**
 * User entity
 */
export interface User {
  uid: string;
  email: string;
  schoolId: string;
  role: 'user' | 'admin';
  displayName?: string;
  groupIds?: string[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

/**
 * Group/Class entity
 */
export interface Group {
  groupId: string;
  schoolId: string;
  name: string;
  description?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

/**
 * Attachment metadata embedded in notices
 */
export interface Attachment {
  id: string; // Unique attachment identifier for HTML parsing
  fileName: string;
  fileType: string;
  downloadURL: string;
  size?: number;
}

/**
 * Notice entity
 * Note: schoolId kept for context/access control, groupId is primary association
 */
export interface Notice {
  noticeId: string;
  schoolId: string;  // Kept for school-level context/access checks
  groupId: string;   // Primary group association (one-to-one)
  title: string;
  body: string;
  publicationDate: FirestoreTimestamp;
  status: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

/**
 * User session data
 */
export interface UserSession {
  uid: string;
  email: string;
  schoolId: string;
  role: 'user' | 'admin';
  displayName?: string;
  groupIds?: string[];
}
