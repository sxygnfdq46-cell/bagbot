# Deploy Key Setup Instructions

## Public Key for VPS Authorization

**Public Key Content:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDX4WIHuEkIcbFB8c5X6Z2LWXdmALSdZ5UAdWB+fG+0u deploy@thebagbot.trade
```

## Steps to Add Public Key to VPS

### Option 1: Manual Setup (Recommended)

1. **SSH into your VPS as root or sudo user:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

2. **Create the deploy user (if not exists):**
   ```bash
   useradd -m -s /bin/bash deploy
   usermod -aG sudo deploy
   ```

3. **Set up SSH directory for deploy user:**
   ```bash
   mkdir -p /home/deploy/.ssh
   chmod 700 /home/deploy/.ssh
   ```

4. **Add the public key to authorized_keys:**
   ```bash
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDX4WIHuEkIcbFB8c5X6Z2LWXdmALSdZ5UAdWB+fG+0u deploy@thebagbot.trade" >> /home/deploy/.ssh/authorized_keys
   ```

5. **Set correct permissions:**
   ```bash
   chmod 600 /home/deploy/.ssh/authorized_keys
   chown -R deploy:deploy /home/deploy/.ssh
   ```

6. **Test the connection from your local machine:**
   ```bash
   ssh -i scripts/keys/deploy_key deploy@YOUR_VPS_IP
   ```

### Option 2: Using ssh-copy-id (Alternative)

```bash
ssh-copy-id -i scripts/keys/deploy_key.pub deploy@YOUR_VPS_IP
```

## Security Configuration

### Disable Password Authentication (After Key Works)

1. **Edit SSH config:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```

2. **Update these settings:**
   ```
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin no
   ```

3. **Restart SSH service:**
   ```bash
   sudo systemctl restart sshd
   ```

## Troubleshooting

### Connection Refused
- Ensure SSH service is running: `sudo systemctl status sshd`
- Check firewall allows port 22: `sudo ufw status`

### Permission Denied (publickey)
- Verify file permissions on VPS:
  ```bash
  ls -la /home/deploy/.ssh/
  # Should show:
  # drwx------ 2 deploy deploy 4096 ... .ssh/
  # -rw------- 1 deploy deploy  xyz ... authorized_keys
  ```

### Key Not Being Used
- Test with verbose mode:
  ```bash
  ssh -vvv -i scripts/keys/deploy_key deploy@YOUR_VPS_IP
  ```

## GitHub Actions Integration

Once the public key is added to the VPS, the GitHub Actions CI/CD pipeline will automatically use the private key stored in `VPS_SSH_KEY` secret to deploy on every push to main.

**Required GitHub Secrets:**
- `VPS_SSH_KEY` ✅ (already configured with private key)
- `VPS_HOST` ⚠️ (update with actual VPS IP: `deploy@YOUR_VPS_IP`)

**Update VPS_HOST secret:**
```bash
gh secret set VPS_HOST --body "deploy@YOUR_ACTUAL_VPS_IP" --repo sxygnfdq46-cell/BAGBOT2
```

## Next Steps After VPS Setup

1. ✅ Public key added to VPS `/home/deploy/.ssh/authorized_keys`
2. ✅ Test SSH connection with private key
3. ✅ Update GitHub `VPS_HOST` secret with real IP
4. ✅ Run provision script: `./deploy/provision_vps.sh`
5. ✅ Create `.env` file on VPS at `/srv/bagbot/.env`
6. ✅ Push to main branch to trigger automated deployment
