#!/bin/bash
# VPS Provisioning Script for Bagbot
# Run as root on fresh Ubuntu 22.04 VPS

set -e

echo "🚀 Starting VPS provisioning..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "📦 Installing Docker, nginx, fail2ban, ufw..."
apt install -y \
    docker.io \
    docker-compose-plugin \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    git \
    curl \
    htop

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Create deploy user
echo "👤 Creating deploy user..."
if ! id -u deploy > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
    chmod 440 /etc/sudoers.d/deploy
fi

# Setup SSH for deploy user
echo "🔑 Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo "📝 Add your SSH public key to /home/deploy/.ssh/authorized_keys"
echo "   Option 1: ssh-copy-id -i scripts/keys/deploy_key.pub deploy@<VPS_IP>"
echo "   Option 2: cat scripts/keys/deploy_key.pub | ssh root@<VPS_IP> 'cat >> /home/deploy/.ssh/authorized_keys'"

# Configure UFW firewall
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# Allow backend port (only if needed for direct access)
# ufw allow 8000/tcp
echo "y" | ufw enable

# Configure fail2ban
echo "🛡️ Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOF

systemctl restart fail2ban

# Harden SSH (will be applied after you add your key)
echo "🔒 SSH hardening config ready..."
cat > /root/harden_ssh.sh <<'EOF'
#!/bin/bash
# Run this AFTER adding your SSH key to deploy user
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "✅ SSH hardened - root login and password auth disabled"
EOF
chmod +x /root/harden_ssh.sh

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /srv/bagbot
chown -R deploy:deploy /srv/bagbot

# Create systemd service for bagbot
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/bagbot.service <<'EOF'
[Unit]
Description=Bagbot docker stack
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/srv/bagbot
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=deploy
Group=deploy

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo ""
echo "✅ VPS provisioning complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
echo "2. Test SSH login: ssh -i scripts/keys/deploy_key deploy@<VPS_IP>"
echo "3. Run: sudo /root/harden_ssh.sh (after confirming SSH key works)"
echo "4. Clone repo to /srv/bagbot: cd /srv/bagbot && git clone <REPO_URL> ."
echo "5. Create .env file in /srv/bagbot from .env.production.example"
echo "6. Configure nginx: sudo cp deploy/nginx.conf /etc/nginx/sites-available/bagbot"
echo "7. Enable site: sudo ln -s /etc/nginx/sites-available/bagbot /etc/nginx/sites-enabled/"
echo "8. Test nginx: sudo nginx -t && sudo systemctl restart nginx"
echo "9. Run certbot: sudo certbot --nginx -d thebagbot.trade -d api.thebagbot.trade"
echo "10. Start bagbot: sudo systemctl enable bagbot.service && sudo systemctl start bagbot.service"
echo ""
