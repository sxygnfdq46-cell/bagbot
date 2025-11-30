# DNS Setup Guide - Cloudflare

## Overview
This guide covers DNS configuration for `thebagbot.trade` domain using Cloudflare.

## Prerequisites
- Cloudflare account with `thebagbot.trade` domain added
- VPS IP address (will be available after VPS provisioning)
- Domain nameservers pointed to Cloudflare

---

## Step 1: Add DNS A Records

### 1.1 API Subdomain (Backend)

1. **Log into Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Select domain: `thebagbot.trade`

2. **Navigate to DNS Settings**
   - Click on **DNS** in the left sidebar

3. **Add A Record for API**
   - Click **Add record** button
   - Configure:
     ```
     Type:    A
     Name:    api
     IPv4:    [YOUR_VPS_IP_ADDRESS]
     TTL:     Auto (or 300 seconds for quick updates)
     Proxy:   🔘 DNS only (gray cloud - IMPORTANT!)
     ```
   - Click **Save**

   **⚠️ CRITICAL:** API subdomain MUST be DNS-only (not proxied) to allow direct SSH access and avoid Cloudflare timeout issues with long-running API requests.

### 1.2 Root Domain (Frontend)

1. **Add A Record for Root Domain**
   - Click **Add record** button
   - Configure:
     ```
     Type:    A
     Name:    @
     IPv4:    [YOUR_VPS_IP_ADDRESS]
     TTL:     Auto (or 300 seconds)
     Proxy:   🟠 Proxied (orange cloud - RECOMMENDED)
     ```
   - Click **Save**

   **✅ RECOMMENDED:** Root domain proxied through Cloudflare provides DDoS protection, caching, and automatic HTTPS.

### 1.3 WWW Subdomain (Optional but Recommended)

1. **Add CNAME Record for WWW**
   - Click **Add record** button
   - Configure:
     ```
     Type:    CNAME
     Name:    www
     Target:  thebagbot.trade
     TTL:     Auto
     Proxy:   🟠 Proxied (orange cloud)
     ```
   - Click **Save**

---

## Step 2: Verify DNS Propagation

### Check DNS Records
```bash
# Check API subdomain
dig api.thebagbot.trade +short

# Check root domain
dig thebagbot.trade +short

# Check WWW subdomain
dig www.thebagbot.trade +short
```

**Expected Results:**
- All commands should return your VPS IP address
- Propagation typically takes 5-15 minutes with Auto TTL
- Global propagation can take up to 24-48 hours

### Online DNS Checker
- https://dnschecker.org/#A/api.thebagbot.trade
- https://dnschecker.org/#A/thebagbot.trade

---

## Step 3: SSL/TLS Configuration

### 3.1 Initial SSL/TLS Mode (Before Let's Encrypt)

1. **Navigate to SSL/TLS Settings**
   - Go to: **SSL/TLS** tab in Cloudflare dashboard

2. **Set to Flexible Mode Initially**
   - Select: **Flexible** (Cloudflare ↔ VPS uses HTTP)
   - This allows access while setting up Let's Encrypt on VPS

### 3.2 Final SSL/TLS Mode (After Let's Encrypt Certificates)

1. **After running `certbot` on VPS, switch to Full (Strict)**
   - Go to: **SSL/TLS** → **Overview**
   - Select: **Full (strict)**
   - This ensures end-to-end encryption:
     ```
     Browser → Cloudflare (HTTPS) → VPS (HTTPS with valid cert)
     ```

2. **Enable Always Use HTTPS**
   - Go to: **SSL/TLS** → **Edge Certificates**
   - Turn ON: **Always Use HTTPS**
   - All HTTP requests will redirect to HTTPS

3. **Enable HSTS (HTTP Strict Transport Security)**
   - Go to: **SSL/TLS** → **Edge Certificates**
   - Scroll to **HTTP Strict Transport Security (HSTS)**
   - Click **Enable HSTS**
   - Configure:
     ```
     Max Age:                 6 months (15768000 seconds)
     Include subdomains:      ON
     Preload:                 ON (submit to HSTS preload list later)
     No-Sniff header:         ON
     ```

### 3.3 Minimum TLS Version

1. **Set Minimum TLS Version**
   - Go to: **SSL/TLS** → **Edge Certificates**
   - Set **Minimum TLS Version**: TLS 1.2 (recommended)
   - Balances security and compatibility

---

## Step 4: Page Rules for WWW Redirect

### Create Redirect Rule (WWW → Root)

1. **Navigate to Rules**
   - Go to: **Rules** → **Page Rules** in Cloudflare dashboard

2. **Create New Page Rule**
   - Click **Create Page Rule**
   - Configure:
     ```
     URL Pattern:  www.thebagbot.trade/*
     Setting:      Forwarding URL
     Status Code:  301 - Permanent Redirect
     Destination:  https://thebagbot.trade/$1
     ```
   - Click **Save and Deploy**

