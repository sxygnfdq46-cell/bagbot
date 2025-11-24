#!/bin/bash
# Rollback script for Bagbot
# Usage: ./rollback.sh <git-tag-or-commit>
# Example: ./rollback.sh v1.2.3
# Example: ./rollback.sh abc1234

set -e  # Exit on any error

if [ -z "$1" ]; then
    echo "❌ Error: No target version specified"
    echo "Usage: ./rollback.sh <git-tag-or-commit>"
    echo ""
    echo "Examples:"
    echo "  ./rollback.sh v1.2.3       # Rollback to tag v1.2.3"
    echo "  ./rollback.sh abc1234      # Rollback to commit abc1234"
    echo "  ./rollback.sh HEAD~1       # Rollback to previous commit"
    echo ""
    echo "📋 Recent commits:"
    cd /srv/bagbot 2>/dev/null && git log --oneline -n 10 || true
    exit 1
fi

TARGET=$1
DEPLOY_DIR="/srv/bagbot"

# Check if running as deploy user
if [ "$(whoami)" != "deploy" ] && [ "$(whoami)" != "root" ]; then
    echo "⚠️  Warning: Not running as deploy user. This may cause permission issues."
fi

echo "🔄 Rolling back to $TARGET..."

# Check deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Error: Deploy directory $DEPLOY_DIR does not exist!"
    exit 1
fi

cd "$DEPLOY_DIR"

# Show current version
echo "📌 Current commit: $(git rev-parse --short HEAD)"

# Checkout target version
echo "📥 Checking out $TARGET..."
git fetch --all --tags
if ! git checkout "$TARGET"; then
    echo "❌ Error: Could not checkout $TARGET"
    echo "📋 Available tags:"
    git tag -l | tail -n 10
    exit 1
fi

echo "📌 Rolled back to: $(git rev-parse --short HEAD)"

# Rebuild and restart
echo "🔨 Rebuilding containers..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Verify health with retries
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
    echo "✅ Rollback successful! Services are healthy."
    echo ""
    echo "📊 Current status:"
    docker compose -f docker-compose.prod.yml ps
else
    echo "❌ Health check failed after rollback!"
    echo "📋 Recent logs:"
    docker compose -f docker-compose.prod.yml logs backend | tail -n 50
    echo ""
    echo "💡 Check full logs: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi
