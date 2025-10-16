#!/usr/bin/env node

/**
 * E2E Test Data Seeding Script for Supabase
 * 
 * This script seeds the database with test data for E2E testing
 * 
 * Usage: node scripts/seed-e2e-test-data.js [setup|cleanup]
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data IDs (fixed UUIDs for consistency)
const TEST_DATA = {
  schools: {
    testSchool1: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Elementary School',
      address: '123 Test Street, Test City',
      contact_email: 'admin@testelementary.edu',
      contact_phone: '+1-555-0101',
    },
    testSchool2: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Another Test School',
      address: '456 Another Street, Test City',
      contact_email: 'admin@anothertest.edu',
      contact_phone: '+1-555-0102',
    },
  },
  groups: [
    {
      id: '00000000-0000-0000-0000-000000000011',
      school_id: '00000000-0000-0000-0000-000000000001',
      name: 'Grade 5A',
      description: 'Fifth grade morning class',
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      school_id: '00000000-0000-0000-0000-000000000001',
      name: 'Grade 6B',
      description: 'Sixth grade afternoon class',
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      school_id: '00000000-0000-0000-0000-000000000002',
      name: 'Grade 4C',
      description: 'Fourth grade class',
    },
  ],
  users: [
    {
      email: 'admin@test.com',
      password: 'TestAdmin123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Admin User',
        role: 'admin',
      },
      app_metadata: {
        role: 'admin',
      },
      school_id: '00000000-0000-0000-0000-000000000001',
      group_ids: [],
    },
    {
      email: 'user@test.com',
      password: 'TestUser123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Regular User',
        role: 'user',
      },
      app_metadata: {
        role: 'user',
      },
      school_id: '00000000-0000-0000-0000-000000000001',
      group_ids: ['00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012'],
    },
    {
      email: 'teacher@test.com',
      password: 'TestTeacher123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Teacher User',
        role: 'user', // Changed from 'teacher' to 'user' to match DB constraint
      },
      app_metadata: {
        role: 'user',
      },
      school_id: '00000000-0000-0000-0000-000000000001',
      group_ids: ['00000000-0000-0000-0000-000000000011'],
    },
  ],
  notices: [
    {
      id: '00000000-0000-0000-0000-000000000021',
      school_id: '00000000-0000-0000-0000-000000000001',
      group_id: '00000000-0000-0000-0000-000000000011',
      title: 'Important: School Event Tomorrow',
      body: 'Please note that the school event will take place tomorrow at 9 AM in the main hall.',
      status: 'published',
      publication_date: new Date().toISOString(),
      sender_name: 'Principal Smith',
      attachments: [],
    },
    {
      id: '00000000-0000-0000-0000-000000000022',
      school_id: '00000000-0000-0000-0000-000000000001',
      group_id: '00000000-0000-0000-0000-000000000012',
      title: 'Homework Reminder',
      body: 'Don\'t forget to complete your math homework by Friday.',
      status: 'published',
      publication_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      sender_name: 'Teacher Johnson',
      attachments: [],
    },
    {
      id: '00000000-0000-0000-0000-000000000023',
      school_id: '00000000-0000-0000-0000-000000000001',
      group_id: '00000000-0000-0000-0000-000000000011',
      title: 'Draft Notice',
      body: 'This is a draft notice that should not be visible to regular users.',
      status: 'draft',
      publication_date: new Date().toISOString(),
      sender_name: 'Admin User',
      attachments: [],
    },
  ],
};

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('🔧 Setting up E2E test data in Supabase...\n');

  try {
    // 1. Create test schools
    console.log('🏫 Creating test schools...');
    for (const [key, school] of Object.entries(TEST_DATA.schools)) {
      const { error } = await supabase
        .from('schools')
        .upsert(school, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating school ${school.name}:`, error.message);
      } else {
        console.log(`✅ Created school: ${school.name}`);
      }
    }

    // 2. Create test groups
    console.log('\n👥 Creating test groups...');
    for (const group of TEST_DATA.groups) {
      const { error } = await supabase
        .from('groups')
        .upsert(group, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating group ${group.name}:`, error.message);
      } else {
        console.log(`✅ Created group: ${group.name}`);
      }
    }

    // 3. Create test users in Supabase Auth
    console.log('\n🔑 Creating test users in Auth...');
    for (const userData of TEST_DATA.users) {
      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === userData.email);

      let userId;
      if (existingUser) {
        console.log(`ℹ️  User ${userData.email} already exists, updating...`);
        const { data, error } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            email: userData.email,
            password: userData.password,
            email_confirm: userData.email_confirm,
            user_metadata: userData.user_metadata,
            app_metadata: userData.app_metadata,
          }
        );

        if (error) {
          console.error(`❌ Error updating user ${userData.email}:`, error.message);
          continue;
        }
        userId = existingUser.id;
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: userData.email_confirm,
          user_metadata: userData.user_metadata,
          app_metadata: userData.app_metadata,
        });

        if (error) {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
          continue;
        }
        userId = data.user.id;
        console.log(`✅ Created user: ${userData.email}`);
      }

      // Create user record in users table
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: userData.email,
          display_name: userData.user_metadata.display_name,
          role: userData.user_metadata.role,
          school_id: userData.school_id,
          group_ids: userData.group_ids,
        }, { onConflict: 'id' });

      if (dbError) {
        console.error(`❌ Error creating user record for ${userData.email}:`, dbError.message);
      } else {
        console.log(`✅ Created user record: ${userData.email}`);
      }
    }

    // 4. Create test notices
    console.log('\n📢 Creating test notices...');
    for (const notice of TEST_DATA.notices) {
      const { error } = await supabase
        .from('notices')
        .upsert(notice, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating notice "${notice.title}":`, error.message);
      } else {
        console.log(`✅ Created notice: ${notice.title}`);
      }
    }

    console.log('\n✅ E2E test data setup completed!\n');
    console.log('📋 Test Credentials:');
    TEST_DATA.users.forEach(user => {
      console.log(`  ${user.email} / ${user.password} (${user.user_metadata.role})`);
    });

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up E2E test data...\n');

  try {
    // 1. Delete notices
    console.log('🗑️  Deleting test notices...');
    const { error: noticesError } = await supabase
      .from('notices')
      .delete()
      .in('id', TEST_DATA.notices.map(n => n.id));

    if (noticesError) {
      console.error('❌ Error deleting notices:', noticesError.message);
    } else {
      console.log('✅ Deleted test notices');
    }

    // 2. Delete users from database
    console.log('🗑️  Deleting user records...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .like('email', '%@test.com');

    if (usersError) {
      console.error('❌ Error deleting user records:', usersError.message);
    } else {
      console.log('✅ Deleted user records');
    }

    // 3. Delete users from Auth
    console.log('🗑️  Deleting auth users...');
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const user of users.users) {
      if (user.email?.endsWith('@test.com')) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`❌ Error deleting auth user ${user.email}:`, error.message);
        }
      }
    }
    console.log('✅ Deleted auth users');

    // 4. Delete groups
    console.log('🗑️  Deleting test groups...');
    const { error: groupsError } = await supabase
      .from('groups')
      .delete()
      .in('id', TEST_DATA.groups.map(g => g.id));

    if (groupsError) {
      console.error('❌ Error deleting groups:', groupsError.message);
    } else {
      console.log('✅ Deleted test groups');
    }

    // 5. Delete schools
    console.log('🗑️  Deleting test schools...');
    const schoolIds = Object.values(TEST_DATA.schools).map(s => s.id);
    const { error: schoolsError } = await supabase
      .from('schools')
      .delete()
      .in('id', schoolIds);

    if (schoolsError) {
      console.error('❌ Error deleting schools:', schoolsError.message);
    } else {
      console.log('✅ Deleted test schools');
    }

    console.log('\n✅ E2E test data cleanup completed!');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestData();
} else if (command === 'setup' || !command) {
  setupTestData();
} else {
  console.log('Usage: node seed-e2e-test-data.js [setup|cleanup]');
  console.log('  setup   - Create test data (default)');
  console.log('  cleanup - Remove test data');
  process.exit(1);
}
