/**
 * Script to populate Firebase Remote Config with static school list
 * Run this after starting the Firebase emulators
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

admin.initializeApp({
  projectId: 'myschools-app-dev',
});

// Static schools configuration
const staticSchools = {
  schools: [
    {
      schoolId: 'test-school-123',
      schoolName: 'Test School (MySchoolWeb)',
      schoolAddress: '123 Test St, Test City, TC 12345',
      adapterType: 'myschoolweb',
      adapterSubType: 'myschoolweb_v1.0',
      portalBaseUrl: 'http://10.0.2.2:3000', // 10.0.2.2 is Android emulator host machine
      authenticationMethod: 'username_password',
      supportedFeatures: ['notices', 'attachments'],
      minimumAppVersion: '0.1.0',
    },
    {
      schoolId: 'school_001',
      schoolName: 'Springfield Elementary School',
      schoolAddress: '123 Main St, Springfield, SP 12345',
      adapterType: 'mock',
      adapterSubType: 'mock_school_v1.0',
      portalBaseUrl: 'https://springfield-elementary.school-portal.com',
      authenticationMethod: 'username_password',
      supportedFeatures: ['notices'],
      minimumAppVersion: '0.1.0',
    },
    {
      schoolId: 'school_002',
      schoolName: 'Riverside High School',
      schoolAddress: '456 River Rd, Riverside, RS 67890',
      adapterType: 'mock',
      adapterSubType: 'mock_school_v1.0',
      portalBaseUrl: 'https://riverside-high.edu-portal.net',
      authenticationMethod: 'username_password',
      supportedFeatures: ['notices'],
      minimumAppVersion: '0.1.0',
    },
  ],
};

async function setupRemoteConfig() {
  try {
    console.log('📝 Setting up Remote Config for Firebase Emulator...');
    
    // Note: Firebase Admin SDK doesn't support Remote Config for emulators
    // We'll use the REST API instead
    const fetch = (await import('node-fetch')).default;
    
    const remoteConfigData = {
      parameters: {
        static_schools: {
          defaultValue: {
            value: JSON.stringify(staticSchools),
          },
          valueType: 'STRING',
          description: 'Static school configuration list for MySchools App',
        },
      },
      version: {
        versionNumber: '1',
        updateTime: new Date().toISOString(),
        updateUser: {
          email: 'admin@myschoolsapp.com',
        },
        description: 'Initial Remote Config setup with MySchoolWeb test school',
      },
    };

    // Remote Config emulator endpoint
    const url = 'http://127.0.0.1:4400/emulators/v1/projects/myschools-app-dev/remoteConfig';
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(remoteConfigData),
    });

    if (response.ok) {
      console.log('✅ Remote Config successfully populated!');
      console.log('📱 Schools available:');
      staticSchools.schools.forEach((school) => {
        console.log(`   - ${school.schoolName} (${school.schoolId})`);
      });
      console.log('\n🎉 You can now search for schools in the Flutter app!');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to setup Remote Config:', response.status, errorText);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error setting up Remote Config:', error);
    process.exit(1);
  }
}

// Run the setup
setupRemoteConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
