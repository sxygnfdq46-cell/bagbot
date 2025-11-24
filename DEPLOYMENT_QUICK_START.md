# BAGBOT Deployment Quick Reference

## 🚀 One-Command Deployment

```bash
./deploy/full_deploy.sh <VPS_IP> main
```

---

## 📋 Pre-Deployment Checklist

```bash
./deploy/pre_deploy_checklist.sh
```

**Required**:
- ✅ .env.production configured
- ✅ DNS records set (api.thebagbot.trade, thebagbot.trade → VPS IP)
- ✅ SSH key added to deploy user
- ✅ Git changes committed

---

## 🔧 VPS Setup (First-Time Only)

### 1. Provision VPS
```bash
ssh root@VPS_IP
bash <(curl -s https://raw.githubusercontent.com/YOUR_REPO/main/deploy/provision_vps.sh)
```

Or manually:
```bash
scp deploy/provision_vps.sh root@VPS_IP:/root/
ssh root@VPS_IP "bash /root/provision_vps.sh"
```

### 2. Add SSH Key
```bash
ssh-copy-id deploy@VPS_IP
```

### 3. Harden SSH (After Key Added)
```bash
ssh root@VPS_IP "/root/harden_ssh.sh"
```

---

## 🌐 DNS Configuration

**Required DNS Records**:
```
api.thebagbot.trade    A      <VPS_IP>
thebagbot.trade        A      <VPS_IP>
www.thebagbot.trade    CNAME  thebagbot.trade
```

**Verify**:
```bash
dig api.thebagbot.trade +short
dig thebagbot.trade +short
```

Wait 5-60 minutes for DNS propagation.

---

## 📦 Manual Deployment Steps

### 1. Copy Files
```bash
scp .env.production deploy@VPS_IP:/srv/bagbot/
scp deploy/nginx.conf deploy@VPS_IP:/tmp/bagbot-nginx.conf
```

### 2. Configure Nginx
```bash
ssh deploy@VPS_IP
sudo mv /tmp/bagbot-nginx.conf /etc/nginx/sites-available/bagbot
sudo ln -sf /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificates
```bash
sudo certbot --nginx -d api.thebagbot.trade --email admin@thebagbot.trade
sudo certbot --nginx -d thebagbot.trade -d www.thebagbot.trade
```

### 4. Deploy Code
```bash
ssh deploy@VPS_IP
cd /srv/bagbot
./deploy/deploy.sh main
```

---

## 🏥 Health Checks

### Backend
```bash
curl https://api.thebagbot.trade/api/health
# Expected: {"ok":true,"status":"healthy","version":"2.0.0"}
```

### Frontend
```bash
curl -I https://thebagbot.trade
# Expected: HTTP/2 200
```

### Containers
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose -f docker-compose.prod.yml ps"
```

---

## 📊 Monitoring

### View Logs
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose -f docker-compose.prod.yml logs -f"
```

### Backend Only
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose logs -f backend"
```

### Frontend Only
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose logs -f frontend"
```

---

## 🔄 Rollback

### To Previous Commit
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && ./deploy/rollback.sh HEAD~1"
```

### To Specific Version
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && ./deploy/rollback.sh v1.0.0"
```

---

## 🛠️ Common Commands

### Restart Services
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose restart"
```

### Rebuild & Restart
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose -f docker-compose.prod.yml build && docker compose up -d"
```

### Stop Services
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose down"
```

### View Container Status
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose ps"
```

### Enter Backend Shell
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose exec backend /bin/bash"
```

### Enter Frontend Shell
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose exec frontend /bin/sh"
```

---

## 🧹 Maintenance

### Cleanup Docker Images
```bash
ssh deploy@VPS_IP "docker system prune -a"
```

### View Disk Usage
```bash
ssh deploy@VPS_IP "df -h"
```

### Check Backups
```bash
ssh deploy@VPS_IP "ls -lh /var/backups/bagbot"
```

### Manual Backup
```bash
ssh deploy@VPS_IP "/srv/bagbot/deploy/backup.sh"
```

---

## 🔐 Security

### Check Firewall
```bash
ssh deploy@VPS_IP "sudo ufw status"
```

### Check Fail2ban
```bash
ssh deploy@VPS_IP "sudo fail2ban-client status sshd"
```

### View SSL Certificates
```bash
ssh deploy@VPS_IP "sudo certbot certificates"
```

### Renew SSL (Auto via Cron)
```bash
ssh deploy@VPS_IP "sudo certbot renew --dry-run"
```

---

## 🐛 Troubleshooting

### Backend Not Starting
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose logs backend"
```

**Common Issues**:
- Missing .env.production → Copy from local
- Database init failed → Check `init_db()` logs
- Port 8000 in use → Check `docker ps` or `netstat -tulpn | grep 8000`

### Frontend 502 Error
```bash
ssh deploy@VPS_IP "cd /srv/bagbot && docker compose logs frontend"
```

**Common Issues**:
- Build failed → Check for npm/Node.js errors
- NEXT_PUBLIC_API_URL not set → Check .env.production
- Backend not ready → Wait 30s for backend health check

### SSL Certificate Fails
```bash
ssh deploy@VPS_IP "sudo nginx -t"
dig api.thebagbot.trade +short
```

**Common Issues**:
- DNS not propagated → Wait 5-60 minutes
- Port 80 blocked → Check firewall: `sudo ufw allow 80`
- Nginx misconfigured → Check `/etc/nginx/sites-enabled/bagbot`

### WebSocket Connection Fails
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.thebagbot.trade/ws/market
```

**Fix**: Ensure Nginx has WebSocket headers:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

---

## 📝 Environment Variables

### Required in .env.production
```bash
SECRET_KEY=<64-char-hex>                     # Generate with: python3 -c 'import secrets; print(secrets.token_hex(32))'
ALLOWED_ORIGINS=https://thebagbot.trade
NEXT_PUBLIC_API_URL=https://api.thebagbot.trade
LOG_LEVEL=INFO
```

### Optional
```bash
SENTRY_DSN=<sentry-dsn>                      # Error monitoring
BINANCE_API_KEY=<key>                        # Exchange integration
STRIPE_SECRET_KEY=<key>                      # Payments
DATABASE_URL=sqlite:///./data/bagbot.db      # Or PostgreSQL
```

---

## 🔗 URLs

- **Backend API**: https://api.thebagbot.trade
- **Frontend**: https://thebagbot.trade
- **Health Check**: https://api.thebagbot.trade/api/health
- **WebSocket**: wss://api.thebagbot.trade/ws

---

## 📚 Documentation

- **Full Deployment Guide**: `PHASE_6_SESSION_1_COMPLETE.md`
- **API Endpoints**: `API_ENDPOINT_MAP.md`
- **Architecture**: `docs/TRADING_ARCHITECTURE.md`

---

## 🆘 Support

- **Logs**: `ssh deploy@VPS_IP "cd /srv/bagbot && docker compose logs -f"`
- **Health**: `ssh deploy@VPS_IP "/srv/bagbot/deploy/health_check.sh"`
- **Rollback**: `ssh deploy@VPS_IP "cd /srv/bagbot && ./deploy/rollback.sh HEAD~1"`

---

**Last Updated**: 2024-01-15  
**Version**: 2.0.0
