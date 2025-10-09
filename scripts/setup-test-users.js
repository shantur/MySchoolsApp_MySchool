#!/usr/bin/env node
/**
 * Setup Test Users Script
 * 
 * Creates test users in Firebase Auth Emulator and Firestore
 * for development and testing purposes.
 * 
 * Usage: node scripts/setup-test-users.js
 * 
 * Prerequisites:
 * - Firebase emulators must be running
 * - Run: npm run emulators
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
const app = admin.initializeApp({
  projectId: 'myschools-app-dev',
});

// Connect to emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const auth = admin.auth(app);
const db = admin.firestore(app);

/**
 * Test users configuration
 */
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    displayName: 'Test Admin User',
    role: 'admin',
    schoolId: 'test-school-123',
    groupIds: [],
  },
  {
    email: 'user@test.com',
    password: 'TestUser123!',
    displayName: 'Test Regular User',
    role: 'user',
    schoolId: 'test-school-123',
    groupIds: ['K7FhWlZce393ECZf0BIV', '4nZq6vrcWoV0ZiEbrfus'],
  },
];

/**
 * Create or update a user in Firebase Auth and Firestore
 */
async function createTestUser(userConfig) {
  const { email, password, displayName, role, schoolId, groupIds } = userConfig;

  try {
    // Check if user already exists and delete if so (to ensure password is updated)
    let userRecord;
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`⚠ User ${email} exists, deleting to recreate with new password...`);
      await auth.deleteUser(existingUser.uid);
      // Also delete Firestore document
      await db.collection('users').doc(existingUser.uid).delete();
    } catch (error) {
      // User doesn't exist, which is fine
    }
    
    // Create new user with password
    userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });
    console.log(`✓ Created user ${email} (UID: ${userRecord.uid})`);


    // Set custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`✓ Set role "${role}" for ${email}`);

    // Create/update user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      schoolId,
      role,
      displayName,
      groupIds: groupIds || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    console.log(`✓ Created/updated Firestore document for ${email}`);

    return userRecord;
  } catch (error) {
    console.error(`✗ Failed to create user ${email}:`, error.message);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setupTestUsers() {
  console.log('🚀 Setting up test users in Firebase Auth Emulator...\n');

  try {
    // Verify emulator connection
    console.log('Checking emulator connection...');
    await auth.listUsers(1);
    console.log('✓ Connected to Firebase Auth Emulator\n');

    // Create test users
    for (const userConfig of TEST_USERS) {
      await createTestUser(userConfig);
      console.log('');
    }

    console.log('✅ Test users setup complete!\n');
    console.log('Available test accounts:');
    TEST_USERS.forEach(user => {
      console.log(`  - ${user.email} / ${user.password} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nMake sure Firebase emulators are running:');
    console.error('  npm run emulators\n');
    process.exit(1);
  } finally {
    // Cleanup
    await app.delete();
  }
}

// Run setup
setupTestUsers();
