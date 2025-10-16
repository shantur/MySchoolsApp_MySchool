/**
 * Storage Verification Script
 * 
 * Verifies that Supabase storage buckets are properly configured with:
 * - Correct bucket creation (attachments, school-logos)
 * - Proper RLS policies
 * - File upload/download functionality
 * - Access control enforcement
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Local Supabase connection
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logResult(test: string, passed: boolean, message: string) {
  results.push({ test, passed, message });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test} - ${message}`);
}

async function verifyBuckets() {
  console.log('\n=== 1. Verifying Storage Buckets ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logResult('List Buckets', false, `Error listing buckets: ${error.message}`);
      return;
    }
    
    logResult('List Buckets', true, `Found ${buckets?.length || 0} buckets`);
    
    // Check for attachments bucket
    const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
    if (attachmentsBucket) {
      logResult('Attachments Bucket Exists', true, `Public: ${attachmentsBucket.public}, Size limit: ${attachmentsBucket.file_size_limit} bytes`);
      
      // Verify it's private
      if (attachmentsBucket.public === false) {
        logResult('Attachments Bucket Privacy', true, 'Correctly configured as private');
      } else {
        logResult('Attachments Bucket Privacy', false, 'Should be private but is public');
      }
    } else {
      logResult('Attachments Bucket Exists', false, 'Attachments bucket not found');
    }
    
    // Check for school-logos bucket
    const logosBucket = buckets?.find(b => b.id === 'school-logos');
    if (logosBucket) {
      logResult('School-Logos Bucket Exists', true, `Public: ${logosBucket.public}, Size limit: ${logosBucket.file_size_limit} bytes`);
      
      // Verify it's public
      if (logosBucket.public === true) {
        logResult('School-Logos Bucket Public', true, 'Correctly configured as public');
      } else {
        logResult('School-Logos Bucket Public', false, 'Should be public but is private');
      }
    } else {
      logResult('School-Logos Bucket Exists', false, 'School-logos bucket not found');
    }
    
  } catch (error) {
    logResult('Bucket Verification', false, `Exception: ${error}`);
  }
}

async function verifyFileUpload() {
  console.log('\n=== 2. Verifying File Upload (Service Role) ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Create a test file
    const testFileName = 'test_attachment.txt';
    const testFilePath = `attachments/test-school/test-notice/${Date.now()}_${testFileName}`;
    const testFileContent = Buffer.from('This is a test attachment file for Phase 5 verification');
    
    // Upload to attachments bucket
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(testFilePath, testFileContent, {
        contentType: 'text/plain',
        upsert: false,
      });
    
    if (error) {
      logResult('Upload File (Service Role)', false, `Error: ${error.message}`);
      return null;
    }
    
    logResult('Upload File (Service Role)', true, `Uploaded to: ${data.path}`);
    return testFilePath;
    
  } catch (error) {
    logResult('Upload File (Service Role)', false, `Exception: ${error}`);
    return null;
  }
}

async function verifyFileDownload(filePath: string | null) {
  console.log('\n=== 3. Verifying File Download ===\n');
  
  if (!filePath) {
    logResult('Download File', false, 'No file path provided (upload failed)');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Download the file
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(filePath);
    
    if (error) {
      logResult('Download File', false, `Error: ${error.message}`);
      return;
    }
    
    const fileSize = data?.size || 0;
    logResult('Download File', true, `Downloaded ${fileSize} bytes`);
    
  } catch (error) {
    logResult('Download File', false, `Exception: ${error}`);
  }
}

async function verifySignedURL(filePath: string | null) {
  console.log('\n=== 4. Verifying Signed URL Generation ===\n');
  
  if (!filePath) {
    logResult('Signed URL Generation', false, 'No file path provided (upload failed)');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Create signed URL (1 hour expiry)
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600);
    
    if (error) {
      logResult('Signed URL Generation', false, `Error: ${error.message}`);
      return;
    }
    
    if (data?.signedUrl) {
      logResult('Signed URL Generation', true, `URL: ${data.signedUrl.substring(0, 50)}...`);
    } else {
      logResult('Signed URL Generation', false, 'No signed URL returned');
    }
    
  } catch (error) {
    logResult('Signed URL Generation', false, `Exception: ${error}`);
  }
}

async function verifyFileList() {
  console.log('\n=== 5. Verifying File Listing ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // List files in attachments bucket
    const { data, error } = await supabase.storage
      .from('attachments')
      .list('attachments/test-school/test-notice', {
        limit: 100,
      });
    
    if (error) {
      logResult('List Files', false, `Error: ${error.message}`);
      return;
    }
    
    const fileCount = data?.length || 0;
    logResult('List Files', true, `Found ${fileCount} files in test directory`);
    
  } catch (error) {
    logResult('List Files', false, `Exception: ${error}`);
  }
}

async function verifyFileDelete(filePath: string | null) {
  console.log('\n=== 6. Verifying File Deletion ===\n');
  
  if (!filePath) {
    logResult('Delete File', false, 'No file path provided (upload failed)');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Delete the test file
    const { data, error } = await supabase.storage
      .from('attachments')
      .remove([filePath]);
    
    if (error) {
      logResult('Delete File', false, `Error: ${error.message}`);
      return;
    }
    
    logResult('Delete File', true, 'File deleted successfully');
    
  } catch (error) {
    logResult('Delete File', false, `Exception: ${error}`);
  }
}

async function verifyAccessControl() {
  console.log('\n=== 7. Verifying Access Control (RLS) ===\n');
  
  // Use anon key (unauthenticated user)
  const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Try to upload without authentication (should fail for attachments)
    const testFileName = 'unauthorized_test.txt';
    const testFilePath = `attachments/test-school/test-notice/${Date.now()}_${testFileName}`;
    const testFileContent = Buffer.from('This should fail');
    
    const { data, error } = await anonSupabase.storage
      .from('attachments')
      .upload(testFilePath, testFileContent, {
        contentType: 'text/plain',
        upsert: false,
      });
    
    if (error) {
      // Expected to fail
      logResult('RLS: Unauthorized Upload Blocked', true, `Correctly blocked: ${error.message}`);
    } else {
      // Should not succeed
      logResult('RLS: Unauthorized Upload Blocked', false, 'Upload succeeded but should have been blocked');
    }
    
  } catch (error) {
    logResult('RLS: Unauthorized Upload Blocked', true, `Correctly blocked with exception: ${error}`);
  }
  
  try {
    // Try to list buckets with anon key
    const { data: buckets, error } = await anonSupabase.storage.listBuckets();
    
    if (error) {
      logResult('RLS: Bucket Listing', false, `Error: ${error.message}`);
    } else {
      logResult('RLS: Bucket Listing', true, `Anon can list ${buckets?.length || 0} buckets (expected)`);
    }
    
  } catch (error) {
    logResult('RLS: Bucket Listing', false, `Exception: ${error}`);
  }
}

async function verifyPublicBucket() {
  console.log('\n=== 8. Verifying Public Bucket (School Logos) ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Upload a test logo
    const testLogoPath = `school_test_logo_${Date.now()}.txt`;
    const testLogoContent = Buffer.from('Test logo content');
    
    const { data, error } = await supabase.storage
      .from('school-logos')
      .upload(testLogoPath, testLogoContent, {
        contentType: 'text/plain',
        upsert: false,
      });
    
    if (error) {
      logResult('Public Bucket Upload', false, `Error: ${error.message}`);
      return null;
    }
    
    logResult('Public Bucket Upload', true, `Uploaded to: ${data.path}`);
    
    // Get public URL (should work since bucket is public)
    const { data: urlData } = supabase.storage
      .from('school-logos')
      .getPublicUrl(testLogoPath);
    
    if (urlData?.publicUrl) {
      logResult('Public URL Generation', true, `URL: ${urlData.publicUrl.substring(0, 50)}...`);
    } else {
      logResult('Public URL Generation', false, 'No public URL returned');
    }
    
    // Clean up
    await supabase.storage.from('school-logos').remove([testLogoPath]);
    
    return testLogoPath;
    
  } catch (error) {
    logResult('Public Bucket Upload', false, `Exception: ${error}`);
    return null;
  }
}

async function printSummary() {
  console.log('\n=== VERIFICATION SUMMARY ===\n');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ✅ ${passedTests}`);
  console.log(`Failed: ❌ ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

async function main() {
  console.log('='.repeat(60));
  console.log('PHASE 5: STORAGE MIGRATION VERIFICATION');
  console.log('='.repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  try {
    await verifyBuckets();
    const uploadedFilePath = await verifyFileUpload();
    await verifyFileDownload(uploadedFilePath);
    await verifySignedURL(uploadedFilePath);
    await verifyFileList();
    await verifyFileDelete(uploadedFilePath);
    await verifyAccessControl();
    await verifyPublicBucket();
    
    await printSummary();
    
  } catch (error) {
    console.error('\n❌ Fatal error during verification:', error);
    process.exit(1);
  }
}

main();
