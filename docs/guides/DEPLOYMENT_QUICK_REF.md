# 🚀 Quick Deployment Reference

## Files Created

### Deployment Scripts (`/deploy/`)
- ✅ `provision_vps.sh` - Initial VPS setup (run once as root)
- ✅ `deploy.sh` - Application deployment script
- ✅ `rollback.sh` - Rollback to previous version
- ✅ `backup.sh` - Backup data and volumes
- ✅ `health_check.sh` - Health check for monitoring
- ✅ `nginx.conf` - Reverse proxy configuration template

### Configuration Files
- ✅ `docker-compose.prod.yml` - Production Docker setup
- ✅ `.env.production.example` - Environment variables template
- ✅ `.github/workflows/ci.yml` - Updated with deploy step
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment documentation

### Backend Updates
- ✅ Added `/api/health` endpoint to `backend/main.py`
- ✅ Updated `.gitignore` to exclude production secrets
- ✅ Updated `Makefile` with `deploy-prod` target

---

## Quick Commands

### Local Development
```bash
# Run tests
cd bagbot && pytest tests/ -v

# Start local services
cd bagbot/frontend && npm run dev
cd bagbot && python -m backend.main
```

### First-Time VPS Setup
```bash
# 1. Provision VPS (as root)
scp deploy/provision_vps.sh root@VPS_IP:/root/
ssh root@VPS_IP './provision_vps.sh'

# 2. Add SSH key
cat ~/.ssh/id_rsa.pub | ssh root@VPS_IP 'cat >> /home/deploy/.ssh/authorized_keys'

# 3. Test & harden
ssh deploy@VPS_IP  # Test login
ssh root@VPS_IP '/root/harden_ssh.sh'  # Disable root login

# 4. Setup nginx + SSL
ssh deploy@VPS_IP
sudo cp /srv/bagbot/deploy/nginx.conf /etc/nginx/sites-available/bagbot
sudo nano /etc/nginx/sites-available/bagbot  # Edit domain
sudo ln -s /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com --email you@email.com --agree-tos

# 5. Create .env.production
cd /srv/bagbot
cp .env.production.example .env.production
nano .env.production  # Fill in secrets

# 6. Deploy
./deploy/deploy.sh
```

### Deploy Updates
```bash
# From local machine
make deploy-prod VPS_HOST=deploy@YOUR_VPS_IP

# Or directly on VPS
ssh deploy@VPS_IP
cd /srv/bagbot
./deploy/deploy.sh
```

### Rollback
```bash
ssh deploy@VPS_IP
cd /srv/bagbot
./deploy/rollback.sh v1.2.3  # Or HEAD~1
```

### Check Status
```bash
# Health check
curl https://api.yourdomain.com/api/health

# Docker containers
ssh deploy@VPS_IP
docker compose -f /srv/bagbot/docker-compose.prod.yml ps

# Logs
docker compose -f /srv/bagbot/docker-compose.prod.yml logs -f backend

# Systemd status
sudo systemctl status bagbot.service
```

---

## GitHub Secrets Required

Add these to GitHub repo → Settings → Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | Deploy user@host | `deploy@192.168.1.100` |
| `VPS_SSH_KEY` | Private SSH key | Contents of `~/.ssh/id_rsa` |
| `SENTRY_DSN` | Error tracking | `https://...@sentry.io/...` |

---

## Environment Variables (.env.production)

Required in `/srv/bagbot/.env.production`:

```bash
# Required
ENVIRONMENT=production
SECRET_KEY=<openssl rand -hex 32>
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://yourdomain.com

# Optional
SENTRY_DSN=https://...@sentry.io/...
BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret
```

---

## Security Checklist

- [ ] SSH key-based authentication configured
- [ ] Root login disabled
- [ ] Password authentication disabled
- [ ] UFW firewall enabled (ports 22, 80, 443 only)
- [ ] fail2ban protecting SSH
- [ ] SSL certificate obtained via certbot
- [ ] Auto-renewal enabled for SSL
- [ ] `.env.production` contains real secrets (not in git)
- [ ] Sentry error tracking configured
- [ ] UptimeRobot monitoring enabled
- [ ] Automated backups scheduled (cron)
- [ ] Systemd service enabled for auto-start

---

## Monitoring URLs

- **API Health**: `https://api.yourdomain.com/api/health`
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Sentry**: https://sentry.io/organizations/.../issues/
- **GitHub Actions**: https://github.com/sxygnfdq46-cell/BAGBOT2/actions

---

## Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml restart backend
```

### SSL issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### Out of disk space
```bash
docker system prune -a --volumes
sudo journalctl --vacuum-time=7d
```

### Health check failing
```bash
curl http://localhost:8000/api/health  # Local check
sudo nginx -t  # Test nginx config
sudo systemctl status nginx
```

---

## Phase 5 Complete! ✅

All production infrastructure is ready:
- VPS provisioning scripts
- Docker production configuration  
- Nginx reverse proxy with SSL
- Systemd watchdog
- Health checks
- Automated backups
- CI/CD deployment
- Complete documentation

**Next**: Follow `DEPLOYMENT_GUIDE.md` step-by-step to deploy to production!
