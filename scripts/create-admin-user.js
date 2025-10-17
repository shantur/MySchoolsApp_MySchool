#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Creates a fully functional admin user in Supabase for production use
 * 
 * Usage:
 *   node scripts/create-admin-user.js <email> <password> <school_name>
 * 
 * Example:
 *   node scripts/create-admin-user.js admin@example.com SecurePass123! "My School"
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (from project settings)
 */

const { createClient } = require('@supabase/supabase-js');

// Get command line arguments
const args = process.argv.slice(2);
const [email, password, schoolName] = args;

// Validate arguments
if (!email || !password || !schoolName) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node scripts/create-admin-user.js <email> <password> <school_name>');
  console.log('Example: node scripts/create-admin-user.js admin@example.com SecurePass123! "My School"');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.error('❌ Error: Password must be at least 8 characters long');
  process.exit(1);
}

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.log('\nRequired environment variables:');
  console.log('  - SUPABASE_URL: Your Supabase project URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY: Your service role key');
  console.log('\nExample:');
  console.log('  export SUPABASE_URL="https://your-project.supabase.co"');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...\n');
  console.log(`📧 Email: ${email}`);
  console.log(`🏫 School: ${schoolName}\n`);

  try {
    // Step 1: Create or get school
    console.log('Step 1: Creating/getting school...');
    let schoolId;

    const { data: existingSchools, error: schoolSearchError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('name', schoolName)
      .maybeSingle();

    if (schoolSearchError && schoolSearchError.code !== 'PGRST116') {
      throw new Error(`Error searching for school: ${schoolSearchError.message}`);
    }

    if (existingSchools) {
      schoolId = existingSchools.id;
      console.log(`✅ Using existing school: ${schoolName} (${schoolId})`);
    } else {
      const { data: newSchool, error: schoolCreateError } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          address: null,
          contact_email: email,
          contact_phone: null,
        })
        .select()
        .single();

      if (schoolCreateError) {
        throw new Error(`Error creating school: ${schoolCreateError.message}`);
      }

      schoolId = newSchool.id;
      console.log(`✅ Created new school: ${schoolName} (${schoolId})`);
    }

    // Step 2: Check if user already exists
    console.log('\nStep 2: Checking if user already exists...');
    const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Error listing users: ${listError.message}`);
    }

    const existingAuthUser = existingAuthUsers.users.find(user => user.email === email);

    let userId;

    if (existingAuthUser) {
      console.log(`⚠️  User ${email} already exists in auth.users`);
      userId = existingAuthUser.id;

      // Update the auth user
      console.log('   Updating auth user...');
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          display_name: 'Admin User',
          role: 'admin',
        },
      });

      if (updateAuthError) {
        throw new Error(`Error updating auth user: ${updateAuthError.message}`);
      }
      console.log('✅ Updated auth user');
    } else {
      // Create new auth user
      console.log('   Creating new auth user...');
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          display_name: 'Admin User',
          role: 'admin',
        },
      });

      if (createAuthError) {
        throw new Error(`Error creating auth user: ${createAuthError.message}`);
      }

      userId = newAuthUser.user.id;
      console.log(`✅ Created auth user (${userId})`);
    }

    // Step 3: Create or update user in users table
    console.log('\nStep 3: Creating/updating user in users table...');
    
    const { data: existingUser, error: userSearchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userSearchError && userSearchError.code !== 'PGRST116') {
      throw new Error(`Error searching for user: ${userSearchError.message}`);
    }

    if (existingUser) {
      console.log('   User exists, updating...');
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          email: email,
          school_id: schoolId,
          role: 'admin',
          display_name: 'Admin User',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateUserError) {
        throw new Error(`Error updating user: ${updateUserError.message}`);
      }
      console.log('✅ Updated user in users table');
    } else {
      console.log('   Creating new user record...');
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          school_id: schoolId,
          role: 'admin',
          display_name: 'Admin User',
          group_ids: [],
        });

      if (insertUserError) {
        throw new Error(`Error creating user: ${insertUserError.message}`);
      }
      console.log('✅ Created user in users table');
    }

    // Step 4: Verify everything
    console.log('\nStep 4: Verifying user setup...');
    
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select(`
        *,
        schools (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (verifyError) {
      throw new Error(`Error verifying user: ${verifyError.message}`);
    }

    console.log('✅ User verification successful\n');

    // Display summary
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ADMIN USER CREATED SUCCESSFULLY ✅              ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    console.log('📋 User Details:');
    console.log(`   User ID:      ${verifyUser.id}`);
    console.log(`   Email:        ${verifyUser.email}`);
    console.log(`   Role:         ${verifyUser.role}`);
    console.log(`   School:       ${verifyUser.schools.name}`);
    console.log(`   School ID:    ${verifyUser.school_id}`);
    console.log(`   Display Name: ${verifyUser.display_name}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 You can now log in at: https://myschoolweb.myschools.app/login');
    console.log('\n✅ Setup complete!');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
