#!/bin/bash
# Deployment script for Bagbot
# Run this on VPS as deploy user or via GitHub Actions
# Usage: ./deploy.sh [branch]
# Example: ./deploy.sh main

set -e  # Exit on any error

DEPLOY_DIR="/srv/bagbot"
REPO_URL="git@github.com:sxygnfdq46-cell/BAGBOT2.git"
BRANCH="${1:-main}"

# Check if running as deploy user
if [ "$(whoami)" != "deploy" ] && [ "$(whoami)" != "root" ]; then
    echo "⚠️  Warning: Not running as deploy user. This may cause permission issues."
fi

echo "🚀 Deploying Bagbot from $BRANCH branch..."

# Navigate to deploy directory
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Error: Deploy directory $DEPLOY_DIR does not exist!"
    echo "Run provision_vps.sh first or create it manually."
    exit 1
fi

cd "$DEPLOY_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
if [ ! -d ".git" ]; then
    echo "🔧 Cloning repository..."
    git clone "$REPO_URL" .
fi

echo "📌 Current commit: $(git rev-parse --short HEAD)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo "📌 New commit: $(git rev-parse --short HEAD)"

# Build new images
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose -f docker-compose.prod.yml down

# Start new containers
echo "▶️ Starting new containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for health check
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Verify health
HEALTH_CHECK_ATTEMPTS=6
HEALTH_CHECK_INTERVAL=5
HEALTH_OK=false

for i in $(seq 1 $HEALTH_CHECK_ATTEMPTS); do
    echo "🔍 Health check attempt $i/$HEALTH_CHECK_ATTEMPTS..."
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    sleep $HEALTH_CHECK_INTERVAL
done

if [ "$HEALTH_OK" = true ]; then
    echo "✅ Deployment successful! Services are healthy."
    
    # Clean up old images
    echo "🧹 Cleaning up old Docker images..."
    docker image prune -f
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "📝 Frontend: https://thebagbot.trade"
    echo "📝 Backend: https://api.thebagbot.trade/api/health"
else
    echo "❌ Health check failed after $HEALTH_CHECK_ATTEMPTS attempts! Rolling back..."
    docker compose -f docker-compose.prod.yml logs backend | tail -n 50
    
    echo "🔄 Rolling back to previous version..."
    docker compose -f docker-compose.prod.yml down
    git checkout HEAD~1
    docker compose -f docker-compose.prod.yml up -d
    
    echo "⚠️ Rolled back to previous version"
    echo "📋 Check logs: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "📊 Current status:"
docker compose -f docker-compose.prod.yml ps
