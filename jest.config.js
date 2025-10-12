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
  // Set environment variables for Firebase emulator connectivity
  testEnvironmentOptions: {
    NODE_ENV: 'development',
    USE_FIREBASE_EMULATORS: 'true',
  },
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
  testPathIgnorePatterns: ['/node_modules/', '/functions/', '/.next/', '/tests/'],
  modulePathIgnorePatterns: ['/functions/', '/.next/'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
