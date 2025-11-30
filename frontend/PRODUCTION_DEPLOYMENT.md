# 🚀 Production Deployment Guide

Complete step-by-step guide to deploy Bagbot to production.

---

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain name with DNS configured
- VPS or cloud server (Ubuntu 22.04 recommended)
- SSL certificate (via Let's Encrypt)

---

## 🔐 Step 1: Environment Variables

### Backend Environment Variables

Create `/bagbot/backend/.env` file:

```bash
# Copy from example
cp bagbot/backend/.env.example bagbot/backend/.env

# Edit with your values
nano bagbot/backend/.env
```

Required variables:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false

# Security (generate with: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Logging
LOG_LEVEL=INFO

# Error Tracking (optional)
SENTRY_DSN=your-sentry-dsn

# Trading API Keys (if using live trading)
BINANCE_API_KEY=your-api-key
BINANCE_API_SECRET=your-api-secret
```

### Frontend Environment Variables

Create `/bagbot/frontend/.env.production` file:

```bash
# Copy from example
cp bagbot/frontend/.env.example bagbot/frontend/.env.production

# Edit with your values
nano bagbot/frontend/.env.production
```

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Environment
NODE_ENV=production
```

### Docker Compose Environment

Create `.env` in project root for docker-compose:

```bash
# Security
SECRET_KEY=your-secret-key-here

# API Configuration
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Optional
SENTRY_DSN=
BINANCE_API_KEY=
BINANCE_API_SECRET=
LOG_LEVEL=INFO
```

---

## 🔨 Step 2: Build Production Images

### Build Backend

```bash
cd bagbot/backend
docker build -t bagbot-backend:prod .
```

### Build Frontend

```bash
cd bagbot/frontend
docker build -t bagbot-frontend:prod .
```

### Or build all services at once

```bash
# From project root
docker-compose -f docker-compose.prod.yml build
```

---

## 🚀 Step 3: Run Production Stack

### Start all services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Check status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### View logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Stop services

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## 🌐 Step 4: Configure Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Copy configuration

```bash
sudo cp nginx.conf /etc/nginx/sites-available/bagbot
```

### Edit configuration

```bash
sudo nano /etc/nginx/sites-available/bagbot
```

Replace all instances of `yourdomain.com` with your actual domain.

### Enable site

```bash
sudo ln -s /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 5: Configure SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain SSL certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
1. Enter your email
2. Agree to terms of service
3. Choose whether to redirect HTTP to HTTPS (recommended: yes)

### Test auto-renewal

```bash
sudo certbot renew --dry-run
```

### Enable auto-renewal

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 🌍 Step 6: Configure DNS

### A Records

Point your domain to your server IP:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### CNAME Records (if using subdomain for API)

```
Type: CNAME
Name: api
Value: yourdomain.com
TTL: 3600
```

### Verify DNS propagation

```bash
dig yourdomain.com
dig www.yourdomain.com
```

---

## ✅ Step 7: Verify Deployment

### Check health endpoints

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Expected response:
# {"ok":true,"status":"healthy","service":"bagbot-backend","version":"2.0.0"}
```

### Check frontend

Visit `https://yourdomain.com` in your browser.

### Check Docker containers

```bash
docker ps
docker stats
```

### Check logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/bagbot_access.log
sudo tail -f /var/log/nginx/bagbot_error.log

# Application logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔄 Step 8: Deploy Updates

### Pull latest code

```bash
git pull origin main
```

### Rebuild and restart

```bash
# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Restart services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend

# Or restart all
docker-compose -f docker-compose.prod.yml up -d --build
```

### Verify deployment

```bash
curl https://api.yourdomain.com/api/health
```

---

## 📊 Step 9: Monitoring & Maintenance

### Set up monitoring

1. **UptimeRobot**: Monitor `https://yourdomain.com/api/health`
2. **Sentry**: Error tracking (configure SENTRY_DSN)
3. **Docker stats**: Resource monitoring

### Regular maintenance

```bash
# Check disk usage
df -h
docker system df

# Clean up old images
docker system prune -a --volumes

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=100

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Backup data

```bash
# Backup volumes
docker run --rm \
  -v bagbot_backend-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/backend-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup database (if using)
docker-compose -f docker-compose.prod.yml exec backend \
  pg_dump -U postgres bagbot > backup-$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo netstat -tulpn | grep :8000

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test nginx config
sudo nginx -t
```

### Health check failing

```bash
# Check if service is running
docker ps

# Test health endpoint locally
docker-compose -f docker-compose.prod.yml exec backend \
  curl http://localhost:8000/api/health

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env
```

### Out of disk space

```bash
# Check usage
docker system df

# Clean up
docker system prune -a --volumes
docker volume prune

# Clean logs
sudo journalctl --vacuum-time=7d
```

---

## 🔒 Security Checklist

- [ ] Environment variables configured correctly
- [ ] DEBUG mode disabled (`DEBUG=false`)
- [ ] Strong SECRET_KEY generated
- [ ] CORS origins restricted to your domain
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW/iptables)
- [ ] fail2ban installed for SSH protection
- [ ] API keys not exposed in logs
- [ ] Sentry error tracking configured
- [ ] Regular backups scheduled
- [ ] Docker images regularly updated
- [ ] nginx security headers enabled

---

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Sentry**: https://docs.sentry.io/

---

## 🎉 Production Deployment Complete!

Your Bagbot application is now running in production with:

✅ Optimized Docker containers  
✅ HTTPS enabled  
✅ Reverse proxy configured  
✅ Health checks active  
✅ Logging enabled  
✅ Auto-restart policies  
✅ Production environment settings  

**Monitor your application and deploy updates regularly!**
