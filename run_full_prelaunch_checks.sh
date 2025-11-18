#!/usr/bin/env bash
# The Bag Bot - Complete Pre-Launch Testing Suite
# Comprehensive testing pipeline for production readiness validation
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/reports"
UVICORN_PID=""
EXIT_CODE=0
TEST_RESULTS=()

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
    if [[ -n "$UVICORN_PID" ]] && kill -0 "$UVICORN_PID" 2>/dev/null; then
        echo "Stopping uvicorn server (PID: $UVICORN_PID)"
        kill "$UVICORN_PID" || true
        sleep 2
        kill -9 "$UVICORN_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Logging function
log_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅ $test_name: $message${NC}"
        TEST_RESULTS+=("✅ $test_name: PASSED")
    elif [[ "$status" == "FAIL" ]]; then
        echo -e "${RED}❌ $test_name: $message${NC}"
        TEST_RESULTS+=("❌ $test_name: FAILED - $message")
        EXIT_CODE=1
    elif [[ "$status" == "WARN" ]]; then
        echo -e "${YELLOW}⚠️ $test_name: $message${NC}"
        TEST_RESULTS+=("⚠️ $test_name: WARNING - $message")
    elif [[ "$status" == "SKIP" ]]; then
        echo -e "${YELLOW}⏭️ $test_name: $message${NC}"
        TEST_RESULTS+=("⏭️ $test_name: SKIPPED - $message")
    fi
}

# Initialize
echo -e "${BLUE}🎯 The Bag Bot - Pre-Launch Testing Suite${NC}"
echo -e "${BLUE}=================================================${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "Reports Dir: $REPORTS_DIR"
echo "Start Time: $(date)"
echo ""

# Create reports directory
mkdir -p "$REPORTS_DIR"
cd "$PROJECT_ROOT"

# 1. Activate virtual environment (non-fatal)
echo -e "${BLUE}1️⃣ Activating Python Virtual Environment${NC}"
if [[ -f ".venv/bin/activate" ]]; then
    source ".venv/bin/activate"
    log_result "Virtual Environment" "PASS" "Activated .venv"
else
    log_result "Virtual Environment" "WARN" "No .venv found, using system Python"
fi

# 2. Unit Tests with pytest
echo -e "\n${BLUE}2️⃣ Running Unit Tests${NC}"
if command -v pytest >/dev/null 2>&1; then
    if pytest tests/ -v --tb=short > "$REPORTS_DIR/prelaunch_pytest.log" 2>&1; then
        log_result "Unit Tests" "PASS" "All tests passed"
    else
        log_result "Unit Tests" "FAIL" "Some tests failed - check $REPORTS_DIR/prelaunch_pytest.log"
    fi
else
    log_result "Unit Tests" "FAIL" "pytest not installed"
fi

# 3. Coverage Analysis
echo -e "\n${BLUE}3️⃣ Running Coverage Analysis${NC}"
if command -v pytest >/dev/null 2>&1; then
    if pytest --cov=src --cov-report=term --cov-report=html:"$REPORTS_DIR/coverage_html" > "$REPORTS_DIR/prelaunch_coverage.log" 2>&1; then
        # Extract coverage percentage
        COVERAGE=$(grep "TOTAL" "$REPORTS_DIR/prelaunch_coverage.log" | awk '{print $NF}' || echo "Unknown")
        echo "Coverage Report: $COVERAGE" > "$REPORTS_DIR/prelaunch_coverage_summary.txt"
        log_result "Coverage Analysis" "PASS" "Coverage: $COVERAGE"
    else
        log_result "Coverage Analysis" "WARN" "Coverage analysis failed - check $REPORTS_DIR/prelaunch_coverage.log"
    fi
else
    log_result "Coverage Analysis" "SKIP" "pytest not available"
fi

# 4. Code Linting with flake8
echo -e "\n${BLUE}4️⃣ Running Code Linting (flake8)${NC}"
if command -v flake8 >/dev/null 2>&1; then
    if flake8 src/ backend/ --max-line-length=120 --ignore=E203,W503 > "$REPORTS_DIR/prelaunch_flake8.log" 2>&1; then
        log_result "Code Linting" "PASS" "No linting errors"
    else
        log_result "Code Linting" "FAIL" "Linting errors found - check $REPORTS_DIR/prelaunch_flake8.log"
    fi
