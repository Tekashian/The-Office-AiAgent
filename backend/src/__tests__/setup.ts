/**
 * Test Setup
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs in tests

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.AI_API_KEY = 'test-ai-key';
process.env.AI_API_URL = 'https://test-ai-api.com/v1/models/gemini-2.5-flash:generateContent';
process.env.AI_MODEL = 'gemini-2.5-flash';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.PORT = '3001';
process.env.CORS_ORIGINS = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(10000);

// Suppress console.error during tests (expected errors in error handler tests)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('Authentication error') ||
      args[0]?.includes?.('CRITICAL ERROR') ||
      args[0]?.includes?.('Optional auth error') ||
      args[0]?.includes?.('Error Details')
    ) {
      return; // Suppress expected test errors
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise((resolve) => setTimeout(resolve, 500));
});
