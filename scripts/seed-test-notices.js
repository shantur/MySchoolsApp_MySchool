#!/usr/bin/env node

/**
 * Seed Test Notices Script
 * 
 * This script creates sample notices in the Firestore emulator for testing purposes.
 * Run this after setting up test users to populate the database with test data.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'myschools-app-dev',
});

const db = admin.firestore();

const SCHOOL_ID = 'test-school-123';
const ADMIN_USER_ID = 'YXmduvwuVZqzbMVSr5Q5vBLtBiYC'; // admin@test.com UID from setup-test-users

// Sample notices
const sampleNotices = [
  {
    title: 'Welcome to MySchool!',
    content: 'Welcome to our school portal. Here you can view important notices and announcements from your school.',
    sender: 'Principal Smith',
    date: new Date('2025-10-10T09:00:00Z'),
    priority: 'high',
    groups: ['all-parents'],
  },
  {
    title: 'Parent-Teacher Conference Schedule',
    content: 'Parent-teacher conferences will be held next week. Please check your child\'s schedule and book your appointment.',
    sender: 'Admin Office',
    date: new Date('2025-10-11T10:30:00Z'),
    priority: 'medium',
    groups: ['all-parents'],
  },
  {
    title: 'School Holiday - October 15th',
    content: 'School will be closed on October 15th for the holiday. Regular classes will resume on October 16th.',
    sender: 'Admin Office',
    date: new Date('2025-10-09T14:00:00Z'),
    priority: 'high',
    groups: ['all-parents', 'all-staff'],
  },
  {
    title: 'Lunch Menu Update',
    content: 'New lunch menu options are now available. Please review the updated menu on our website.',
    sender: 'Cafeteria Manager',
    date: new Date('2025-10-08T11:00:00Z'),
    priority: 'low',
    groups: ['all-parents'],
  },
  {
    title: 'Sports Day Reminder',
    content: 'Don\'t forget! Sports Day is coming up on October 20th. Students should wear their PE uniforms.',
    sender: 'PE Department',
    date: new Date('2025-10-12T08:00:00Z'),
    priority: 'medium',
    groups: ['all-parents', 'students'],
  },
];

async function seedNotices() {
  console.log('🌱 Seeding test notices in Firestore Emulator...\n');

  try {
    // Create a default group if it doesn't exist
    const groupRef = db.collection('groups').doc('all-parents');
    const groupDoc = await groupRef.get();
    
    if (!groupDoc.exists) {
      await groupRef.set({
        name: 'All Parents',
        description: 'All parents in the school',
        schoolId: SCHOOL_ID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: ADMIN_USER_ID,
        memberCount: 0,
      });
      console.log('✓ Created default group: All Parents\n');
    }

    // Create notices
    for (const noticeData of sampleNotices) {
      const noticeRef = db.collection('notices').doc();
      
      await noticeRef.set({
        ...noticeData,
        schoolId: SCHOOL_ID,
        createdBy: ADMIN_USER_ID,
        createdAt: admin.firestore.Timestamp.fromDate(noticeData.date),
        updatedAt: admin.firestore.Timestamp.fromDate(noticeData.date),
        attachments: [],
        readBy: [],
        status: 'published',
      });

      console.log(`✓ Created notice: ${noticeData.title}`);
    }

    console.log(`\n✅ Successfully created ${sampleNotices.length} test notices!`);
    console.log('\nYou can now test the MySchools App with sample data.');
    
  } catch (error) {
    console.error('❌ Error seeding notices:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding function
seedNotices();
