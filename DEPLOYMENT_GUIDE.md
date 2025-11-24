# 🚀 Production Deployment Guide

## Phase 5 — Security & Watchdog Implementation

This guide walks through deploying Bagbot to a production VPS with full security hardening, monitoring, and automated deployments.

---

## 📋 Prerequisites

Before starting, gather:

1. **VPS Details**:
   - IP address or hostname
   - Root/sudo access
   - Ubuntu 22.04 LTS (recommended)

2. **Domain & DNS**:
   - API domain (e.g., `api.bagbot.com`)
   - DNS A record pointing to VPS IP
   - Email for Let's Encrypt SSL

3. **Secrets**:
   - SSH key pair for deployment
   - Secret key for application (generate with `openssl rand -hex 32`)
   - Sentry DSN (optional, for error tracking)
   - API keys (Binance, etc.)

---

## 🔐 Step 1: SSH Hardening & Deploy User

Run on VPS as root:

```bash
# Upload and run provisioning script
scp deploy/provision_vps.sh root@YOUR_VPS_IP:/root/
ssh root@YOUR_VPS_IP
chmod +x /root/provision_vps.sh
./provision_vps.sh
```

This script:
- ✅ Installs Docker, nginx, certbot, fail2ban
- ✅ Creates `deploy` user with sudo access
- ✅ Configures UFW firewall (ports 22, 80, 443)
- ✅ Sets up fail2ban for SSH brute-force protection
- ✅ Creates deployment directory `/srv/bagbot`

**Add your SSH public key**:

```bash
# On your laptop
cat ~/.ssh/id_rsa.pub | ssh root@YOUR_VPS_IP 'cat >> /home/deploy/.ssh/authorized_keys'

# Test SSH access
ssh deploy@YOUR_VPS_IP

# If successful, harden SSH (disable root + password login)
ssh root@YOUR_VPS_IP '/root/harden_ssh.sh'
```

---

## 🔥 Step 2: Firewall & fail2ban

Already configured by `provision_vps.sh`. Verify:

```bash
ssh deploy@YOUR_VPS_IP

# Check UFW status
sudo ufw status

# Check fail2ban status
sudo fail2ban-client status sshd
```

**Optional**: Rate-limit SSH connections:

```bash
sudo ufw limit 22/tcp
```

---

## 🔒 Step 3: Reverse Proxy + TLS (nginx + Certbot)

### 3.1 Configure nginx

```bash
ssh deploy@YOUR_VPS_IP

# Copy nginx template
sudo cp /srv/bagbot/deploy/nginx.conf /etc/nginx/sites-available/bagbot

# Edit with your domain
sudo nano /etc/nginx/sites-available/bagbot
# Replace all instances of "api.yourdomain.com" with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 3.2 Obtain SSL certificate

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain and email)
sudo certbot --nginx -d api.yourdomain.com --email you@example.com --agree-tos --no-eff-email

# Test auto-renewal
sudo certbot renew --dry-run

# Enable auto-renewal timer
sudo systemctl enable certbot.timer
```

---

## 🐳 Step 4: Docker Production Settings

### 4.1 Create .env.production

```bash
ssh deploy@YOUR_VPS_IP
cd /srv/bagbot

# Copy example and edit
cp .env.production.example .env.production
nano .env.production
```

Fill in:

```bash
ENVIRONMENT=production
SECRET_KEY=<generate with: openssl rand -hex 32>
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://yourdomain.com
SENTRY_DSN=<your-sentry-dsn>
BINANCE_API_KEY=<your-key>
BINANCE_API_SECRET=<your-secret>
```

**Never commit .env.production to git!**

### 4.2 Deploy application

```bash
cd /srv/bagbot

# Build and start containers
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 🏥 Step 5: Health Checks & Systemd Watchdog

### 5.1 Verify health endpoint

```bash
# Local check (on VPS)
curl http://localhost:8000/api/health

# Public check (with SSL)
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "service": "bagbot-backend",
  "version": "2.0.0"
}
```

### 5.2 Enable systemd service

```bash
ssh deploy@YOUR_VPS_IP

# Enable and start bagbot service
sudo systemctl daemon-reload
sudo systemctl enable bagbot.service
sudo systemctl start bagbot.service

# Check status
sudo systemctl status bagbot.service

# View logs
sudo journalctl -u bagbot.service -f
```

This auto-starts Docker containers on boot and restarts on failure.

---

## 📊 Step 6: Logging & Error Tracking

### 6.1 Sentry Integration

Already configured via `SENTRY_DSN` environment variable. Sentry will:
- Capture unhandled exceptions
- Track performance metrics
- Alert on errors

Test:
```bash
# Trigger test error (if you add a test endpoint)
curl https://api.yourdomain.com/api/test-error
```

### 6.2 Log Rotation

Docker logs are already rotated (see `docker-compose.prod.yml`):
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Optional**: Set up logrotate for host logs:

```bash
sudo nano /etc/logrotate.d/bagbot
```

```
/var/log/nginx/bagbot_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 📈 Step 7: Monitoring & Alerting

### 7.1 UptimeRobot Setup

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create monitor:
   - **Type**: HTTP(S)
   - **URL**: `https://api.yourdomain.com/api/health`
   - **Interval**: 5 minutes
   - **Alert Contacts**: Your email/SMS

### 7.2 Docker Health Checks