else
    log_result "Code Linting" "SKIP" "flake8 not installed"
fi

# 5. Type Checking with mypy
echo -e "\n${BLUE}5️⃣ Running Type Checking (mypy)${NC}"
if command -v mypy >/dev/null 2>&1; then
    if mypy src/ --ignore-missing-imports --no-strict-optional > "$REPORTS_DIR/prelaunch_mypy.log" 2>&1; then
        log_result "Type Checking" "PASS" "No type errors"
    else
        log_result "Type Checking" "FAIL" "Type errors found - check $REPORTS_DIR/prelaunch_mypy.log"
    fi
else
    log_result "Type Checking" "SKIP" "mypy not installed"
fi

# 6. Code Formatting Checks
echo -e "\n${BLUE}6️⃣ Checking Code Formatting${NC}"
FORMATTING_OK=true

if command -v black >/dev/null 2>&1; then
    if black --check --diff src/ backend/ > "$REPORTS_DIR/prelaunch_black.log" 2>&1; then
        log_result "Black Formatting" "PASS" "Code is properly formatted"
    else
        log_result "Black Formatting" "FAIL" "Code needs formatting - check $REPORTS_DIR/prelaunch_black.log"
        FORMATTING_OK=false
    fi
else
    log_result "Black Formatting" "SKIP" "black not installed"
fi

if command -v isort >/dev/null 2>&1; then
    if isort --check-only --diff src/ backend/ > "$REPORTS_DIR/prelaunch_isort.log" 2>&1; then
        log_result "Import Sorting" "PASS" "Imports are properly sorted"
    else
        log_result "Import Sorting" "FAIL" "Imports need sorting - check $REPORTS_DIR/prelaunch_isort.log"
        FORMATTING_OK=false
    fi
else
    log_result "Import Sorting" "SKIP" "isort not installed"
fi

if [[ "$FORMATTING_OK" == "false" ]]; then
    EXIT_CODE=1
fi

# 7. Frontend Build
echo -e "\n${BLUE}7️⃣ Building Frontend${NC}"
if [[ -d "ui" ]] && [[ -f "ui/package.json" ]]; then
    cd ui
    if npm ci > "$REPORTS_DIR/prelaunch_npm_ci.log" 2>&1; then
        if npm run build > "$REPORTS_DIR/prelaunch_npm_build.log" 2>&1; then
            log_result "Frontend Build" "PASS" "Build completed successfully"
        else
            log_result "Frontend Build" "FAIL" "Build failed - check $REPORTS_DIR/prelaunch_npm_build.log"
        fi
    else
        log_result "Frontend Build" "FAIL" "npm ci failed - check $REPORTS_DIR/prelaunch_npm_ci.log"
    fi
    cd "$PROJECT_ROOT"
else
    log_result "Frontend Build" "SKIP" "No ui directory or package.json found"
fi

# 8. Backend Integration Tests
echo -e "\n${BLUE}8️⃣ Starting Backend and Running Integration Tests${NC}"

# Start backend
if [[ -f "backend/app_integrated.py" ]]; then
    APP_MODULE="backend.app_integrated:app"
elif [[ -f "backend/app.py" ]]; then
    APP_MODULE="backend.app:app"
else
    log_result "Backend Start" "FAIL" "No backend app found"
    APP_MODULE=""
fi

