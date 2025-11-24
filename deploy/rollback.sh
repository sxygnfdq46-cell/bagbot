#!/bin/bash
# Rollback script for Bagbot
# Usage: ./rollback.sh <git-tag-or-commit>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <git-tag-or-commit>"
    echo "Example: ./rollback.sh v1.2.3"
    exit 1
fi

TARGET=$1
DEPLOY_DIR="/srv/bagbot"

echo "🔄 Rolling back to $TARGET..."

cd "$DEPLOY_DIR"

# Checkout target version
echo "📥 Checking out $TARGET..."
git fetch --all --tags
git checkout "$TARGET"

# Rebuild and restart
echo "🔨 Rebuilding containers..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "⏳ Waiting for health check..."
sleep 10

# Verify health
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Rollback successful! Services are healthy."
else
    echo "❌ Health check failed! Check logs: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi
