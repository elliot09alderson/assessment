import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.MONGODB_URI = 'mongodb://localhost:27017/fasttrack_test';
process.env.CARRIER_API_BASE_URL = 'http://localhost:3001';
process.env.LOG_LEVEL = 'error';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