if [[ -n "$APP_MODULE" ]]; then
    echo "Starting uvicorn server..."
    uvicorn "$APP_MODULE" --host 127.0.0.1 --port 8000 > "$REPORTS_DIR/prelaunch_uvicorn.log" 2>&1 &
    UVICORN_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend to start (PID: $UVICORN_PID)..."
    WAIT_COUNT=0
    BACKEND_READY=false
    
    while [[ $WAIT_COUNT -lt 20 ]]; do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            BACKEND_READY=true
            break
        fi
        sleep 1
        ((WAIT_COUNT++))
        echo -n "."
    done
    echo ""
    
    if [[ "$BACKEND_READY" == "true" ]]; then
        log_result "Backend Start" "PASS" "Server started successfully"
        
        # Run integration tests
        echo "Running integration tests..."
        
        # Test health endpoint
        if curl -s http://localhost:8000/health -o "$REPORTS_DIR/prelaunch_health.json"; then
            log_result "Health Endpoint" "PASS" "Health check successful"
        else
            log_result "Health Endpoint" "FAIL" "Health endpoint failed"
        fi
        
        # Test root endpoint  
        if curl -s http://localhost:8000/ -o "$REPORTS_DIR/prelaunch_root.json"; then
            log_result "Root Endpoint" "PASS" "Root endpoint accessible"
        else
            log_result "Root Endpoint" "FAIL" "Root endpoint failed"
        fi
        
        # Test protected endpoint (should fail without auth)
        HTTP_CODE=$(curl -s -w "%{http_code}" http://localhost:8000/me -o "$REPORTS_DIR/prelaunch_protected.json")
        if [[ "$HTTP_CODE" == "401" ]]; then
            log_result "Protected Endpoint" "PASS" "Correctly returns 401 unauthorized"
        else
            log_result "Protected Endpoint" "WARN" "Expected 401, got $HTTP_CODE"
        fi
        
    else
        log_result "Backend Start" "FAIL" "Server failed to start within 20 seconds"
    fi
fi

# 9. Playwright E2E Tests
echo -e "\n${BLUE}9️⃣ Running Playwright E2E Tests${NC}"
if [[ -d "ui" ]] && [[ "$BACKEND_READY" == "true" ]]; then
    cd ui
    
    # Install playwright if missing
    if ! command -v npx >/dev/null 2>&1; then
        log_result "Playwright E2E" "SKIP" "npx not available"
    else
        # Check if playwright is installed
        if ! npx playwright --version >/dev/null 2>&1; then
            echo "Installing Playwright..."
            npx playwright install > "$REPORTS_DIR/prelaunch_playwright_install.log" 2>&1 || true
        fi
        
        # Run tests if they exist
        if [[ -f "tests/playwright.spec.ts" ]]; then
            mkdir -p "$REPORTS_DIR/playwright"
            if npx playwright test --reporter=html --output-dir="$REPORTS_DIR/playwright" > "$REPORTS_DIR/prelaunch_playwright.log" 2>&1; then
                log_result "Playwright E2E" "PASS" "E2E tests passed"
            else
                log_result "Playwright E2E" "FAIL" "E2E tests failed - check $REPORTS_DIR/prelaunch_playwright.log"
            fi
        else
            log_result "Playwright E2E" "SKIP" "No Playwright tests found"
        fi
    fi
    cd "$PROJECT_ROOT"
else
    log_result "Playwright E2E" "SKIP" "UI not available or backend not running"
fi

# 10. ML Backtest Dry Run
echo -e "\n${BLUE}🔟 Running ML Backtest Dry Run${NC}"
if [[ -f "scripts/ml_backtest.py" ]] && [[ -f "reports/run_seq/model.joblib" ]] && [[ -f "data/all_daily.parquet" ]]; then
    if python3 scripts/ml_backtest.py --model reports/run_seq/model.joblib --data data/all_daily.parquet --out "$REPORTS_DIR/prelaunch_backtest" > "$REPORTS_DIR/prelaunch_backtest.log" 2>&1; then
        log_result "ML Backtest" "PASS" "Backtest completed successfully"
    else
        log_result "ML Backtest" "FAIL" "Backtest failed - check $REPORTS_DIR/prelaunch_backtest.log"
    fi
else
    MISSING_ITEMS=()
    [[ ! -f "scripts/ml_backtest.py" ]] && MISSING_ITEMS+=("ml_backtest.py")
    [[ ! -f "reports/run_seq/model.joblib" ]] && MISSING_ITEMS+=("model.joblib")
    [[ ! -f "data/all_daily.parquet" ]] && MISSING_ITEMS+=("data file")
    log_result "ML Backtest" "SKIP" "Missing: ${MISSING_ITEMS[*]}"
fi

# 11. Executor Dry Run
echo -e "\n${BLUE}1️⃣1️⃣ Running Executor Dry Run${NC}"
if [[ -f "scripts/executor.py" ]] && [[ -f "reports/run_seq/model.joblib" ]]; then
    if python3 scripts/executor.py --model reports/run_seq/model.joblib --mode dryrun --max-cycles 5 --out "$REPORTS_DIR/prelaunch_executor" > "$REPORTS_DIR/prelaunch_executor.log" 2>&1; then
        log_result "Executor Dry Run" "PASS" "Executor test completed"
    else
        log_result "Executor Dry Run" "FAIL" "Executor test failed - check $REPORTS_DIR/prelaunch_executor.log"
    fi
else
    MISSING_ITEMS=()
    [[ ! -f "scripts/executor.py" ]] && MISSING_ITEMS+=("executor.py")
    [[ ! -f "reports/run_seq/model.joblib" ]] && MISSING_ITEMS+=("model.joblib")
    log_result "Executor Dry Run" "SKIP" "Missing: ${MISSING_ITEMS[*]}"
fi

# 12. Lighthouse Performance Testing
echo -e "\n${BLUE}1️⃣2️⃣ Running Lighthouse Performance Tests${NC}"
if command -v lhci >/dev/null 2>&1 && [[ "$BACKEND_READY" == "true" ]] && [[ -d "ui" ]]; then
    if lhci autorun --collect.url="http://localhost:3000" --upload.target=filesystem --upload.outputDir="$REPORTS_DIR/lighthouse" > "$REPORTS_DIR/prelaunch_lighthouse.log" 2>&1; then
        log_result "Lighthouse" "PASS" "Performance audit completed"
    else
        log_result "Lighthouse" "WARN" "Lighthouse audit failed - check $REPORTS_DIR/prelaunch_lighthouse.log"
    fi
else
    log_result "Lighthouse" "SKIP" "lhci not installed, backend not ready, or no UI"
fi

# 13. Security Scan with Bandit
echo -e "\n${BLUE}1️⃣3️⃣ Running Security Scans${NC}"
SECURITY_OK=true

if command -v bandit >/dev/null 2>&1; then
    if bandit -r src/ backend/ -f json -o "$REPORTS_DIR/prelaunch_bandit.json" > "$REPORTS_DIR/prelaunch_bandit.log" 2>&1; then
        log_result "Bandit Security" "PASS" "No security issues found"
    else
        log_result "Bandit Security" "WARN" "Security issues detected - check $REPORTS_DIR/prelaunch_bandit.json"
        SECURITY_OK=false
    fi
else
    log_result "Bandit Security" "SKIP" "bandit not installed"
fi

# Check for common secret files in git
SECRET_FILES=("*.key" "*.pem" "*.p12" "*.pfx" "id_rsa" "id_dsa" "*.env" ".env.*")
FOUND_SECRETS=()
for pattern in "${SECRET_FILES[@]}"; do
    if git ls-files | grep -E "$pattern" >/dev/null 2>&1; then
        FOUND_SECRETS+=("$pattern")
    fi
done

if [[ ${#FOUND_SECRETS[@]} -gt 0 ]]; then
    log_result "Secret Files Check" "WARN" "Potential secrets in git: ${FOUND_SECRETS[*]}"
    echo "${FOUND_SECRETS[*]}" > "$REPORTS_DIR/prelaunch_secrets.txt"
else
    log_result "Secret Files Check" "PASS" "No obvious secret files in git"
fi

# Final Summary
echo -e "\n${BLUE}📋 Pre-Launch Test Summary${NC}"
echo -e "${BLUE}=========================${NC}"
echo "End Time: $(date)"
echo "Reports Directory: $REPORTS_DIR"
echo ""

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
    echo -e "${GREEN}🎉 PRE-LAUNCH CHECKS PASSED!${NC}"
    echo -e "${GREEN}All critical tests completed successfully.${NC}"
else
    echo -e "${RED}❌ PRE-LAUNCH CHECKS FAILED!${NC}"
    echo -e "${RED}Please review the failed tests and fix issues before deployment.${NC}"
fi

exit $EXIT_CODE