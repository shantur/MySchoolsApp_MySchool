/**
 * Shared TypeScript Type Definitions for MySchool
 * 
 * These types align with the Firestore data models defined in
 * docs/spec/10_myschool_component.md
 */


/**
 * Flexible Timestamp type that works with both client and admin SDKs
 */

/**
 * School entity
 */
export interface School {
  schoolId: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Group/Class entity
 */
export interface Group {
  groupId: string;
  schoolId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
  publicationDate: string;
  status: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
  senderName?: string;  // Display name of notice creator
  createdAt: string;
  updatedAt: string;
}

/**
 * Notice Read Tracking
 * Document ID format: {userId}_{noticeId}
 */
export interface NoticeRead {
  userId: string;
  noticeId: string;
  schoolId: string;  // For query scoping
  groupId: string;   // For query scoping
  readAt: string;
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
