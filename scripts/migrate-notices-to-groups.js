/**
 * Migration Script: Add groupId to existing notices
 * 
 * This script:
 * 1. Creates an "All School" group for each school (if it doesn't exist)
 * 2. Updates all existing notices to include a groupId field
 * 3. Assigns notices without groupId to the "All School" group of their respective school
 * 
 * Usage: node scripts/migrate-notices-to-groups.js
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

async function migrateNoticesToGroups() {
  console.log('Starting migration: Add groupId to existing notices...\n');

  try {
    // Step 1: Get all schools
    const schoolsSnapshot = await db.collection('schools').get();
    const schools = schoolsSnapshot.docs.map(doc => ({
      schoolId: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${schools.length} schools`);

    const schoolToAllGroupMap = {};

    // Step 2: Ensure "All School" group exists for each school
    for (const school of schools) {
      console.log(`\nProcessing school: ${school.name} (${school.schoolId})`);

      // Check if "All School" group exists
      let allSchoolGroupSnapshot = await db.collection('groups')
        .where('schoolId', '==', school.schoolId)
        .where('name', '==', 'All School')
        .limit(1)
        .get();

      let allSchoolGroupId;

      if (allSchoolGroupSnapshot.empty) {
        // Create "All School" group
        console.log(`  Creating "All School" group for ${school.name}...`);
        const newGroupRef = await db.collection('groups').add({
          schoolId: school.schoolId,
          name: 'All School',
          description: `Default group for all students in ${school.name}`,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
        allSchoolGroupId = newGroupRef.id;
        console.log(`  ✓ Created group with ID: ${allSchoolGroupId}`);
      } else {
        allSchoolGroupId = allSchoolGroupSnapshot.docs[0].id;
        console.log(`  ✓ Found existing "All School" group: ${allSchoolGroupId}`);
      }

      schoolToAllGroupMap[school.schoolId] = allSchoolGroupId;
    }

    // Step 3: Migrate notices without groupId
    console.log('\n\nMigrating notices...');
    const noticesSnapshot = await db.collection('notices').get();
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const batch = db.batch();
    let batchCount = 0;
    const BATCH_LIMIT = 500;

    for (const noticeDoc of noticesSnapshot.docs) {
      const noticeData = noticeDoc.data();

      // Skip if already has groupId
      if (noticeData.groupId) {
        skippedCount++;
        continue;
      }

      const schoolId = noticeData.schoolId;
      const allSchoolGroupId = schoolToAllGroupMap[schoolId];

      if (!allSchoolGroupId) {
        console.warn(`  ⚠ Warning: Could not find "All School" group for notice ${noticeDoc.id} in school ${schoolId}`);
        errorCount++;
        continue;
      }

      // Add groupId to the notice
      batch.update(noticeDoc.ref, {
        groupId: allSchoolGroupId,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      migratedCount++;
      batchCount++;

      // Commit batch if we reach the limit
      if (batchCount >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} updates`);
    }

    // Summary
    console.log('\n\nMigration Summary:');
    console.log(`  Total notices processed: ${noticesSnapshot.size}`);
    console.log(`  ✓ Migrated: ${migratedCount}`);
    console.log(`  - Skipped (already had groupId): ${skippedCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
    console.log('\nMigration complete!');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateNoticesToGroups()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
