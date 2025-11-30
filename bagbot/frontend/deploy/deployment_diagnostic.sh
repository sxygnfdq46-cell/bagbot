#!/bin/bash

###############################################################################
# BAGBOT2 Deployment Diagnostic Script
# Domain: thebagbot.trade
# Purpose: Full deployment health check and troubleshooting
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_DIR="/srv/bagbot/bagbot/frontend"
NGINX_CONFIG="/etc/nginx/sites-available/bagbot"
LOG_FILE="/tmp/bagbot_diagnostic_$(date +%Y%m%d_%H%M%S).log"

echo "========================================" | tee -a $LOG_FILE
echo "BAGBOT2 Deployment Diagnostic" | tee -a $LOG_FILE
echo "Domain: thebagbot.trade" | tee -a $LOG_FILE
echo "Date: $(date)" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

###############################################################################
# 1. Check Frontend Build Directory
###############################################################################
echo -e "${BLUE}[1/6] Checking Frontend Build Directory...${NC}" | tee -a $LOG_FILE

if [ -d "$FRONTEND_DIR" ]; then
    echo -e "${GREEN}✓ Frontend directory exists: $FRONTEND_DIR${NC}" | tee -a $LOG_FILE
    
    # Check .next directory
    if [ -d "$FRONTEND_DIR/.next" ]; then
        echo -e "${GREEN}✓ .next build directory exists${NC}" | tee -a $LOG_FILE
        
        # Get build timestamp
        BUILD_TIME=$(stat -c %y "$FRONTEND_DIR/.next" 2>/dev/null || stat -f "%Sm" "$FRONTEND_DIR/.next" 2>/dev/null)
        echo -e "  Build timestamp: $BUILD_TIME" | tee -a $LOG_FILE
        
        # Check for critical build files
        if [ -f "$FRONTEND_DIR/.next/BUILD_ID" ]; then
            BUILD_ID=$(cat "$FRONTEND_DIR/.next/BUILD_ID")
            echo -e "${GREEN}✓ BUILD_ID found: $BUILD_ID${NC}" | tee -a $LOG_FILE
        else
            echo -e "${RED}✗ BUILD_ID file missing${NC}" | tee -a $LOG_FILE
        fi
        
        # Check standalone directory
        if [ -d "$FRONTEND_DIR/.next/standalone" ]; then
            echo -e "${GREEN}✓ Standalone build exists${NC}" | tee -a $LOG_FILE
            
            if [ -f "$FRONTEND_DIR/.next/standalone/server.js" ]; then
                echo -e "${GREEN}✓ server.js found${NC}" | tee -a $LOG_FILE
            else
                echo -e "${RED}✗ server.js missing in standalone build${NC}" | tee -a $LOG_FILE
            fi
        else
            echo -e "${YELLOW}⚠ Standalone build not found (may not be required)${NC}" | tee -a $LOG_FILE
        fi
        
        # Check static files
        if [ -d "$FRONTEND_DIR/.next/static" ]; then
            STATIC_COUNT=$(find "$FRONTEND_DIR/.next/static" -type f | wc -l)
            echo -e "${GREEN}✓ Static files directory exists ($STATIC_COUNT files)${NC}" | tee -a $LOG_FILE
        else
            echo -e "${RED}✗ Static files directory missing${NC}" | tee -a $LOG_FILE
        fi
    else
        echo -e "${RED}✗ .next directory not found - build may have failed${NC}" | tee -a $LOG_FILE
    fi
    
    # Check package.json for build script
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        echo -e "${GREEN}✓ package.json exists${NC}" | tee -a $LOG_FILE
        BUILD_SCRIPT=$(grep -A1 '"build"' "$FRONTEND_DIR/package.json" | tail -1 || echo "not found")
        echo -e "  Build script: $BUILD_SCRIPT" | tee -a $LOG_FILE
    fi
else
    echo -e "${RED}✗ Frontend directory not found: $FRONTEND_DIR${NC}" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE

###############################################################################
# 2. Verify Latest Static Files
###############################################################################
echo -e "${BLUE}[2/6] Verifying Latest Static Files...${NC}" | tee -a $LOG_FILE

