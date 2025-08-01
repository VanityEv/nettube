# Streamply Production Deployment Guide

## 1. Backend Deployment (Heroku)

### Wstępne przygotowanie
```bash
# Zaloguj się do Heroku
heroku login

# Utwórz aplikację Heroku
heroku create streamply-backend-prod

# Dodaj PostgreSQL addon
heroku addons:create heroku-postgresql:mini -a streamply-backend-prod

# Ustaw zmienne środowiskowe
heroku config:set NODE_ENV=production -a streamply-backend-prod
heroku config:set JWT_SECRET=$(openssl rand -base64 64) -a streamply-backend-prod
heroku config:set BACKBLAZE_APPLICATION_KEY_ID=your_key_id -a streamply-backend-prod
heroku config:set BACKBLAZE_APPLICATION_KEY=your_key -a streamply-backend-prod
heroku config:set BACKBLAZE_BUCKET_NAME=streamply-bucket-prod -a streamply-backend-prod
heroku config:set SENDGRID_API_KEY=your_sendgrid_key -a streamply-backend-prod
heroku config:set STRIPE_SECRET_KEY=your_stripe_secret -a streamply-backend-prod
heroku config:set STRIPE_WEBHOOK_SECRET=your_webhook_secret -a streamply-backend-prod

# Frontend URL (Vercel)
heroku config:set FRONTEND_URL=https://your-streamply-app.vercel.app -a streamply-backend-prod
```

### Deploy backendu
```bash
# Przejdź do katalogu backend
cd streamply-backend

# Inicjalizuj git repo (jeśli nie ma)
git init
git add .
git commit -m "Production deployment"

# Dodaj Heroku remote
heroku git:remote -a streamply-backend-prod

# Deploy
git push heroku security-dev:main

# Uruchom migracje bazy danych
heroku run npx prisma migrate deploy -a streamply-backend-prod
heroku run npx prisma generate -a streamply-backend-prod

# Sprawdź logi
heroku logs --tail -a streamply-backend-prod
```

## 2. Frontend Deployment (Vercel) - Już zdeployowany

### Aktualizacja zmiennych środowiskowych w Vercel
```bash
# Przez Vercel CLI
vercel env add VITE_API_URL production
# Wartość: https://streamply-backend-prod.herokuapp.com

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Wartość: your_stripe_publishable_key

# Lub przez dashboard Vercel:
# 1. Wejdź na https://vercel.com/dashboard
# 2. Wybierz projekt streamply-frontend
# 3. Settings → Environment Variables
# 4. Dodaj zmienne:
#    - VITE_API_URL = https://streamply-backend-prod.herokuapp.com
#    - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxx
```

### Redeploy frontendu z nowymi zmiennymi
```bash
# W katalogu frontend
cd streamply-frontend

# Aktualizacja i redeploy
vercel --prod
```

## 3. Konfiguracja Nginx Proxy

### Instalacja Nginx (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Konfiguracja główna (/etc/nginx/sites-available/streamply)
```nginx
# Upstream definitions
upstream streamply_backend {
    server streamply-backend-prod.herokuapp.com:443;
    keepalive 32;
}

upstream streamply_frontend {
    server your-streamply-app.vercel.app:443;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name streamply.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name streamply.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/streamply.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/streamply.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=streaming:10m rate=50r/m;
    
    # Logging
    access_log /var/log/nginx/streamply.access.log;
    error_log /var/log/nginx/streamply.error.log;
    
    # API Backend Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass https://streamply_backend/;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host streamply-backend-prod.herokuapp.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Authentication endpoints (stricter rate limiting)
    location ~ ^/api/(signin|signup|resetPassword) {
        limit_req zone=auth burst=3 nodelay;
        
        proxy_pass https://streamply_backend$request_uri;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host streamply-backend-prod.herokuapp.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Video streaming endpoints
    location ~ ^/api/videos/video/(hls|stream) {
        limit_req zone=streaming burst=10 nodelay;
        
        proxy_pass https://streamply_backend$request_uri;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host streamply-backend-prod.herokuapp.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Streaming optimizations
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        
        # CORS for streaming
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Authorization" always;
    }
    
    # Frontend (wszystko inne)
    location / {
        proxy_pass https://streamply_frontend;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host your-streamply-app.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            proxy_pass https://streamply_frontend;
            proxy_ssl_server_name on;
            proxy_ssl_verify off;
            proxy_set_header Host your-streamply-app.vercel.app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Aktywacja konfiguracji Nginx
```bash
# Utwórz symlink
sudo ln -s /etc/nginx/sites-available/streamply /etc/nginx/sites-enabled/

