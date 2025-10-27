# SIP-KPBJ Deployment Guide

This guide provides step-by-step instructions for deploying the SIP-KPBJ application to a VPS server with domain configuration.

## Prerequisites

- VPS server (e.g., from Niagahoster)
- Domain name (sipakat-bpj.co.id)
- SSH access to VPS
- Node.js 18+ installed on VPS
- PostgreSQL 15+ installed on VPS

## Project Structure

The application consists of:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Database**: PostgreSQL

## VPS Setup

### 1. Connect to VPS

```bash
ssh username@your-vps-ip
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 4. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
```

Start PostgreSQL service:
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. Setup PostgreSQL Database

Switch to postgres user:
```bash
sudo -u postgres psql
```

Create database and user:
```sql
CREATE DATABASE sipkpdb;
CREATE USER sipkpuser WITH PASSWORD 'Djisamsoe17+';
GRANT ALL PRIVILEGES ON DATABASE sipkpdb TO sipkpuser;
\q
```

### 6. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Application Deployment

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/spkmb.git
cd spkmb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file:
```bash
nano .env
```

Add the following content:
```env
DATABASE_URL="postgresql://sipkpuser:Djisamsoe17+@localhost:5432/sipkpdb?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="production"
PORT=3001
```

### 4. Database Setup

Generate Prisma client and push schema:
```bash
npx prisma generate
npx prisma db push
```

Optional: Seed database with sample data:
```bash
npx prisma db seed
```

### 5. Build Application

Build both frontend and backend:
```bash
npm run build
npm run build:server
```

### 6. Start Application with PM2

```bash
pm2 start dist/server.js --name sipkp-app
pm2 startup
pm2 save
```

### 7. Configure Nginx (Web Server)

Install Nginx:
```bash
sudo apt install nginx -y
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/sipakat-bpj
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name sipakat-bpj.co.id www.sipakat-bpj.co.id;

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static files and handle React routing
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sipakat-bpj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Domain Configuration

### 1. DNS Setup

In your Niagahoster control panel:
1. Go to Domain Management
2. Select sipakat-bpj.co.id
3. Update DNS records:
   - **Type**: A
   - **Name**: @
   - **Value**: your-vps-ip-address
   - **Type**: CNAME
   - **Name**: www
   - **Value**: sipakat-bpj.co.id

### 2. SSL Certificate (Let's Encrypt)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d sipakat-bpj.co.id -d www.sipakat-bpj.co.id
```

Follow the prompts to configure SSL.

## Firewall Configuration

Configure UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Monitoring and Maintenance

### PM2 Commands

```bash
pm2 status                    # Check app status
pm2 logs sipkp-app           # View logs
pm2 restart sipkp-app        # Restart app
pm2 stop sipkp-app           # Stop app
pm2 delete sipkp-app         # Delete app
```

### Nginx Commands

```bash
sudo systemctl status nginx
sudo systemctl reload nginx
sudo nginx -t
```

### Database Backup

Create backup script:
```bash
sudo nano /usr/local/bin/backup-db.sh
```

Add content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U sipkpuser -h localhost sipkpdb > /home/username/backups/sipkpdb_$DATE.sql
find /home/username/backups -name "sipkpdb_*.sql" -mtime +7 -delete
```

Make executable and add to cron:
```bash
chmod +x /usr/local/bin/backup-db.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   - Check PM2 logs: `pm2 logs sipkp-app`
   - Verify environment variables in `.env`
   - Check database connection

2. **Database connection error**
   - Verify DATABASE_URL in `.env`
   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Test connection: `psql -U sipkpuser -d sipkpdb -h localhost`

3. **Nginx errors**
   - Check configuration: `sudo nginx -t`
   - View logs: `sudo tail -f /var/log/nginx/error.log`

4. **Domain not resolving**
   - Check DNS propagation: `nslookup sipakat-bpj.co.id`
   - Verify DNS records in Niagahoster panel

### Logs Locations

- **Application logs**: `pm2 logs sipkp-app`
- **Nginx access logs**: `/var/log/nginx/access.log`
- **Nginx error logs**: `/var/log/nginx/error.log`
- **PostgreSQL logs**: `/var/log/postgresql/postgresql-15-main.log`

## Security Considerations

1. **Change default passwords**
2. **Use strong JWT secret**
3. **Enable SSL/TLS**
4. **Regular updates**: `sudo apt update && sudo apt upgrade`
5. **Monitor logs regularly**
6. **Backup database regularly**

## Performance Optimization

1. **Enable gzip compression in Nginx**
2. **Set up caching headers**
3. **Optimize database queries**
4. **Monitor resource usage with PM2**

## Support

For issues or questions:
- Check application logs
- Verify configuration files
- Test API endpoints: `curl http://localhost:3001/api/health`
- Contact development team

---

**Deployment completed successfully!**

Your SIP-KPBJ application should now be accessible at:
- **URL**: https://sipakat-bpj.co.id
- **API**: https://sipakat-bpj.co.id/api/health