if [ -d "$FRONTEND_DIR/.next/static" ]; then
    # Find most recently modified files
    echo "Most recent static files:" | tee -a $LOG_FILE
    find "$FRONTEND_DIR/.next/static" -type f -mtime -1 -exec ls -lh {} \; 2>/dev/null | head -10 | tee -a $LOG_FILE
    
    # Check for CSS files
    CSS_COUNT=$(find "$FRONTEND_DIR/.next/static" -name "*.css" | wc -l)
    echo -e "${GREEN}✓ CSS files: $CSS_COUNT${NC}" | tee -a $LOG_FILE
    
    # Check for JS files
    JS_COUNT=$(find "$FRONTEND_DIR/.next/static" -name "*.js" | wc -l)
    echo -e "${GREEN}✓ JS files: $JS_COUNT${NC}" | tee -a $LOG_FILE
    
    # Check for chunks
    CHUNK_COUNT=$(find "$FRONTEND_DIR/.next/static/chunks" -name "*.js" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ JS chunks: $CHUNK_COUNT${NC}" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE

###############################################################################
# 3. Verify Nginx Configuration
###############################################################################
echo -e "${BLUE}[3/6] Checking Nginx Configuration...${NC}" | tee -a $LOG_FILE

if [ -f "$NGINX_CONFIG" ]; then
    echo -e "${GREEN}✓ Nginx config found: $NGINX_CONFIG${NC}" | tee -a $LOG_FILE
    
    # Check if config is enabled
    if [ -L "/etc/nginx/sites-enabled/bagbot" ]; then
        echo -e "${GREEN}✓ Config is enabled (symlinked)${NC}" | tee -a $LOG_FILE
    else
        echo -e "${RED}✗ Config is NOT enabled${NC}" | tee -a $LOG_FILE
    fi
    
    # Extract root directive
    ROOT_DIR=$(grep -oP 'root\s+\K[^;]+' "$NGINX_CONFIG" | head -1 || echo "not found")
    echo -e "  Configured root: $ROOT_DIR" | tee -a $LOG_FILE
    
    if [ "$ROOT_DIR" != "not found" ] && [ -d "$ROOT_DIR" ]; then
        echo -e "${GREEN}✓ Root directory exists${NC}" | tee -a $LOG_FILE
    else
        echo -e "${RED}✗ Root directory does not exist or not configured${NC}" | tee -a $LOG_FILE
    fi
    
    # Check proxy_pass configuration
    echo "Proxy configuration:" | tee -a $LOG_FILE
    grep -E "proxy_pass|upstream" "$NGINX_CONFIG" | tee -a $LOG_FILE
    
    # Test nginx config syntax
    echo "Testing Nginx configuration..." | tee -a $LOG_FILE
    if sudo nginx -t 2>&1 | tee -a $LOG_FILE; then
        echo -e "${GREEN}✓ Nginx configuration is valid${NC}" | tee -a $LOG_FILE
    else
        echo -e "${RED}✗ Nginx configuration has errors${NC}" | tee -a $LOG_FILE
    fi
else
    echo -e "${RED}✗ Nginx config not found: $NGINX_CONFIG${NC}" | tee -a $LOG_FILE
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}" | tee -a $LOG_FILE
    
    # Get nginx version
    NGINX_VERSION=$(nginx -v 2>&1)
    echo -e "  $NGINX_VERSION" | tee -a $LOG_FILE
else
    echo -e "${RED}✗ Nginx is NOT running${NC}" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE

###############################################################################
# 4. Check PM2 Services
###############################################################################
echo -e "${BLUE}[4/6] Checking PM2 Services...${NC}" | tee -a $LOG_FILE

