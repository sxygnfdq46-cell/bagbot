# 🚀 Pre-Launch Testing Suite

## Overview

The `run_full_prelaunch_checks.sh` script provides comprehensive testing and validation for "The Bag Bot" project before production deployment. It runs a complete suite of tests including unit tests, linting, security scans, integration tests, and more.

## Quick Start

```bash
# Make script executable
chmod +x scripts/run_full_prelaunch_checks.sh

# Run all pre-launch checks
./scripts/run_full_prelaunch_checks.sh
```

## What It Tests

### ✅ Required Tests (Must Pass)
- **Unit Tests**: pytest test suite
- **Code Linting**: flake8 style checks
- **Type Checking**: mypy static analysis
- **Code Formatting**: black and isort validation
- **Backend Integration**: FastAPI server startup and basic endpoints

### 🔄 Optional Tests (Warnings Only)
- **Coverage Analysis**: Code coverage reporting
- **Frontend Build**: React/UI build process
- **E2E Tests**: Playwright browser automation
- **ML Backtest**: Model validation with historical data
- **Executor Tests**: Trading bot dry-run validation
- **Performance**: Lighthouse audit (if available)
- **Security**: Bandit security scan and secret detection

## Exit Codes

- **0**: All required tests passed (optional tests may warn)
- **1**: One or more required tests failed

## Output Files

All test artifacts are saved to `reports/prelaunch_*`:

```
reports/
├── prelaunch_pytest.log          # Unit test results
├── prelaunch_coverage.log        # Coverage analysis
├── prelaunch_coverage_summary.txt # Coverage percentage
├── prelaunch_flake8.log          # Linting results
├── prelaunch_mypy.log            # Type checking results
├── prelaunch_black.log           # Code formatting check
├── prelaunch_isort.log           # Import sorting check
├── prelaunch_npm_ci.log          # Frontend dependency install
├── prelaunch_npm_build.log       # Frontend build
├── prelaunch_uvicorn.log         # Backend server logs
├── prelaunch_health.json         # Health endpoint response
├── prelaunch_root.json           # Root endpoint response
├── prelaunch_protected.json      # Auth test response
├── prelaunch_playwright.log      # E2E test results
├── prelaunch_backtest.log        # ML backtest results
├── prelaunch_executor.log        # Executor dry-run results
├── prelaunch_lighthouse.log      # Performance audit
├── prelaunch_bandit.json         # Security scan results
├── prelaunch_secrets.txt         # Found potential secrets
├── coverage_html/                # HTML coverage report
├── playwright/                   # E2E test artifacts
└── lighthouse/                   # Performance reports
```

## Prerequisites

### Required
- Python virtual environment (`.venv`)
- pytest for unit testing
- Backend application (`backend/app.py` or `backend/app_integrated.py`)

### Optional (will skip if missing)
- `flake8` - Code linting
- `mypy` - Type checking
- `black` - Code formatting
- `isort` - Import sorting
- `ui/` directory with `package.json` - Frontend
- `npx` and `playwright` - E2E testing
- `scripts/ml_backtest.py` and model files - ML validation
- `scripts/executor.py` - Trading executor testing
- `lhci` - Lighthouse performance auditing
- `bandit` - Security scanning

## Installing Missing Tools

```bash
# Python tools
pip install pytest pytest-cov flake8 mypy black isort bandit

# Frontend tools (if using UI)
cd ui && npm install
npx playwright install

# Lighthouse CI
npm install -g @lhci/cli
```

## Interpreting Results

### 🟢 Green (✅) - Tests Passed
Everything working correctly, no action needed.

### 🔴 Red (❌) - Tests Failed
Critical issues that must be fixed before deployment:
- Unit tests failing
- Linting errors
- Type errors
- Formatting issues
- Backend startup failures

### 🟡 Yellow (⚠️) - Warnings
Issues that should be addressed but won't block deployment:
- Low code coverage
- Performance concerns
- Security warnings
- Missing optional components

### ⏭️ Skipped Tests
Components not available in current setup:
- Missing dependencies
- Optional tools not installed
- Required files not present

## Customization

Edit the script variables to customize behavior:

```bash
# In run_full_prelaunch_checks.sh

# Timeouts
BACKEND_WAIT_SECONDS=20

# Coverage thresholds
MIN_COVERAGE=80

# Lint configuration
FLAKE8_MAX_LINE_LENGTH=120
FLAKE8_IGNORE="E203,W503"

# Playwright browsers
PLAYWRIGHT_BROWSERS="chromium firefox webkit"
```

## CI/CD Integration

The script is designed to work in CI/CD pipelines. See `.github/workflows/prelaunch.yml` for GitHub Actions integration.

## Troubleshooting

### Backend Won't Start
- Check `reports/prelaunch_uvicorn.log` for startup errors
- Verify dependencies are installed
- Ensure port 8000 is available

### Frontend Build Fails
- Check `reports/prelaunch_npm_build.log`
- Run `cd ui && npm install` manually
- Verify Node.js version compatibility

### Tests Fail
- Check individual log files in `reports/`
- Run specific test commands manually for debugging
- Verify all dependencies are installed in virtual environment

### Performance Issues
- Script may take 5-10 minutes depending on test suite size
- Use `--parallel` flags where available
- Consider running subsets during development

## Support

For issues with the pre-launch suite:

1. Check individual log files in `reports/`
2. Run failing commands manually for detailed debugging
3. Verify all prerequisites are installed
4. Review project documentation for specific component requirements