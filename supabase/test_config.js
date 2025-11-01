/**
 * Supabase Configuration Validation Test
 * 
 * This script validates that the Supabase local development configuration
 * is correctly set up and all services are functioning as expected.
 * 
 * Run with: node supabase/test_config.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from config.toml
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test counters
let passed = 0;
let failed = 0;

function logTest(name, success, details = '') {
  if (success) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${details ? ': ' + details : ''}`);
    failed++;
  }
}

async function main() {
  console.log('🔧 Testing Supabase Local Development Configuration...\n');

  // Test 1: API Connection (Anon Key)
  console.log('API CONNECTION (ANON):');
  try {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await anonClient.from('schools').select('count');
    
    if (error && error.code === 'PGRST301') {
      // No rows returned is acceptable - connection works
      logTest('Anon client connection established', true);
    } else if (!error) {
      logTest('Anon client can query schools table', true);
    } else {
      logTest('Anon client connection', false, error.message);
    }
  } catch (err) {
    logTest('Anon client connection', false, err.message);
  }

  // Test 2: API Connection (Service Role Key)
  console.log('\nAPI CONNECTION (SERVICE ROLE):');
  try {
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await serviceClient.from('schools').select('count');
    
    if (!error || error.code === 'PGRST301') {
      logTest('Service role client connection established', true);
    } else {
      logTest('Service role client connection', false, error.message);
    }
  } catch (err) {
    logTest('Service role client connection', false, err.message);
  }

  // Test 3: Schema Validation
  console.log('\nSCHEMA VALIDATION:');
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const tables = ['schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs'];
  for (const table of tables) {
    try {
      const { error } = await serviceClient.from(table).select('*').limit(1);
      if (!error || error.code === 'PGRST301') {
        logTest(`Table "${table}" is accessible`, true);
      } else {
        logTest(`Table "${table}" is accessible`, false, error.message);
      }
    } catch (err) {
      logTest(`Table "${table}" is accessible`, false, err.message);
    }
  }

  // Test 4: Storage Buckets
  console.log('\nSTORAGE BUCKETS:');
  try {
    const { data: buckets, error } = await serviceClient.storage.listBuckets();
    
    if (!error) {
      const bucketNames = buckets.map(b => b.name);
      logTest('Storage service is accessible', true);
      logTest('Bucket "attachments" exists', bucketNames.includes('attachments'));
      logTest('Bucket "school-logos" exists', bucketNames.includes('school-logos'));
      
      // Check bucket configurations
      const attachmentBucket = buckets.find(b => b.name === 'attachments');
      const logoBucket = buckets.find(b => b.name === 'school-logos');
      
      if (attachmentBucket) {
        logTest('Attachments bucket is private', attachmentBucket.public === false);
        logTest('Attachments bucket has 50MB limit', attachmentBucket.file_size_limit === 52428800);
      }
      
      if (logoBucket) {
        logTest('School-logos bucket is public', logoBucket.public === true);
      }
    } else {
      logTest('Storage service is accessible', false, error.message);
    }
  } catch (err) {
    logTest('Storage service is accessible', false, err.message);
  }

  // Test 5: Authentication Configuration
  console.log('\nAUTHENTICATION CONFIG:');
  console.log('  ℹ️  Password requirements: lower_upper_letters_digits_symbols');
  console.log('  ℹ️  Minimum password length: 8 characters');
  console.log('  ℹ️  JWT expiry: 3600 seconds (1 hour)');
  console.log('  ℹ️  Email confirmations: Disabled (for local dev)');
  console.log('  ℹ️  Signup enabled: Yes');

  // Test 6: Port Configuration
  console.log('\nPORT CONFIGURATION:');
  console.log('  ℹ️  API (REST/GraphQL): 54321');
  console.log('  ℹ️  PostgreSQL: 54322');
  console.log('  ℹ️  Studio UI: 54323');
  console.log('  ℹ️  Inbucket (Email): 54324');

  // Test 7: Database Features
  console.log('\nDATABASE FEATURES:');
  try {
    // Test trigger functionality
    const testSchool = {
      name: 'Config Test School',
      address: '123 Test St',
      contact_email: 'test@config.test'
    };
    
    const { data: insertData, error: insertError } = await serviceClient
      .from('schools')
      .insert(testSchool)
      .select()
      .single();
    
    if (!insertError && insertData) {
      logTest('Insert operations work', true);
      logTest('created_at timestamp auto-generated', !!insertData.created_at);
      logTest('updated_at timestamp auto-generated', !!insertData.updated_at);
      logTest('UUID primary key auto-generated', !!insertData.id);
      
      // Test update trigger
      const { data: updateData, error: updateError } = await serviceClient
        .from('schools')
        .update({ address: '456 Updated St' })
        .eq('id', insertData.id)
        .select()
        .single();
      
      if (!updateError && updateData) {
        const createdTime = new Date(insertData.created_at).getTime();
        const updatedTime = new Date(updateData.updated_at).getTime();
        logTest('updated_at trigger works on UPDATE', updatedTime > createdTime);
      } else {
        logTest('updated_at trigger works on UPDATE', false);
      }
      
      // Cleanup
      await serviceClient.from('schools').delete().eq('id', insertData.id);
    } else {
      logTest('Insert operations work', false, insertError?.message);
    }
  } catch (err) {
    logTest('Database features test', false, err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 SUMMARY: ${passed}/${passed + failed} tests passed (${failed} failed)`);
  
  if (failed === 0) {
    console.log('✨ Supabase configuration is correctly set up for local development!\n');
    console.log('📚 Access points:');
    console.log('   • API: http://127.0.0.1:54321');
    console.log('   • Studio: http://127.0.0.1:54323');
    console.log('   • Inbucket: http://127.0.0.1:54324');
    console.log('   • Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres\n');
  } else {
    console.log('⚠️  Some configuration tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
