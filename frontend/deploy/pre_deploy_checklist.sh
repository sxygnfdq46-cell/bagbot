#!/bin/bash
#
# Pre-deployment Checklist Script
# Validates environment and configuration before deployment
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

echo "========================================="
echo "BAGBOT Pre-Deployment Checklist"
echo "========================================="
echo ""

# ====================================
# 1. Check .env.production
# ====================================
log_check "Checking .env.production..."

if [ ! -f ".env.production" ]; then
    log_fail ".env.production not found"
    log_warn "Create it from: cp .env.production.example .env.production"
else
    log_pass ".env.production exists"
    
    # Check SECRET_KEY
    if grep -q "REPLACE_WITH_OUTPUT_OF_openssl_rand_hex_32" .env.production; then
        log_fail "SECRET_KEY not configured in .env.production"
        log_warn "Generate with: python3 -c 'import secrets; print(secrets.token_hex(32))'"
    else
        log_pass "SECRET_KEY configured"
    fi
    
    # Check NEXT_PUBLIC_API_URL
    if grep -q "NEXT_PUBLIC_API_URL=https://api.thebagbot.trade" .env.production; then
        log_pass "NEXT_PUBLIC_API_URL configured correctly"
    else
        log_fail "NEXT_PUBLIC_API_URL not set to https://api.thebagbot.trade"
    fi
    
    # Check ALLOWED_ORIGINS
    if grep -q "ALLOWED_ORIGINS=https://thebagbot.trade" .env.production; then
        log_pass "ALLOWED_ORIGINS configured correctly"
    else
        log_fail "ALLOWED_ORIGINS not set to https://thebagbot.trade"
    fi
fi

echo ""

# ====================================
# 2. Check Deployment Scripts
# ====================================
log_check "Checking deployment scripts..."

scripts=("deploy/provision_vps.sh" "deploy/deploy.sh" "deploy/backup.sh" "deploy/rollback.sh" "deploy/health_check.sh" "deploy/full_deploy.sh")

for script in "${scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        log_pass "$script exists and is executable"
    elif [ -f "$script" ]; then
        log_warn "$script exists but is not executable (chmod +x $script)"
    else
        log_fail "$script not found"
    fi
done

echo ""

# ====================================
# 3. Check Nginx Configuration
# ====================================
log_check "Checking Nginx configuration..."

if [ -f "deploy/nginx.conf" ]; then
    log_pass "nginx.conf exists"
    
    # Check for domain placeholders
    if grep -q "api.yourdomain.com" deploy/nginx.conf; then
        log_fail "nginx.conf still contains placeholder domain 'api.yourdomain.com'"
    else
        log_pass "nginx.conf domain configured"
    fi
    
    # Check for thebagbot.trade
    if grep -q "api.thebagbot.trade" deploy/nginx.conf; then
        log_pass "API domain configured: api.thebagbot.trade"
    else
        log_warn "API domain not found in nginx.conf"
    fi
    
    if grep -q "thebagbot.trade" deploy/nginx.conf; then
        log_pass "Frontend domain configured: thebagbot.trade"
    else
        log_warn "Frontend domain not found in nginx.conf"
    fi
else
    log_fail "deploy/nginx.conf not found"
fi

echo ""

# ====================================
# 4. Check Docker Compose
# ====================================
log_check "Checking Docker Compose configuration..."

if [ -f "docker-compose.prod.yml" ]; then
    log_pass "docker-compose.prod.yml exists"
    
    # Check for .env file reference
    if grep -q "SECRET_KEY=\${SECRET_KEY}" docker-compose.prod.yml; then
        log_pass "docker-compose.prod.yml references environment variables"
    else
        log_warn "docker-compose.prod.yml may not be using .env file"
    fi
else
    log_fail "docker-compose.prod.yml not found"
fi

echo ""

# ====================================
# 5. Check Dockerfiles
# ====================================
log_check "Checking Dockerfiles..."

if [ -f "bagbot/backend/Dockerfile" ]; then
    log_pass "Backend Dockerfile exists"
else
    log_fail "bagbot/backend/Dockerfile not found"
fi

if [ -f "bagbot/frontend/Dockerfile" ]; then
    log_pass "Frontend Dockerfile exists"
else
    log_fail "bagbot/frontend/Dockerfile not found"
fi

echo ""

# ====================================
# 6. Check Git Repository
# ====================================
log_check "Checking Git repository..."

if [ -d ".git" ]; then
    log_pass "Git repository initialized"
    
    # Check remote
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        log_pass "Git remote configured: $REMOTE_URL"
    else
        log_warn "Git remote 'origin' not configured"
    fi
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        log_pass "No uncommitted changes"
    else
        log_warn "Uncommitted changes detected. Commit before deployment."
    fi
else
    log_fail "Not a Git repository"
fi

echo ""

# ====================================
# 7. Check Frontend Configuration
# ====================================
log_check "Checking frontend configuration..."

if [ -f "bagbot/frontend/.env.local" ]; then
    log_pass "Frontend .env.local exists"
    
    if grep -q "NEXT_PUBLIC_API_URL" bagbot/frontend/.env.local; then
        log_pass "NEXT_PUBLIC_API_URL configured in frontend"
    else
        log_warn "NEXT_PUBLIC_API_URL not found in frontend .env.local"
    fi
fi

if [ -f "bagbot/frontend/next.config.js" ]; then
    log_pass "next.config.js exists"
else
    log_warn "next.config.js not found"
fi

echo ""

# ====================================
# 8. Check Backend Configuration
# ====================================
log_check "Checking backend configuration..."

if [ -f "bagbot/backend/config.py" ]; then
    log_pass "Backend config.py exists"
else
    log_warn "Backend config.py not found"
fi

if [ -f "requirements.txt" ]; then
    log_pass "requirements.txt exists"
else
    log_fail "requirements.txt not found"
fi

echo ""

# ====================================
# 9. Check SSL/Certbot Readiness
# ====================================
log_check "Checking SSL readiness..."

log_warn "Ensure DNS records are configured:"
log_warn "  api.thebagbot.trade A → VPS_IP"
log_warn "  thebagbot.trade A → VPS_IP"
log_warn "  www.thebagbot.trade CNAME → thebagbot.trade"
log_warn ""
log_warn "Verify with: dig api.thebagbot.trade +short"

echo ""

# ====================================
# 10. Check VPS Prerequisites
# ====================================
log_check "VPS prerequisites to verify manually..."

log_warn "Before running full_deploy.sh, ensure:"
log_warn "  1. VPS is provisioned (run provision_vps.sh as root)"
log_warn "  2. SSH key added to deploy user: ssh-copy-id deploy@VPS_IP"
log_warn "  3. DNS records propagated (wait 5-60 minutes after DNS changes)"
log_warn "  4. Firewall allows ports 22, 80, 443"
log_warn "  5. VPS has sufficient resources: 2GB RAM, 2 CPU cores, 20GB disk"

echo ""

# ====================================
# Summary
# ====================================
echo "========================================="
echo "Pre-Deployment Checklist Summary"
echo "========================================="

if [ $ERRORS -eq 0 ]; then
    log_pass "All checks passed! ($WARNINGS warnings)"
    echo ""
    echo "Ready to deploy! Run:"
    echo "  ./deploy/full_deploy.sh <VPS_IP> main"
    echo ""
    exit 0
else
    log_fail "Found $ERRORS errors and $WARNINGS warnings"
    echo ""
    echo "Fix errors before deployment"
    exit 1
fi
