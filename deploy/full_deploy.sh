#!/bin/bash
#
# BAGBOT Production Deployment Script
# Deploys BAGBOT to VPS with full stack (backend + frontend)
#
# Prerequisites:
# - VPS provisioned with provision_vps.sh
# - DNS configured: api.thebagbot.trade → VPS IP, thebagbot.trade → VPS IP
# - SSH key added to deploy user
# - .env.production file configured
#
# Usage:
#   ./full_deploy.sh <vps_ip_or_domain> [branch]
#
# Example:
#   ./full_deploy.sh 192.168.1.100 main
#   ./full_deploy.sh thebagbot.trade main

set -e

# ====================================
# Configuration
# ====================================
VPS_HOST="${1:-}"
BRANCH="${2:-main}"
DEPLOY_USER="deploy"
DEPLOY_DIR="/srv/bagbot"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ====================================
# Helper Functions
# ====================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ====================================
# Validation
# ====================================
if [ -z "$VPS_HOST" ]; then
    log_error "Usage: $0 <vps_ip_or_domain> [branch]"
    log_error "Example: $0 192.168.1.100 main"
    exit 1
fi

if [ ! -f "$LOCAL_DIR/.env.production" ]; then
    log_error ".env.production not found in $LOCAL_DIR"
    log_error "Please create it from .env.production.example and configure SECRET_KEY"
    exit 1
fi

log_info "Deployment Configuration:"
log_info "  VPS Host: $VPS_HOST"
log_info "  Branch: $BRANCH"
log_info "  Deploy User: $DEPLOY_USER"
log_info "  Deploy Directory: $DEPLOY_DIR"
echo ""

# ====================================
# Step 1: Pre-deployment Checks
# ====================================
log_info "Step 1/10: Running pre-deployment checks..."

# Check SSH connection
if ! ssh -o ConnectTimeout=5 "$DEPLOY_USER@$VPS_HOST" "echo 'SSH OK'" &> /dev/null; then
    log_error "Cannot connect to $DEPLOY_USER@$VPS_HOST via SSH"
    log_error "Ensure SSH key is added: ssh-copy-id $DEPLOY_USER@$VPS_HOST"
    exit 1
fi
log_success "SSH connection verified"

# Check Docker
if ! ssh "$DEPLOY_USER@$VPS_HOST" "docker --version" &> /dev/null; then
    log_error "Docker not installed on VPS. Run provision_vps.sh first"
    exit 1
fi
log_success "Docker verified"

# Check Nginx
if ! ssh "$DEPLOY_USER@$VPS_HOST" "nginx -v" &> /dev/null; then
    log_error "Nginx not installed on VPS. Run provision_vps.sh first"
    exit 1
fi
log_success "Nginx verified"

# ====================================
# Step 2: Copy Files to VPS
# ====================================
log_info "Step 2/10: Copying files to VPS..."

# Copy .env.production
scp "$LOCAL_DIR/.env.production" "$DEPLOY_USER@$VPS_HOST:$DEPLOY_DIR/.env.production"
log_success ".env.production copied"

# Copy nginx.conf
scp "$LOCAL_DIR/deploy/nginx.conf" "$DEPLOY_USER@$VPS_HOST:/tmp/bagbot-nginx.conf"
log_success "nginx.conf copied"

# Copy deploy scripts
scp "$LOCAL_DIR/deploy/deploy.sh" "$DEPLOY_USER@$VPS_HOST:$DEPLOY_DIR/deploy/"
scp "$LOCAL_DIR/deploy/backup.sh" "$DEPLOY_USER@$VPS_HOST:$DEPLOY_DIR/deploy/"
scp "$LOCAL_DIR/deploy/rollback.sh" "$DEPLOY_USER@$VPS_HOST:$DEPLOY_DIR/deploy/"
scp "$LOCAL_DIR/deploy/health_check.sh" "$DEPLOY_USER@$VPS_HOST:$DEPLOY_DIR/deploy/"
ssh "$DEPLOY_USER@$VPS_HOST" "chmod +x $DEPLOY_DIR/deploy/*.sh"
log_success "Deploy scripts copied and made executable"

# ====================================
# Step 3: Configure Nginx
# ====================================
log_info "Step 3/10: Configuring Nginx..."

ssh "$DEPLOY_USER@$VPS_HOST" "sudo mv /tmp/bagbot-nginx.conf /etc/nginx/sites-available/bagbot"
ssh "$DEPLOY_USER@$VPS_HOST" "sudo ln -sf /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/bagbot"
ssh "$DEPLOY_USER@$VPS_HOST" "sudo rm -f /etc/nginx/sites-enabled/default"

