#!/bin/bash
# Backup script for Bagbot production data
# Add to crontab: 0 2 * * * /srv/bagbot/deploy/backup.sh

TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
BACKUP_DIR="/var/backups/bagbot"
DATA_DIR="/var/lib/bagbot/data"

mkdir -p "$BACKUP_DIR"

# Backup data directory
echo "📦 Backing up data directory..."
tar -czf "$BACKUP_DIR/data_$TIMESTAMP.tar.gz" -C /var/lib/bagbot data

# Backup Docker volumes
echo "📦 Backing up Docker volumes..."
docker run --rm \
  -v /var/lib/bagbot:/backup \
  -v "$BACKUP_DIR":/dest \
  alpine tar -czf "/dest/volumes_$TIMESTAMP.tar.gz" -C /backup .

# Keep only last 7 days of backups
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

# Optional: Upload to S3 or remote storage
# aws s3 cp "$BACKUP_DIR/data_$TIMESTAMP.tar.gz" s3://your-bucket/bagbot-backups/

echo "✅ Backup complete: $BACKUP_DIR/data_$TIMESTAMP.tar.gz"
