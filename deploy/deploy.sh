#!/bin/bash
# Deployment script for Bagbot
# Run this on VPS as deploy user

set -e

DEPLOY_DIR="/srv/bagbot"
REPO_URL="git@github.com:sxygnfdq46-cell/BAGBOT2.git"
BRANCH="${1:-main}"

echo "🚀 Deploying Bagbot from $BRANCH branch..."

# Navigate to deploy directory
cd "$DEPLOY_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
if [ ! -d ".git" ]; then
    echo "🔧 Cloning repository..."
    git clone "$REPO_URL" .
fi

git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

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
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Services are healthy."
    
    # Clean up old images
    echo "🧹 Cleaning up old Docker images..."
    docker image prune -f
else
    echo "❌ Health check failed! Rolling back..."
    docker compose -f docker-compose.prod.yml down
    git checkout HEAD~1
    docker compose -f docker-compose.prod.yml up -d
    echo "⚠️ Rolled back to previous version"
    exit 1
fi

echo ""
echo "📊 Current status:"
docker compose -f docker-compose.prod.yml ps
