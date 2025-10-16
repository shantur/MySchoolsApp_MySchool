// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Enable fetch mocking
require('jest-fetch-mock').enableMocks()

// Mock next/server for all tests
jest.mock('next/server', () => require('./src/__mocks__/next-server'));

// Firebase Client SDK has been removed during migration to Supabase
// No mock needed as it's no longer used in the codebase