# Usuń domyślną konfigurację
sudo rm /etc/nginx/sites-enabled/default

# Sprawdź konfigurację
sudo nginx -t

# Uruchom Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 4. SSL Certificate (Let's Encrypt)

```bash
# Uzyskaj certyfikat SSL
sudo certbot --nginx -d streamply.yourdomain.com

# Automatyczne odnawianie
sudo crontab -e
# Dodaj linię:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 5. DNS Configuration

### Ustaw rekordy DNS u providera domeny:
```
A     streamply.yourdomain.com    →  YOUR_SERVER_IP
CNAME www.streamply.yourdomain.com →  streamply.yourdomain.com
```

## 6. Monitoring & Logowanie

### Logrotate dla Nginx
```bash
sudo nano /etc/logrotate.d/streamply

# Zawartość:
/var/log/nginx/streamply.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

### Monitoring dostępności
```bash
# Skrypt sprawdzający dostępność
nano /home/ubuntu/check-streamply.sh

#!/bin/bash
URL="https://streamply.yourdomain.com/health"
if ! curl -f -s $URL > /dev/null; then
    echo "Streamply is down!" | mail -s "Alert: Streamply Down" admin@yourdomain.com
    sudo systemctl restart nginx
fi

# Crontab entry (co 5 minut)
*/5 * * * * /home/ubuntu/check-streamply.sh
```

## 7. Firewall Configuration (UFW)

```bash
# Podstawowa konfiguracja firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Pozwól na SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Sprawdź status
sudo ufw status verbose
```

## 8. Aktualizacja CORS w backendzie

W pliku `streamply-backend/services/video/VideoRouter.js` zaktualizuj:
```javascript
// CORS whitelist - Production domains
const allowedOrigins = [
  'https://streamply.yourdomain.com',  // Twoja domena z proxy
  'https://your-streamply-app.vercel.app',  // Vercel backup
  'http://localhost:3000',  // Development
];
```

## 9. Testowanie deploymentu

```bash
# Test backendu przez proxy
curl -I https://streamply.yourdomain.com/api/videos/all

# Test frontendu przez proxy
curl -I https://streamply.yourdomain.com/

# Test streamingu
curl -I https://streamply.yourdomain.com/api/videos/test-cors

# Test SSL
openssl s_client -connect streamply.yourdomain.com:443 -servername streamply.yourdomain.com
```

## 10. Backup Strategy

```bash
# Backup bazy danych Heroku
heroku pg:backups:capture -a streamply-backend-prod
heroku pg:backups:download -a streamply-backend-prod

# Automatyczny backup (cron job)
0 2 * * * heroku pg:backups:capture -a streamply-backend-prod
```

---

## Podsumowanie URL-i:

- **Frontend (Vercel)**: https://your-streamply-app.vercel.app
- **Backend (Heroku)**: https://streamply-backend-prod.herokuapp.com  
- **Proxy/Main Domain**: https://streamply.yourdomain.com
- **API przez proxy**: https://streamply.yourdomain.com/api/
- **Streaming przez proxy**: https://streamply.yourdomain.com/api/videos/video/

## Kolejność deployu:
1. Deploy backend na Heroku
2. Aktualizuj zmienne środowiskowe w Vercel
3. Redeploy frontend na Vercel
4. Skonfiguruj Nginx proxy
5. Ustaw SSL certyfikat
6. Skonfiguruj DNS
7. Testuj wszystkie endpointy