Already configured in `docker-compose.prod.yml`:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Check health status:
```bash
docker inspect bagbot-backend | jq '.[].State.Health'
```

---

## 💾 Step 8: Backups & Rollback

### 8.1 Setup Automated Backups

```bash
ssh deploy@YOUR_VPS_IP

# Make backup script executable
chmod +x /srv/bagbot/deploy/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add:
```
0 2 * * * /srv/bagbot/deploy/backup.sh >> /var/log/bagbot-backup.log 2>&1
```

### 8.2 Manual Backup

```bash
cd /srv/bagbot
./deploy/backup.sh
```

Backups are stored in `/var/backups/bagbot/`.

### 8.3 Rollback Procedure

```bash
# Rollback to specific version
cd /srv/bagbot
./deploy/rollback.sh v1.2.3

# Or rollback to previous commit
./deploy/rollback.sh HEAD~1
```

---

## 🔄 Step 9: CI/CD with GitHub Actions

### 9.1 Add GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions:

Add secrets:
- `VPS_HOST`: `deploy@YOUR_VPS_IP`
- `VPS_SSH_KEY`: Contents of your private SSH key
- `SENTRY_DSN`: Your Sentry DSN (optional)

### 9.2 Deploy Workflow

The deploy workflow is triggered on push to `main`:

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [test-backend, test-frontend, docker-build]
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: deploy
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /srv/bagbot
          git pull origin main
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d --build
```

### 9.3 Manual Deploy from Local

```bash
# Using make
make deploy-prod VPS_HOST=deploy@YOUR_VPS_IP

# Or using deploy script
scp -r ./ deploy@YOUR_VPS_IP:/srv/bagbot/
ssh deploy@YOUR_VPS_IP 'cd /srv/bagbot && ./deploy/deploy.sh'
```

---

## ✅ Step 10: Smoke Tests & Go-Live Checklist

### Pre-Launch Checklist

```bash
# 1. Health check returns 200
curl -I https://api.yourdomain.com/api/health

# 2. SSL certificate is valid
curl https://api.yourdomain.com/api/health | jq .

# 3. Docker containers are healthy
docker ps --filter "name=bagbot" --format "table {{.Names}}\t{{.Status}}"

# 4. UptimeRobot monitor is up
# Check your UptimeRobot dashboard

# 5. Sentry receives test error
# Trigger test error and check Sentry dashboard

# 6. Logs are readable
docker compose -f docker-compose.prod.yml logs --tail=50

# 7. Systemd service is enabled
sudo systemctl status bagbot.service

# 8. Firewall rules are active
sudo ufw status numbered

# 9. fail2ban is protecting SSH
sudo fail2ban-client status sshd

# 10. Backups are scheduled
crontab -l | grep backup
```

---

## 🛠️ Common Tasks

### View Logs
```bash
# Docker logs
docker compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/bagbot_access.log
sudo tail -f /var/log/nginx/bagbot_error.log

# Systemd logs
sudo journalctl -u bagbot.service -f
```

### Restart Services
```bash
# Restart backend only
docker compose -f docker-compose.prod.yml restart backend

# Restart all
sudo systemctl restart bagbot.service

# Restart nginx
sudo systemctl restart nginx
```

### Update Application
```bash
cd /srv/bagbot
./deploy/deploy.sh main  # Deploy main branch
```

### Check Resource Usage
```bash
# Docker stats
docker stats bagbot-backend

# System resources
htop

# Disk usage
df -h
du -sh /var/lib/docker
```

---

## 🔒 Security Best Practices

1. **Keep secrets secure**:
   - Never commit `.env.production`
   - Rotate API keys regularly
   - Use GitHub Secrets for CI/CD

2. **Monitor logs**:
   - Check for suspicious access patterns
   - Review fail2ban logs: `sudo fail2ban-client status sshd`

3. **Update regularly**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker compose -f docker-compose.prod.yml pull
   ```

4. **Test backups**:
   ```bash
   # Test restore
   cd /srv/bagbot
   tar -xzf /var/backups/bagbot/data_TIMESTAMP.tar.gz -C /tmp/test-restore
   ```

5. **Rate limiting**:
   - nginx rate limiting already configured
   - Monitor for DDoS: `sudo tail -f /var/log/nginx/bagbot_access.log`

---

## 🆘 Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml ps -a
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Health check failing
```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Check nginx config
sudo nginx -t
sudo systemctl status nginx
```

### Out of disk space
```bash
# Clean Docker resources
docker system prune -a --volumes

# Remove old logs
sudo journalctl --vacuum-time=7d
```

---

## 📚 Additional Resources

- **Sentry Documentation**: https://docs.sentry.io/
- **UptimeRobot Guide**: https://uptimerobot.com/support
- **Docker Compose**: https://docs.docker.com/compose/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **fail2ban**: https://www.fail2ban.org/wiki/index.php/MANUAL_0_8

---

## ✅ Phase 5 Complete

You now have:
- ✅ Hardened VPS with non-root deploy user
- ✅ Firewall + fail2ban protection
- ✅ Reverse proxy with TLS (nginx + Let's Encrypt)
- ✅ Production Docker setup with restart policies
- ✅ Systemd watchdog for auto-restart
- ✅ Health checks + monitoring
- ✅ Error tracking with Sentry
- ✅ Automated backups
- ✅ Rollback capability
- ✅ CI/CD with GitHub Actions

**Your production environment is now secure, monitored, and ready for live trading!** 🚀
