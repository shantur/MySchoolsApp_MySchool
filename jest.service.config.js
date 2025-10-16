const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'service-tests',
  setupFilesAfterEnv: ['<rootDir>/jest.supabase.setup.js'],
  testEnvironment: 'node', // Use node environment for service tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Set environment variables for Supabase local connectivity
  testEnvironmentOptions: {
    NODE_ENV: 'development',
  },
  collectCoverageFrom: [
    'src/lib/services/**/*.{js,jsx,ts,tsx}',
    'src/lib/auth/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: [
    'src/lib/services/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    'src/lib/services/**/*.(test|spec).(ts|tsx|js)',
    'src/lib/auth/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    'src/lib/auth/**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/functions/',
    '/.next/',
    '/tests/',
  ],
  modulePathIgnorePatterns: ['/functions/', '/.next/'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
