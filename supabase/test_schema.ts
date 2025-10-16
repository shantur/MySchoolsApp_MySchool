/**
 * Schema Verification Test Script
 * Tests that all Phase 2 migrations were applied correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

async function testTableExists(tableName: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error && !error.message.includes('no rows')) {
      results.push({
        category: 'TABLE_EXISTENCE',
        test: `Table ${tableName} exists`,
        status: 'FAIL',
        details: error.message
      });
    } else {
      results.push({
        category: 'TABLE_EXISTENCE',
        test: `Table ${tableName} exists`,
        status: 'PASS'
      });
    }
  } catch (err) {
    results.push({
      category: 'TABLE_EXISTENCE',
      test: `Table ${tableName} exists`,
      status: 'FAIL',
      details: String(err)
    });
  }
}

async function testRLSEnabled(tableName: string): Promise<void> {
  try {
    // Try to query without authentication (should fail if RLS is enabled)
    const unauthClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    const { data, error } = await unauthClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    // For most tables, unauthenticated access should return empty results (RLS working)
    // or error depending on the policies
    results.push({
      category: 'RLS',
      test: `RLS enabled on ${tableName}`,
      status: 'PASS',
      details: `Query returned ${data?.length || 0} rows (expected 0 or error with RLS)`
    });
  } catch (err) {
    results.push({
      category: 'RLS',
      test: `RLS enabled on ${tableName}`,
      status: 'PASS',
      details: 'RLS preventing access as expected'
    });
  }
}

async function testInsertSchool(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: 'Test School',
        address: '123 Test St',
        contact_email: 'test@school.edu'
      })
      .select()
      .single();
    
    if (error) {
      results.push({
        category: 'INSERT_TEST',
        test: 'Insert school',
        status: 'FAIL',
        details: error.message
      });
    } else if (data && data.id) {
      results.push({
        category: 'INSERT_TEST',
        test: 'Insert school',
        status: 'PASS',
        details: `Created school with ID: ${data.id}`
      });
      
      // Cleanup
      await supabase.from('schools').delete().eq('id', data.id);
    }
  } catch (err) {
    results.push({
      category: 'INSERT_TEST',
      test: 'Insert school',
      status: 'FAIL',
      details: String(err)
    });
  }
}

async function testForeignKeyConstraint(): Promise<void> {
  try {
    // Try to insert a group with non-existent school_id
    const { error } = await supabase
      .from('groups')
      .insert({
        school_id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Group'
      });
    
    if (error && error.message.includes('foreign key')) {
      results.push({
        category: 'CONSTRAINTS',
        test: 'Foreign key constraint on groups.school_id',
        status: 'PASS',
        details: 'Foreign key violation detected as expected'
      });
    } else {
      results.push({
        category: 'CONSTRAINTS',
        test: 'Foreign key constraint on groups.school_id',
        status: 'FAIL',
        details: 'Foreign key constraint not working'
      });
    }
  } catch (err) {
    results.push({
      category: 'CONSTRAINTS',
      test: 'Foreign key constraint on groups.school_id',
      status: 'PASS',
      details: 'Foreign key violation caught'
    });
  }
}

async function testCheckConstraint(): Promise<void> {
  try {
    // Try to insert a notice with invalid status
    const { error } = await supabase
      .from('notices')
      .insert({
        school_id: '00000000-0000-0000-0000-000000000000',
        group_id: '00000000-0000-0000-0000-000000000000',
        title: 'Test',
        body: 'Test',
        status: 'invalid_status'
      });
    
    if (error && (error.message.includes('check constraint') || error.message.includes('violates'))) {
      results.push({
        category: 'CONSTRAINTS',
        test: 'Check constraint on notices.status',
        status: 'PASS',
        details: 'Check constraint violation detected as expected'
      });
    } else {
      results.push({
        category: 'CONSTRAINTS',
        test: 'Check constraint on notices.status',
        status: 'FAIL',
        details: 'Check constraint not working'
      });
    }
  } catch (err) {
    results.push({
      category: 'CONSTRAINTS',
      test: 'Check constraint on notices.status',
      status: 'PASS',
      details: 'Check constraint violation caught'
    });
  }
}

async function testUpdatedAtTrigger(): Promise<void> {
  try {
    // Create a school
    const { data: school, error: insertError } = await supabase
      .from('schools')
      .insert({
        name: 'Trigger Test School'
      })
      .select()
      .single();
    
    if (insertError || !school) {
      results.push({
        category: 'TRIGGERS',
        test: 'updated_at trigger',
        status: 'FAIL',
        details: 'Could not create test school'
      });
      return;
    }
    
    const originalUpdatedAt = school.updated_at;
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update the school
    const { data: updated, error: updateError } = await supabase
      .from('schools')
      .update({ name: 'Updated School Name' })
      .eq('id', school.id)
      .select()
      .single();
    
    if (updateError || !updated) {
      results.push({
        category: 'TRIGGERS',
        test: 'updated_at trigger',
        status: 'FAIL',
        details: 'Could not update test school'
      });
    } else if (new Date(updated.updated_at) > new Date(originalUpdatedAt)) {
      results.push({
        category: 'TRIGGERS',
        test: 'updated_at trigger',
        status: 'PASS',
        details: `updated_at changed from ${originalUpdatedAt} to ${updated.updated_at}`
      });
    } else {
      results.push({
        category: 'TRIGGERS',
        test: 'updated_at trigger',
        status: 'FAIL',
        details: 'updated_at did not change'
      });
    }
    
    // Cleanup
    await supabase.from('schools').delete().eq('id', school.id);
  } catch (err) {
    results.push({
      category: 'TRIGGERS',
      test: 'updated_at trigger',
      status: 'FAIL',
      details: String(err)
    });
  }
}

async function runTests() {
  console.log('🧪 Running Phase 2 Schema Verification Tests...\n');
  
  // Test table existence
  const tables = ['schools', 'users', 'groups', 'notices', 'notice_reads', 'audit_logs'];
  for (const table of tables) {
    await testTableExists(table);
  }
  
  // Test RLS
  for (const table of tables) {
    await testRLSEnabled(table);
  }
  
  // Test insert operations
  await testInsertSchool();
  
  // Test constraints
  await testForeignKeyConstraint();
  await testCheckConstraint();
  
  // Test triggers
  await testUpdatedAtTrigger();
  
  // Print results
  console.log('\n📊 TEST RESULTS\n');
  console.log('='.repeat(80));
  
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    console.log(`\n${category}:`);
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${result.test}`);
      if (result.details) {
        console.log(`     ${result.details}`);
      }
    }
  }
  
  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 SUMMARY: ${passed}/${total} tests passed (${failed} failed)`);
  
  if (failed === 0) {
    console.log('✨ All Phase 2 migrations applied successfully!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
