// Service test setup for Firebase emulator connectivity
// Set environment variables for Firebase emulator connectivity
process.env.NODE_ENV = 'development';
process.env.USE_FIREBASE_EMULATORS = 'true';

// Import Firebase admin reset function for test isolation
const { resetAdminInstances } = require('./src/lib/firebase/admin-lazy');

// Setup and teardown hooks
beforeEach(() => {
  // Reset Firebase admin instances before each test for isolation
  resetAdminInstances();
});

afterEach(() => {
  // Clean up any remaining instances
  resetAdminInstances();
});

// Global test timeout for Firebase operations
jest.setTimeout(30000);