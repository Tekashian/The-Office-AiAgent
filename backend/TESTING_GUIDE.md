# Testing Guide

## Overview
This project now includes comprehensive test coverage for critical components using **Jest** and **Supertest**.

## Test Structure

```
backend/src/__tests__/
├── setup.ts                          # Global test configuration
├── middleware/
│   ├── auth.test.ts                  # Authentication middleware tests
│   └── errorHandler.test.ts          # Error handling tests
├── services/
│   └── aiService.test.ts             # AI service tests
└── utils/
    ├── encryption.test.ts            # Encryption utilities tests
    └── errors.test.ts                # Error classes tests
```

## Running Tests

### Install Dependencies
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (for development)
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Tests with Verbose Output
```bash
npm run test:verbose
```

## Test Coverage

### ✅ Implemented Tests

#### 1. **Utils - Error Classes** (`errors.test.ts`)
- ValidationError (400)
- AuthenticationError (401)
- AuthorizationError (403)
- NotFoundError (404)
- ConflictError (409)
- RateLimitError (429)
- ExternalServiceError (502)
- InternalServerError (500)
- Error inheritance and stack traces

#### 2. **Utils - Encryption** (`encryption.test.ts`)
- Encryption of sensitive data
- Decryption of encrypted data
- IV randomization (different output for same input)
- Encryption key validation
- Special characters handling
- Unicode support
- Long string handling
- Tamper detection

#### 3. **Middleware - Auth** (`auth.test.ts`)
- Valid token authentication
- Missing authorization header
- Invalid token format
- Expired token handling
- Supabase connection errors
- Optional authentication (non-blocking)
- User ID and email attachment to request

#### 4. **Middleware - Error Handler** (`errorHandler.test.ts`)
- Custom error handling for all error types
- HTTP status code mapping
- Error message formatting
- Development vs production error details
- Unknown error handling

#### 5. **Services - AI Service** (`aiService.test.ts`)
- Successful API calls to Gemini AI
- User context injection
- Safety filter blocking
- Empty response handling
- Authentication errors (401, 403)
- Rate limiting (429)
- Validation errors (400)
- Custom temperature and maxTokens
- Helper methods: generateText(), processTask(), analyzeText()

## Test Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Services | 80%+ | ✅ AIService covered |
| Middleware | 90%+ | ✅ Auth & ErrorHandler covered |
| Utils | 85%+ | ✅ Errors & Encryption covered |
| Routes | 70%+ | ⏳ Next priority |

## Writing New Tests

### Example: Testing a New Service

```typescript
import myService from '../../services/myService';

// Mock dependencies
jest.mock('../../services/dependency');

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something correctly', async () => {
    // Arrange
    const input = 'test-data';
    
    // Act
    const result = await myService.doSomething(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result).toBe('expected-output');
  });
});
```

### Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Mock External Dependencies**: Use `jest.mock()` for Supabase, axios, etc.
3. **Clear Test Names**: Use descriptive test names that explain the scenario
4. **Test Edge Cases**: Cover error scenarios, empty inputs, boundary conditions
5. **Clean Up**: Use `beforeEach` and `afterEach` to reset state
6. **Avoid Test Interdependence**: Each test should run independently

## Continuous Integration (TODO)

Currently, tests are run **manually**. For production deployment, consider:

1. **GitHub Actions**: Automated test runs on every push/PR
2. **Pre-commit Hooks**: Run tests before committing code
3. **Coverage Thresholds**: Enforce minimum coverage levels
4. **Test Reports**: Generate and store test reports

## Next Steps

### Priority 1: Route Integration Tests
- Test API endpoints with supertest
- Mock Supabase database calls
- Test authentication flows
- Test request/response validation

### Priority 2: Service Tests
- AgentOrchestrator (tool selection, email sending)
- CronService (job scheduling)
- ScraperService (web scraping)
- PDFService (document generation)

### Priority 3: End-to-End Tests
- Full user workflows
- Database integration
- External API integration

## Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   npm install
   ```

2. **Timeout errors**
   ```typescript
   // Increase timeout in individual test
   it('slow test', async () => {
     // ...
   }, 15000); // 15 seconds
   ```

3. **Mock not working**
   ```typescript
   // Ensure mock is before import
   jest.mock('../../services/dependency');
   import myService from '../../services/myService';
   ```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