# Test Nginx config
if ! ssh "$DEPLOY_USER@$VPS_HOST" "sudo nginx -t"; then
    log_error "Nginx configuration test failed"
    exit 1
fi
log_success "Nginx configuration valid"

# ====================================
# Step 4: SSL Certificates
# ====================================
log_info "Step 4/10: Setting up SSL certificates..."

# Check if certificates exist
if ssh "$DEPLOY_USER@$VPS_HOST" "sudo test -f /etc/letsencrypt/live/api.thebagbot.trade/fullchain.pem"; then
    log_warning "SSL certificates already exist. Skipping certbot..."
else
    log_info "Obtaining SSL certificate for api.thebagbot.trade..."
    ssh "$DEPLOY_USER@$VPS_HOST" "sudo certbot --nginx -d api.thebagbot.trade --non-interactive --agree-tos --email admin@thebagbot.trade" || {
        log_warning "Certbot failed for api.thebagbot.trade. You may need to configure DNS first."
        log_warning "Continuing with deployment..."
    }
    
    log_info "Obtaining SSL certificate for thebagbot.trade..."
    ssh "$DEPLOY_USER@$VPS_HOST" "sudo certbot --nginx -d thebagbot.trade -d www.thebagbot.trade --non-interactive --agree-tos --email admin@thebagbot.trade" || {
        log_warning "Certbot failed for thebagbot.trade. You may need to configure DNS first."
        log_warning "Continuing with deployment..."
    }
fi

# Reload Nginx
ssh "$DEPLOY_USER@$VPS_HOST" "sudo systemctl reload nginx"
log_success "Nginx reloaded"

# ====================================
# Step 5: Pull Code from Git
# ====================================
log_info "Step 5/10: Pulling code from Git repository..."

ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH"
log_success "Code pulled from $BRANCH branch"

# ====================================
# Step 6: Build Docker Images
# ====================================
log_info "Step 6/10: Building Docker images..."

log_info "Building backend image..."
ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml build backend" || {
    log_error "Backend build failed"
    exit 1
}
log_success "Backend image built"

log_info "Building frontend image..."
ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml build frontend" || {
    log_error "Frontend build failed"
    exit 1
}
log_success "Frontend image built"

# ====================================
# Step 7: Stop Old Containers
# ====================================
log_info "Step 7/10: Stopping old containers..."

ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml down" || true
log_success "Old containers stopped"

# ====================================
# Step 8: Start New Containers
# ====================================
log_info "Step 8/10: Starting new containers..."

ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml up -d --remove-orphans"
log_success "Containers started"

# ====================================
# Step 9: Health Checks
# ====================================
log_info "Step 9/10: Running health checks..."

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
for i in {1..12}; do
    if ssh "$DEPLOY_USER@$VPS_HOST" "$DEPLOY_DIR/deploy/health_check.sh" &> /dev/null; then
        log_success "Backend is healthy"
        break
    fi
    
    if [ $i -eq 12 ]; then
        log_error "Backend health check failed after 60s"
        log_info "Checking container logs..."
        ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml logs --tail=50 backend"
        exit 1
    fi
    
    log_info "Health check attempt $i/12 (waiting 5s)..."
    sleep 5
done

# Check frontend
log_info "Checking frontend..."
if ssh "$DEPLOY_USER@$VPS_HOST" "curl -f http://localhost:3000 > /dev/null 2>&1"; then
    log_success "Frontend is responding"
else
    log_warning "Frontend health check failed (may still be starting)"
fi

# ====================================
# Step 10: Display Status
# ====================================
log_info "Step 10/10: Displaying deployment status..."

ssh "$DEPLOY_USER@$VPS_HOST" "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml ps"

echo ""
log_success "========================================="
log_success "DEPLOYMENT COMPLETED SUCCESSFULLY"
log_success "========================================="
echo ""
log_info "Services:"
log_info "  Backend API: https://api.thebagbot.trade"
log_info "  Frontend:    https://thebagbot.trade"
log_info "  Health:      https://api.thebagbot.trade/api/health"
echo ""
log_info "Next Steps:"
log_info "  1. Test health endpoint: curl https://api.thebagbot.trade/api/health"
log_info "  2. Open frontend: https://thebagbot.trade"
log_info "  3. Monitor logs: ssh $DEPLOY_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml logs -f'"
log_info "  4. Check adapters: Navigate to /dashboard/adapters"
log_info "  5. Verify WebSockets work in browser DevTools"
echo ""
log_info "Rollback:"
log_info "  ssh $DEPLOY_USER@$VPS_HOST 'cd $DEPLOY_DIR && ./deploy/rollback.sh HEAD~1'"
echo ""
log_success "Deployment script completed!"