if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ PM2 is installed${NC}" | tee -a $LOG_FILE
    
    # List all PM2 processes
    echo "PM2 Process List:" | tee -a $LOG_FILE
    pm2 list | tee -a $LOG_FILE
    
    # Check specifically for bagbot-frontend
    if pm2 list | grep -q "bagbot-frontend"; then
        echo -e "${GREEN}✓ bagbot-frontend process found${NC}" | tee -a $LOG_FILE
        
        # Get detailed info
        echo "Frontend process details:" | tee -a $LOG_FILE
        pm2 info bagbot-frontend | tee -a $LOG_FILE
        
        # Check if it's online
        STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="bagbot-frontend") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "online" ]; then
            echo -e "${GREEN}✓ bagbot-frontend status: online${NC}" | tee -a $LOG_FILE
        else
            echo -e "${RED}✗ bagbot-frontend status: $STATUS${NC}" | tee -a $LOG_FILE
        fi
        
        # Get uptime
        UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="bagbot-frontend") | .pm2_env.pm_uptime' 2>/dev/null || echo "unknown")
        if [ "$UPTIME" != "unknown" ]; then
            UPTIME_READABLE=$(date -d "@$(($UPTIME/1000))" 2>/dev/null || date -r $(($UPTIME/1000)) 2>/dev/null || echo "$UPTIME")
            echo -e "  Uptime since: $UPTIME_READABLE" | tee -a $LOG_FILE
        fi
        
        # Show last 20 lines of logs
        echo "" | tee -a $LOG_FILE
        echo "Recent Frontend Logs (last 20 lines):" | tee -a $LOG_FILE
        pm2 logs bagbot-frontend --lines 20 --nostream | tee -a $LOG_FILE
        
    else
        echo -e "${RED}✗ bagbot-frontend process NOT found${NC}" | tee -a $LOG_FILE
        echo "Available PM2 processes:" | tee -a $LOG_FILE
        pm2 list | grep -E "name|─" | tee -a $LOG_FILE
    fi
    
    # Check for any error logs
    echo "" | tee -a $LOG_FILE
    echo "Checking for recent errors:" | tee -a $LOG_FILE
    pm2 logs bagbot-frontend --err --lines 10 --nostream 2>/dev/null | tee -a $LOG_FILE || echo "No error logs or process not found" | tee -a $LOG_FILE
    
else
    echo -e "${RED}✗ PM2 is NOT installed${NC}" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE

###############################################################################
# 5. Check for Caching Issues
###############################################################################
echo -e "${BLUE}[5/6] Checking for Cache and Stale Artifacts...${NC}" | tee -a $LOG_FILE

# Check browser cache headers in Nginx
if [ -f "$NGINX_CONFIG" ]; then
    echo "Cache-related Nginx directives:" | tee -a $LOG_FILE
    grep -iE "cache|expires|etag" "$NGINX_CONFIG" | tee -a $LOG_FILE || echo "No explicit cache directives found" | tee -a $LOG_FILE
fi

# Check for old .next builds
if [ -d "$FRONTEND_DIR" ]; then
    echo "" | tee -a $LOG_FILE
    echo "Checking for old build artifacts:" | tee -a $LOG_FILE
    
    # Check .next-old or backup directories
    OLD_BUILDS=$(find "$FRONTEND_DIR" -maxdepth 1 -type d -name ".next*" 2>/dev/null)
    if [ -n "$OLD_BUILDS" ]; then
        echo "Found build directories:" | tee -a $LOG_FILE
        echo "$OLD_BUILDS" | tee -a $LOG_FILE
    fi
    
    # Check node_modules age
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        NODE_MODULES_TIME=$(stat -c %y "$FRONTEND_DIR/node_modules" 2>/dev/null || stat -f "%Sm" "$FRONTEND_DIR/node_modules" 2>/dev/null)
        echo -e "node_modules timestamp: $NODE_MODULES_TIME" | tee -a $LOG_FILE
    fi
fi

# Check for Cloudflare or CDN caching
echo "" | tee -a $LOG_FILE
echo "Testing cache headers from live site:" | tee -a $LOG_FILE
curl -sI https://thebagbot.trade | grep -iE "cache|age|etag|expires" | tee -a $LOG_FILE || echo "Could not fetch headers" | tee -a $LOG_FILE

echo "" | tee -a $LOG_FILE

