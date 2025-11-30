# BAGBOT Testing Guide

Complete guide for running all tests in the BAGBOT trading bot project.

## Table of Contents
- [Overview](#overview)
- [Frontend Tests](#frontend-tests)
- [API Contract Tests](#api-contract-tests)
- [Running Tests Locally](#running-tests-locally)
- [Running Tests in CI](#running-tests-in-ci)
- [Running Tests on Render](#running-tests-on-render)
- [Troubleshooting](#troubleshooting)

## Overview

The BAGBOT project includes multiple testing layers:

1. **Unit Tests** - Component-level tests with Jest and React Testing Library
2. **Integration Tests** - Page-level tests with mocked API responses
3. **API Contract Tests** - Validation that backend matches API contracts
4. **E2E Tests** - End-to-end user flow tests with Playwright (planned)

## Frontend Tests

### Setup

Frontend tests use:
- **Jest** - Test runner
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers

### Running Tests

```bash
cd bagbot/frontend

# Run tests in watch mode (for development)
npm test

# Run tests once (for CI)
npm run test:ci

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
frontend/
├── __tests__/          # Integration tests for pages
├── components/
│   └── __tests__/      # Unit tests for components
└── utils/
    └── test-utils.tsx  # Shared test utilities
```

### Writing Component Tests

Example test for a button component:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyButton from '../MyButton';

describe('MyButton', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<MyButton onClick={handleClick}>Click Me</MyButton>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<MyButton loading>Submit</MyButton>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Mocking API Calls

Use the utilities in `utils/test-utils.tsx`:

```typescript
import { createMockApiService } from '@/utils/test-utils';

// Mock successful API response
const mockApi = createMockApiService({
  getWorkerStatus: jest.fn().mockResolvedValue({
    data: { status: 'running' }
  })
});

// Mock API error
const mockApi = createMockApiService({
  getWorkerStatus: jest.fn().mockRejectedValue(
    new Error('Network error')
  )
});
```

## API Contract Tests

### Purpose

API contract tests validate that the backend API responses match the contracts defined in `docs/api_contracts.json`.

### Running Contract Tests

```bash
# Test against production
python scripts/check_api_contracts.py

# Test against local backend
python scripts/check_api_contracts.py --url http://localhost:8000

# Test with custom contracts file
python scripts/check_api_contracts.py --contracts path/to/contracts.json
```

### Contract Test Output

```
🔍 Testing API Contracts
Base URL: https://bagbot2-backend.onrender.com

✅ PASS: Root health check
✅ PASS: API health check
✅ PASS: Get worker status
❌ FAIL: Get recent trades (planned endpoint)
   Error: Status code mismatch: expected 200, got 404

==================================================
Summary:
  Passed: 3/4
  Failed: 1/4
==================================================
```

### Contract File Structure

The `docs/api_contracts.json` file uses OpenAPI 3.0 format:

```json
{
  "paths": {
    "/api/health": {
      "get": {
        "summary": "API health check",
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" }
                  },
                  "required": ["status"]
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Running Tests Locally

### Prerequisites

1. **Frontend tests:**
   ```bash
   cd bagbot/frontend
   npm install
   ```

2. **API contract tests:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install requests
   ```

### Full Test Suite

Run all tests locally:

```bash
# 1. Frontend unit tests
cd bagbot/frontend
npm run test:ci

# 2. Lint frontend code
npm run lint

# 3. API contract tests (requires backend running)
cd ../..
python scripts/check_api_contracts.py --url http://localhost:8000
```

### Starting Local Backend

To run contract tests against local backend:

```bash
# Terminal 1: Start backend
cd bagbot
source .venv/bin/activate
cd bagbot
uvicorn backend.main:app --reload

# Terminal 2: Run contract tests
python scripts/check_api_contracts.py --url http://localhost:8000
```

## Running Tests in CI

### GitHub Actions (if configured)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd bagbot/frontend
          npm ci
      - name: Run tests
        run: |
          cd bagbot/frontend
          npm run test:ci
      - name: Run lint
        run: |
          cd bagbot/frontend
          npm run lint

  api-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests
      - name: Run contract tests
        run: python scripts/check_api_contracts.py
```

## Running Tests on Render

### Via Render Shell

Access the Render shell for your service:

1. Go to Render Dashboard → Select your service
2. Click "Shell" tab
3. Run tests:

```bash
# Frontend tests (in frontend service)
cd bagbot/frontend
npm run test:ci

# API contract tests (in backend service)
python3 /opt/render/project/src/scripts/check_api_contracts.py --url http://localhost:8000
```

### As Build Command

Add to `render.yaml`:

```yaml
services:
  - type: web
    name: bagbot-frontend
    env: node
    buildCommand: |
      cd bagbot/frontend
      npm install
      npm run test:ci
      npm run lint
      npm run build
    startCommand: npm run start
```

### Post-Deploy Hook

Run tests after deployment:

```yaml
services:
  - type: web
    name: bagbot-backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    # Run contract tests after deploy
    preDeployCommand: |
      python3 scripts/check_api_contracts.py --url https://bagbot2-backend.onrender.com || true
```

## Troubleshooting

### Frontend Tests

**Issue:** `Cannot find module '@/utils/api'`

**Solution:**
- Check `tsconfig.json` has correct path mappings
- Check `jest.config.ts` has matching `moduleNameMapper`
- Try clearing Jest cache: `npx jest --clearCache`

**Issue:** `ReferenceError: fetch is not defined`

**Solution:**
Add to `jest.setup.ts`:
```typescript
import fetch from 'node-fetch';
global.fetch = fetch as any;
```

**Issue:** Tests fail with "Not implemented: HTMLFormElement.prototype.submit"

**Solution:**
This is a jsdom limitation. Mock the form submission in your test:
```typescript
HTMLFormElement.prototype.submit = jest.fn();
```

### API Contract Tests

**Issue:** `Connection refused` when testing locally

**Solution:**
- Ensure backend is running: `uvicorn backend.main:app`
- Check the correct port (default: 8000)
- Use correct URL: `--url http://localhost:8000`

**Issue:** SSL certificate verification fails

**Solution:**
```bash
# Option 1: Update certificates
pip install --upgrade certifi

# Option 2: Disable SSL verification (not recommended for production)
# Modify script to add: requests.get(..., verify=False)
```

**Issue:** Tests pass locally but fail in CI

**Solution:**
- Check environment variables are set in CI
- Ensure backend is accessible from CI environment
- Check for timing issues (add retries/waits)
- Verify Python/Node versions match

### General Tips

1. **Run tests before committing:**
   ```bash
   npm run test:ci && npm run lint
   ```

2. **Debug failing tests:**
   ```bash
   # Frontend: run specific test file
   npm test -- StatusTile.test.tsx
   
   # Frontend: run with verbose output
   npm test -- --verbose
   ```

3. **Update snapshots:**
   ```bash
   npm test -- -u
   ```

4. **Check coverage:**
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

## Test Coverage Goals

- **Components:** >80% coverage
- **Utils:** >90% coverage
- **Pages:** >70% coverage
- **API Contracts:** 100% of implemented endpoints

## Best Practices

1. **Write tests first** (TDD approach)
2. **Test user behavior**, not implementation details
3. **Mock external dependencies** (API calls, timers, etc.)
4. **Use descriptive test names** that explain what is being tested
5. **Keep tests fast** - mock slow operations
6. **Test error cases** as well as happy paths
7. **Update contracts** when API changes
8. **Run tests locally** before pushing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [OpenAPI Specification](https://swagger.io/specification/)

## Support

For issues or questions:
1. Check this README first
2. Review test output for specific errors
3. Check the [project issues](https://github.com/sxygnfdq46-cell/BAGBOT2/issues)
4. Contact the development team
