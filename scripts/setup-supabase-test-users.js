#!/usr/bin/env node

/**
 * Setup Test Users for Supabase E2E Testing
 * 
 * This script creates test users in Supabase Auth for E2E testing
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test users to create
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    email_confirm: true,
    user_metadata: {
      display_name: 'Test Admin User',
      role: 'admin',
      school_id: 'school-admin-test',
    },
  },
  {
    email: 'user@test.com',
    password: 'TestUser123!',
    email_confirm: true,
    user_metadata: {
      display_name: 'Test Regular User',
      role: 'user',
      school_id: 'school-user-test',
    },
  },
  {
    email: 'teacher@test.com',
    password: 'TestTeacher123!',
    email_confirm: true,
    user_metadata: {
      display_name: 'Test Teacher User',
      role: 'teacher',
      school_id: 'school-teacher-test',
    },
  },
];

async function setupTestUsers() {
  console.log('🔧 Setting up test users in Supabase Auth...');
  
  try {
    for (const userData of TEST_USERS) {
      console.log(`Creating user: ${userData.email}`);
      
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        continue;
      }
      
      const existingUser = existingUsers.users.find(user => user.email === userData.email);
      
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists, updating...`);
        
        // Update existing user
        const { data, error } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            email: userData.email,
            password: userData.password,
            email_confirm: userData.email_confirm,
            user_metadata: userData.user_metadata,
          }
        );
        
        if (error) {
          console.error(`❌ Error updating user ${userData.email}:`, error.message);
        } else {
          console.log(`✅ Updated user ${userData.email}`);
        }
      } else {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: userData.email_confirm,
          user_metadata: userData.user_metadata,
        });
        
        if (error) {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        } else {
          console.log(`✅ Created user ${userData.email}`);
        }
      }
    }
    
    // Create corresponding user records in the users table
    console.log('📝 Creating user records in database...');
    
    for (const userData of TEST_USERS) {
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const user = authUser.users.find(u => u.email === userData.email);
      
      if (user) {
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            display_name: userData.user_metadata.display_name,
            role: userData.user_metadata.role,
            school_id: userData.user_metadata.school_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (dbError) {
          console.error(`❌ Error creating user record for ${userData.email}:`, dbError.message);
        } else {
          console.log(`✅ Created user record for ${userData.email}`);
        }
      }
    }
    
    console.log('✅ Test users setup completed!');
    console.log('\n📋 Test User Credentials:');
    TEST_USERS.forEach(user => {
      console.log(`  ${user.email} / ${user.password} (${user.user_metadata.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up test users:', error);
    process.exit(1);
  }
}

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return;
    }
    
    for (const user of users.users) {
      if (user.email?.endsWith('@test.com')) {
        console.log(`Deleting user: ${user.email}`);
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`❌ Error deleting user ${user.email}:`, error.message);
        } else {
          console.log(`✅ Deleted user ${user.email}`);
        }
      }
    }
    
    // Clean up user records from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .like('email', '%@test.com');
    
    if (dbError) {
      console.error('❌ Error cleaning up user records:', dbError.message);
    } else {
      console.log('✅ Cleaned up user records from database');
    }
    
    console.log('✅ Test users cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up test users:', error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestUsers();
} else if (command === 'setup' || !command) {
  setupTestUsers();
} else {
  console.log('Usage: node setup-supabase-test-users.js [setup|cleanup]');
  process.exit(1);
}