**Result:** All `www.thebagbot.trade` requests permanently redirect to `thebagbot.trade`

---

## Step 5: Additional Security & Performance Settings

### 5.1 Security Settings

1. **Enable Bot Fight Mode**
   - Go to: **Security** → **Bots**
   - Turn ON: **Bot Fight Mode** (free plan)

2. **Security Level**
   - Go to: **Security** → **Settings**
   - Set: **Medium** (balanced protection)

3. **Challenge Passage**
   - Set: **30 minutes** (how long users stay whitelisted after challenge)

### 5.2 Performance Settings

1. **Enable Brotli Compression**
   - Go to: **Speed** → **Optimization**
   - Turn ON: **Brotli**

2. **Auto Minify**
   - Turn ON: JavaScript, CSS, HTML

3. **Caching Level**
   - Go to: **Caching** → **Configuration**
   - Set: **Standard** (respects origin cache headers)

4. **Browser Cache TTL**
   - Set: **4 hours** (good balance for web app)

---

## Step 6: Verify Configuration

### After VPS Setup Complete

```bash
# Test HTTPS on root domain
curl -I https://thebagbot.trade

# Test API endpoint
curl https://api.thebagbot.trade/api/health

# Test WWW redirect
curl -I https://www.thebagbot.trade
# Should show 301 redirect to https://thebagbot.trade
```

---

## DNS Records Summary

| Type  | Name | Target/IPv4        | TTL  | Proxy Status | Purpose           |
|-------|------|--------------------|------|--------------|-------------------|
| A     | @    | [VPS_IP]           | Auto | 🟠 Proxied   | Root domain       |
| A     | api  | [VPS_IP]           | Auto | 🔘 DNS only  | Backend API       |
| CNAME | www  | thebagbot.trade    | Auto | 🟠 Proxied   | WWW subdomain     |

---

## Troubleshooting

### DNS Not Resolving
- Wait 15 minutes after changes
- Check TTL hasn't expired yet
- Verify nameservers point to Cloudflare: `dig NS thebagbot.trade`

### SSL Certificate Errors
- Ensure SSL/TLS mode matches VPS setup:
  - **Before Let's Encrypt**: Use Flexible
  - **After Let's Encrypt**: Use Full (strict)
- Verify nginx is listening on port 443
- Check certbot renewal: `sudo certbot renew --dry-run`

### 521 Error (Web Server Down)
- VPS is not responding on port 80/443
- Check nginx status: `sudo systemctl status nginx`
- Check firewall: `sudo ufw status`
- Verify docker containers running: `docker ps`

### API Subdomain 522 Error (Connection Timeout)
- Switch `api.thebagbot.trade` to DNS-only (gray cloud)
- Cloudflare's 100s timeout conflicts with long API requests

### WWW Not Redirecting
- Verify Page Rule is enabled and first in priority list
- Check URL pattern matches: `www.thebagbot.trade/*`
- Clear browser cache and test in incognito mode

---

## Next Steps After DNS Configuration

1. ✅ DNS records added to Cloudflare
2. ⏭️ Wait for DNS propagation (15 min - 24 hours)
3. ⏭️ SSH into VPS: `ssh deploy@[VPS_IP]`
4. ⏭️ Run provision script: `./deploy/provision_vps.sh`
5. ⏭️ Obtain Let's Encrypt certificates via certbot
6. ⏭️ Update Cloudflare SSL/TLS to Full (strict)
7. ⏭️ Deploy application via GitHub Actions
8. ⏭️ Verify endpoints are accessible

---

## Reference Commands

```bash
# Test DNS resolution
nslookup api.thebagbot.trade
nslookup thebagbot.trade

# Check SSL certificate
openssl s_client -connect api.thebagbot.trade:443 -servername api.thebagbot.trade

# Test health endpoints
curl https://api.thebagbot.trade/api/health
curl https://thebagbot.trade

# Check HTTP to HTTPS redirect
curl -I http://thebagbot.trade
# Should return 301 or 308 redirect to HTTPS
```

---

## Important Notes

1. **API subdomain MUST be DNS-only** to avoid Cloudflare timeouts on long requests
2. **Root domain can be proxied** for DDoS protection and caching benefits
3. **Always switch to Full (strict) SSL after Let's Encrypt** setup for end-to-end encryption
4. **301 redirects are permanent** - browsers cache them, use 302 for testing
5. **HSTS preload is irreversible** - only enable after thoroughly testing HTTPS

---

## Support Links

- Cloudflare DNS Documentation: https://developers.cloudflare.com/dns/
- Let's Encrypt Setup Guide: https://letsencrypt.org/getting-started/
- SSL/TLS Configuration: https://developers.cloudflare.com/ssl/
- Page Rules Documentation: https://developers.cloudflare.com/rules/page-rules/