###############################################################################
# 6. Recommendations
###############################################################################
echo -e "${BLUE}[6/6] Generating Recommendations...${NC}" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Collect issues
ISSUES=()

if [ ! -d "$FRONTEND_DIR/.next" ]; then
    ISSUES+=("Frontend build directory missing")
fi

if ! pm2 list | grep -q "bagbot-frontend"; then
    ISSUES+=("PM2 process not running")
fi

if ! systemctl is-active --quiet nginx; then
    ISSUES+=("Nginx not running")
fi

# Display recommendations
if [ ${#ISSUES[@]} -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}✓ All checks passed!${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}========================================${NC}" | tee -a $LOG_FILE
else
    echo -e "${YELLOW}========================================${NC}" | tee -a $LOG_FILE
    echo -e "${YELLOW}Issues Found:${NC}" | tee -a $LOG_FILE
    echo -e "${YELLOW}========================================${NC}" | tee -a $LOG_FILE
    for issue in "${ISSUES[@]}"; do
        echo -e "${RED}✗ $issue${NC}" | tee -a $LOG_FILE
    done
    
    echo "" | tee -a $LOG_FILE
    echo -e "${BLUE}Recommended Fixes:${NC}" | tee -a $LOG_FILE
    echo "----------------------------------------" | tee -a $LOG_FILE
    
    if [ ! -d "$FRONTEND_DIR/.next" ]; then
        echo "1. Rebuild frontend:" | tee -a $LOG_FILE
        echo "   cd $FRONTEND_DIR" | tee -a $LOG_FILE
        echo "   npm install" | tee -a $LOG_FILE
        echo "   npm run build" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
    fi
    
    if ! pm2 list | grep -q "bagbot-frontend"; then
        echo "2. Restart PM2 process:" | tee -a $LOG_FILE
        echo "   cd $FRONTEND_DIR" | tee -a $LOG_FILE
        echo "   pm2 start npm --name bagbot-frontend -- start" | tee -a $LOG_FILE
        echo "   pm2 save" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
    fi
    
    if ! systemctl is-active --quiet nginx; then
        echo "3. Restart Nginx:" | tee -a $LOG_FILE
        echo "   sudo systemctl restart nginx" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
    fi
    
    echo "4. Clear browser cache and reload:" | tee -a $LOG_FILE
    echo "   - Hard refresh: Ctrl+Shift+R (Chrome/Firefox)" | tee -a $LOG_FILE
    echo "   - Clear cache in browser settings" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    echo "5. If using Cloudflare, purge cache:" | tee -a $LOG_FILE
    echo "   - Go to Cloudflare dashboard" | tee -a $LOG_FILE
    echo "   - Caching > Purge Everything" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
echo "Diagnostic complete!" | tee -a $LOG_FILE
echo "Full log saved to: $LOG_FILE" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Quick fix script generation
echo "Generating quick fix script..." | tee -a $LOG_FILE
FIX_SCRIPT="/tmp/bagbot_quick_fix.sh"

cat > $FIX_SCRIPT << 'FIXEOF'
#!/bin/bash
# BAGBOT2 Quick Fix Script
# Generated by deployment diagnostic

set -e

FRONTEND_DIR="/srv/bagbot/bagbot/frontend"

echo "Starting BAGBOT2 quick fix..."

# 1. Rebuild frontend
echo "[1/4] Rebuilding frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# 2. Restart PM2
echo "[2/4] Restarting PM2..."
pm2 restart bagbot-frontend || pm2 start npm --name bagbot-frontend -- start
pm2 save

# 3. Restart Nginx
echo "[3/4] Restarting Nginx..."
sudo systemctl restart nginx

# 4. Verify services
echo "[4/4] Verifying services..."
pm2 status
sudo systemctl status nginx --no-pager

echo "Quick fix complete!"
echo "Test site: https://thebagbot.trade"
FIXEOF

chmod +x $FIX_SCRIPT
echo -e "${GREEN}Quick fix script created: $FIX_SCRIPT${NC}" | tee -a $LOG_FILE
echo "Run with: sudo bash $FIX_SCRIPT" | tee -a $LOG_FILE
