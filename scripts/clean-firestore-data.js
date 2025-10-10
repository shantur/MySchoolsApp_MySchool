/**
 * Clean Firestore Data Script
 * 
 * This script clears all data from Firestore emulator collections
 * 
 * Usage: node scripts/clean-firestore-data.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'myschools-app-dev',
  });
}

const db = admin.firestore();

// Connect to Firestore emulator
if (process.env.USE_FIREBASE_EMULATORS === 'true' || process.env.NODE_ENV !== 'production') {
  console.log('Connecting to Firestore emulator at localhost:8080...');
  db.settings({
    host: 'localhost:8080',
    ssl: false
  });
}

async function deleteCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`  Collection "${collectionName}" is already empty`);
    return 0;
  }

  const batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  await batch.commit();
  console.log(`  ✓ Deleted ${count} documents from "${collectionName}"`);
  return count;
}

async function cleanFirestoreData() {
  console.log('Starting Firestore data cleanup...\n');

  try {
    const collections = ['schools', 'groups', 'notices', 'users'];
    let totalDeleted = 0;

    for (const collection of collections) {
      const deleted = await deleteCollection(collection);
      totalDeleted += deleted;
    }

    console.log(`\n✓ Cleanup complete! Deleted ${totalDeleted} total documents.`);

  } catch (error) {
    console.error('\n✗ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanFirestoreData()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
