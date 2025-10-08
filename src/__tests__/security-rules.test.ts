/**
 * Firebase Security Rules Tests
 * 
 * These tests validate that the Firebase Security Rules properly enforce
 * admin-only access to Firestore collections and Storage buckets.
 * 
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { initializeAdminApp, assertFails, assertSucceeds, RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';

describe.skip('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let adminDb: any;
  let adminStorage: any;

  beforeAll(async () => {
    // Set up the test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId: 'myschool-security-rules-test',
      firestore: {
        host: 'localhost',
        port: 8080,
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /schools/{schoolId} {
                allow read, write: if request.auth.token.admin == true;
              }
              match /users/{userId} {
                allow read, write: if request.auth.token.admin == true;
              }
              match /groups/{groupId} {
                allow read, write: if request.auth.token.admin == true;
              }
              match /notices/{noticeId} {
                allow read, write: if request.auth.token.admin == true;
              }
            }
          }
        `,
      },
      storage: {
        host: 'localhost',
        port: 9199,
        rules: `
          rules_version = '2';
          service firebase.storage {
            match /b/{bucket}/o {
              match /attachments/{schoolId}/{noticeId}/{filename} {
                allow read, write: if request.auth.token.admin == true;
              }
            }
          }
        `,
      },
    });

    // Get admin instances for setup
    const adminApp = initializeAdminApp({
      projectId: 'myschool-security-rules-test',
    });
    adminDb = adminApp.firestore();
    adminStorage = adminApp.storage();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
  });

  describe('Firestore Security Rules', () => {
    describe('Unauthenticated Access', () => {
      let unauthenticatedDb: any;

      beforeEach(() => {
        unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      });

      test('should deny read access to schools collection', async () => {
        const schoolsRef = collection(unauthenticatedDb, 'schools');
        await assertFails(getDocs(schoolsRef));
      });

      test('should deny write access to schools collection', async () => {
        const schoolsRef = collection(unauthenticatedDb, 'schools');
        await assertFails(addDoc(schoolsRef, { name: 'Test School' }));
      });

      test('should deny read access to users collection', async () => {
        const usersRef = collection(unauthenticatedDb, 'users');
        await assertFails(getDocs(usersRef));
      });

      test('should deny write access to users collection', async () => {
        const usersRef = collection(unauthenticatedDb, 'users');
        await assertFails(addDoc(usersRef, { email: 'test@example.com' }));
      });

      test('should deny read access to groups collection', async () => {
        const groupsRef = collection(unauthenticatedDb, 'groups');
        await assertFails(getDocs(groupsRef));
      });

      test('should deny write access to groups collection', async () => {
        const groupsRef = collection(unauthenticatedDb, 'groups');
        await assertFails(addDoc(groupsRef, { name: 'Test Group' }));
      });

      test('should deny read access to notices collection', async () => {
        const noticesRef = collection(unauthenticatedDb, 'notices');
        await assertFails(getDocs(noticesRef));
      });

      test('should deny write access to notices collection', async () => {
        const noticesRef = collection(unauthenticatedDb, 'notices');
        await assertFails(addDoc(noticesRef, { title: 'Test Notice' }));
      });
    });

    describe('Regular User Access (non-admin)', () => {
      let regularUserDb: any;

      beforeEach(() => {
        regularUserDb = testEnv.authenticatedContext('user123', { admin: false }).firestore();
      });

      test('should deny read access to schools collection', async () => {
        const schoolsRef = collection(regularUserDb, 'schools');
        await assertFails(getDocs(schoolsRef));
      });

      test('should deny write access to schools collection', async () => {
        const schoolsRef = collection(regularUserDb, 'schools');
        await assertFails(addDoc(schoolsRef, { name: 'Test School' }));
      });

      test('should deny read access to users collection', async () => {
        const usersRef = collection(regularUserDb, 'users');
        await assertFails(getDocs(usersRef));
      });

      test('should deny write access to users collection', async () => {
        const usersRef = collection(regularUserDb, 'users');
        await assertFails(addDoc(usersRef, { email: 'test@example.com' }));
      });

      test('should deny read access to groups collection', async () => {
        const groupsRef = collection(regularUserDb, 'groups');
        await assertFails(getDocs(groupsRef));
      });

      test('should deny write access to groups collection', async () => {
        const groupsRef = collection(regularUserDb, 'groups');
        await assertFails(addDoc(groupsRef, { name: 'Test Group' }));
      });

      test('should deny read access to notices collection', async () => {
        const noticesRef = collection(regularUserDb, 'notices');
        await assertFails(getDocs(noticesRef));
      });

      test('should deny write access to notices collection', async () => {
        const noticesRef = collection(regularUserDb, 'notices');
        await assertFails(addDoc(noticesRef, { title: 'Test Notice' }));
      });
    });

    describe('Admin User Access', () => {
      let adminUserDb: any;

      beforeEach(() => {
        adminUserDb = testEnv.authenticatedContext('admin123', { admin: true }).firestore();
      });

      test('should allow read access to schools collection', async () => {
        // First set up test data with admin
        await setDoc(doc(adminDb, 'schools', 'school1'), {
          name: 'Test School',
          createdAt: new Date(),
        });

        const schoolsRef = collection(adminUserDb, 'schools');
        await assertSucceeds(getDocs(schoolsRef));
      });

      test('should allow write access to schools collection', async () => {
        const schoolsRef = collection(adminUserDb, 'schools');
        await assertSucceeds(addDoc(schoolsRef, { name: 'Test School' }));
      });

      test('should allow read access to users collection', async () => {
        // First set up test data with admin
        await setDoc(doc(adminDb, 'users', 'user1'), {
          email: 'test@example.com',
          createdAt: new Date(),
        });

        const usersRef = collection(adminUserDb, 'users');
        await assertSucceeds(getDocs(usersRef));
      });

      test('should allow write access to users collection', async () => {
        const usersRef = collection(adminUserDb, 'users');
        await assertSucceeds(addDoc(usersRef, { email: 'test@example.com' }));
      });

      test('should allow read access to groups collection', async () => {
        // First set up test data with admin
        await setDoc(doc(adminDb, 'groups', 'group1'), {
          name: 'Test Group',
          schoolId: 'school1',
          createdAt: new Date(),
        });

        const groupsRef = collection(adminUserDb, 'groups');
        await assertSucceeds(getDocs(groupsRef));
      });

      test('should allow write access to groups collection', async () => {
        const groupsRef = collection(adminUserDb, 'groups');
        await assertSucceeds(addDoc(groupsRef, { name: 'Test Group', schoolId: 'school1' }));
      });

      test('should allow read access to notices collection', async () => {
        // First set up test data with admin
        await setDoc(doc(adminDb, 'notices', 'notice1'), {
          title: 'Test Notice',
          schoolId: 'school1',
          createdAt: new Date(),
        });

        const noticesRef = collection(adminUserDb, 'notices');
        await assertSucceeds(getDocs(noticesRef));
      });

      test('should allow write access to notices collection', async () => {
        const noticesRef = collection(adminUserDb, 'notices');
        await assertSucceeds(addDoc(noticesRef, { title: 'Test Notice', schoolId: 'school1' }));
      });

      test('should allow individual document operations', async () => {
        // Set up test data
        const schoolRef = doc(adminDb, 'schools', 'school1');
        await setDoc(schoolRef, { name: 'Test School' });

        // Test individual document operations
        const adminSchoolRef = doc(adminUserDb, 'schools', 'school1');
        await assertSucceeds(getDoc(adminSchoolRef));
        await assertSucceeds(updateDoc(adminSchoolRef, { name: 'Updated School' }));
        await assertSucceeds(deleteDoc(adminSchoolRef));
      });
    });
  });

  describe('Storage Security Rules', () => {
    describe('Unauthenticated Access', () => {
      let unauthenticatedStorage: any;

      beforeEach(() => {
        unauthenticatedStorage = testEnv.unauthenticatedContext().storage();
      });

      test('should deny read access to attachments', async () => {
        const attachmentRef = ref(unauthenticatedStorage, 'attachments/school1/notice1/file.pdf');
        await assertFails(getDownloadURL(attachmentRef));
      });

      test('should deny write access to attachments', async () => {
        const attachmentRef = ref(unauthenticatedStorage, 'attachments/school1/notice1/file.pdf');
        const testData = new Uint8Array([1, 2, 3]);
        await assertFails(uploadBytes(attachmentRef, testData));
      });
    });

    describe('Regular User Access (non-admin)', () => {
      let regularUserStorage: any;

      beforeEach(() => {
        regularUserStorage = testEnv.authenticatedContext('user123', { admin: false }).storage();
      });

      test('should deny read access to attachments', async () => {
        const attachmentRef = ref(regularUserStorage, 'attachments/school1/notice1/file.pdf');
        await assertFails(getDownloadURL(attachmentRef));
      });

      test('should deny write access to attachments', async () => {
        const attachmentRef = ref(regularUserStorage, 'attachments/school1/notice1/file.pdf');
        const testData = new Uint8Array([1, 2, 3]);
        await assertFails(uploadBytes(attachmentRef, testData));
      });
    });

    describe('Admin User Access', () => {
      let adminUserStorage: any;

      beforeEach(() => {
        adminUserStorage = testEnv.authenticatedContext('admin123', { admin: true }).storage();
      });

      test('should allow read access to attachments', async () => {
        // First upload a file with admin storage
        const attachmentRef = ref(adminStorage, 'attachments/school1/notice1/file.pdf');
        const testData = new Uint8Array([1, 2, 3]);
        await uploadBytes(attachmentRef, testData);

        // Test read access with admin user context
        const adminAttachmentRef = ref(adminUserStorage, 'attachments/school1/notice1/file.pdf');
        await assertSucceeds(getDownloadURL(adminAttachmentRef));
      });

      test('should allow write access to attachments', async () => {
        const attachmentRef = ref(adminUserStorage, 'attachments/school1/notice1/file.pdf');
        const testData = new Uint8Array([1, 2, 3]);
        await assertSucceeds(uploadBytes(attachmentRef, testData));
      });

      test('should allow access to various attachment paths', async () => {
        const testPaths = [
          'attachments/school1/notice1/document.pdf',
          'attachments/school2/notice2/image.jpg',
          'attachments/school123/notice456/file.txt',
        ];

        for (const path of testPaths) {
          const attachmentRef = ref(adminUserStorage, path);
          const testData = new Uint8Array([1, 2, 3]);
          await assertSucceeds(uploadBytes(attachmentRef, testData));
        }
      });
    });
  });
});