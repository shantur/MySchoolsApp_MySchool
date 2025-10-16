const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Set environment variables for Firebase emulator and Supabase local connectivity
  testEnvironmentOptions: {
    NODE_ENV: 'development',
    USE_FIREBASE_EMULATORS: 'true',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  },
  // setupFiles removed - jest.setup.js should only be in setupFilesAfterEnv
  // This fixes "ReferenceError: expect is not defined" error
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'middleware.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    'src/app/**/[*]__tests__/**/*.(test|spec).(ts|tsx|js)',
    'src/app/**/[*]/**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/functions/',
    '/.next/',
    '/tests/',
    '/src/app/api/', // Exclude API routes - they use jest.api.config.js
    '\\.disabled\\.',  // Exclude disabled tests
  ],
  modulePathIgnorePatterns: ['/functions/', '/.next/'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose)/)',
  ],
  // Test timeout settings
  testTimeout: 10000, // 10 seconds per test
  // Detect open handles to help identify what's causing hangs
  detectOpenHandles: false, // Set to false to prevent hanging on detection
  // Force exit after tests complete
  bail: false,
  maxWorkers: 1, // Run tests serially to avoid resource conflicts
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
