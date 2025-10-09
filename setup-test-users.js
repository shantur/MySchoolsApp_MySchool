/**
 * Setup Test Users for Firebase Emulator
 * 
 * This script creates test users in Firebase Auth and Firestore
 * for E2E testing purposes.
 */

const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with emulator configuration
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize with a dummy service account for emulator
admin.initializeApp({
  projectId: 'myschools-app-dev',
});

const auth = getAuth();
const db = getFirestore();

const testUsers = [
  {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    displayName: 'Test Admin User',
    schoolId: 'test-school-123',
    groupIds: [],
  },
  {
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
    displayName: 'Test Regular User',
    schoolId: 'test-school-123',
    groupIds: ['K7FhWlZce393ECZf0BIV', '4nZq6vrcWoV0ZiEbrfus'],
  },
];

async function createTestUsers() {
  console.log('🔧 Creating test users in Firebase emulator...');
  
  for (const user of testUsers) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      
      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role: user.role });
      
      // Create user document in Firestore
      const userData = {
        uid: userRecord.uid,
        email: user.email,
        schoolId: user.schoolId,
        role: user.role,
        displayName: user.displayName,
        groupIds: user.groupIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`ℹ️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error);
      }
    }
  }
  
  console.log('✅ Test users setup complete');
}

createTestUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});