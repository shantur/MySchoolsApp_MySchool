// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Enable fetch mocking
require('jest-fetch-mock').enableMocks()

// Mock next/server for all tests
jest.mock('next/server', () => require('./src/__mocks__/next-server'));

// Mock Firebase Client SDK for all tests
jest.mock('@/lib/firebase/client', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
  },
  db: {},
  storage: {},
}));
