# Deployment Guide - Cubie Application

This guide provides step-by-step instructions for deploying the Cubie application to an EC2 instance with HTTPS, reverse proxy (Nginx), and PM2 process management.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Server Configuration](#server-configuration)
4. [PM2 Setup](#pm2-setup)
5. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
6. [HTTPS Configuration (Let's Encrypt)](#https-configuration-lets-encrypt)
7. [Application Deployment](#application-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 LTS recommended)
- Domain name (for SSL certificate)
- SSH access to EC2 instance
- Basic knowledge of Linux commands

---

## EC2 Instance Setup

### 1. Launch EC2 Instance

1. Log in to AWS Console
2. Launch a new EC2 instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (or larger for production)
   - **Security Group**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Key Pair**: Create or use existing key pair

### 2. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

### 3. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Server Configuration

### 1. Install Node.js (v18 or later)

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install MongoDB

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Install Git

```bash
sudo apt install git -y
```

### 4. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 5. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## PM2 Setup

### 1. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/your-username/Cubie-SecureFullStackDeployment.git
cd Cubie-SecureFullStackDeployment
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies (if building frontend on server)
cd ../client
npm install
npm run build
```

### 3. Configure Environment Variables

```bash
# Create .env file in server directory
cd /home/ubuntu/Cubie-SecureFullStackDeployment/server
nano .env
```

Add the following environment variables:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/cubie
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_TOKEN_EXPIRES_IN=7d
CLIENT_ORIGIN_URL=https://your-domain.com
SESSION_SECRET=your-session-secret-change-this
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### 4. Create Logs Directory

```bash
mkdir -p /home/ubuntu/Cubie-SecureFullStackDeployment/server/logs
```

### 5. Start Application with PM2

```bash
cd /home/ubuntu/Cubie-SecureFullStackDeployment/server
pm2 start ecosystem.config.js
```

### 6. Save PM2 Configuration

```bash
pm2 save
pm2 startup
# Follow the instructions to enable PM2 on system startup
```

### 7. Useful PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs cubie-api-server

# Restart application
pm2 restart cubie-api-server

# Stop application
pm2 stop cubie-api-server

# Monitor resources
pm2 monit
```

---

## Nginx Reverse Proxy Setup

### 1. Copy Nginx Configuration

```bash
# Copy the nginx.conf to Nginx sites-available
sudo cp /home/ubuntu/Cubie-SecureFullStackDeployment/nginx.conf /etc/nginx/sites-available/cubie-api

# Edit the configuration file to update domain name
sudo nano /etc/nginx/sites-available/cubie-api
```

Update the `server_name` directive with your domain name:

```nginx
server_name api.yourdomain.com;
```

### 2. Enable Site

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/cubie-api /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## HTTPS Configuration (Let's Encrypt)

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate

```bash
# Replace with your domain name
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts:

- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 3. Update Nginx Configuration

Certbot will automatically update your Nginx configuration with SSL certificates. Verify the configuration:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Auto-Renewal Setup

Certbot automatically sets up a cron job for renewal. Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## Application Deployment

### 1. Frontend Deployment (Optional - if serving from same server)

If you want to serve the frontend from the same server:

```bash
cd /home/ubuntu/Cubie-SecureFullStackDeployment/client
npm run build

# Copy build files to Nginx web root
sudo cp -r dist/* /var/www/html/
```

Or configure Nginx to serve the frontend:

```nginx
# Add to nginx.conf
location / {
    root /var/www/cubie-frontend;
    try_files $uri $uri/ /index.html;
}
```

### 2. Update Environment Variables

After deployment, update environment variables if needed:

```bash
cd /home/ubuntu/Cubie-SecureFullStackDeployment/server
nano .env
pm2 restart cubie-api-server
```

---

## Monitoring and Maintenance

### 1. Monitor Application Logs

```bash
# View PM2 logs
pm2 logs cubie-api-server

# View Nginx logs
sudo tail -f /var/log/nginx/cubie_api_access.log
sudo tail -f /var/log/nginx/cubie_api_error.log
```

### 2. Check Application Status

```bash
# PM2 status
pm2 status

# System resources
pm2 monit

# Check if Nginx is running
sudo systemctl status nginx

# Check if MongoDB is running
sudo systemctl status mongod
```

### 3. Update Application

```bash
cd /home/ubuntu/Cubie-SecureFullStackDeployment
git pull origin main

# Update dependencies if needed
cd server
npm install

# Restart application
pm2 restart cubie-api-server
```

### 4. Backup Database

```bash
# Create backup
mongodump --out /home/ubuntu/backups/$(date +%Y%m%d)

# Restore backup
mongorestore /home/ubuntu/backups/20240101
```

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs cubie-api-server --err

# Check if port is in use
sudo lsof -i :5001

# Check environment variables
pm2 env cubie-api-server
```

### Nginx Not Working

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if Nginx is running
sudo systemctl status nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew
```

---

## Security Checklist

- [ ] Change default SSH port (optional but recommended)
- [ ] Set up SSH key authentication (disable password auth)
- [ ] Configure firewall (UFW)
- [ ] Use strong JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS only
- [ ] Set up regular backups
- [ ] Monitor logs regularly
- [ ] Keep system packages updated
- [ ] Use environment variables for sensitive data
- [ ] Restrict MongoDB access (bind to localhost)

---

## Summary

After completing these steps, your application should be:

✅ Deployed on EC2 instance  
✅ Running with PM2 process manager  
✅ Accessible through Nginx reverse proxy  
✅ Secured with HTTPS (SSL/TLS)  
✅ Protected with JWT authentication

Your API will be accessible at: `https://api.yourdomain.com/api`

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
