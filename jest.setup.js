// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Enable fetch mocking
require('jest-fetch-mock').enableMocks()

// Mock Firebase Client SDK for all tests
jest.mock('@/lib/firebase/client', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
  },
  db: {},
  storage: {},
}));
