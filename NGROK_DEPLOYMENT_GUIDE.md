# Streamply Ngrok Deployment Guide (Windows)

## 1. Konfiguracja lokalnych baz danych

### PostgreSQL (Windows)
```powershell
# Pobierz PostgreSQL z https://www.postgresql.org/download/windows/
# Lub przez Chocolatey:
choco install postgresql

# Uruchom przez Services lub:
net start postgresql-x64-14

# Utwórz bazę danych (przez psql w Command Prompt/PowerShell)
psql -U postgres
CREATE DATABASE streamply_prod;
CREATE USER streamply WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE streamply_prod TO streamply;
\q

# Test połączenia
psql -h localhost -U streamply -d streamply_prod
```

### MongoDB (Windows)
```powershell
# Pobierz MongoDB z https://www.mongodb.com/try/download/community
# Lub przez Chocolatey:
choco install mongodb

# Uruchom MongoDB (jako Windows Service lub ręcznie):
net start MongoDB

# Ręczne uruchomienie (jeśli nie jako service):
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db"

# Test połączenia (w nowym terminalu)
"C:\Program Files\MongoDB\Server\6.0\bin\mongosh.exe"
use streamply_security
db.createCollection("security_events")
exit
```

## 2. Konfiguracja środowiska lokalnego

### Plik .env dla backendu (streamply-backend/.env)
```env
# Database
DATABASE_URL="postgresql://streamply:your_secure_password@localhost:5432/streamply_prod"
MONGODB_URI="mongodb://localhost:27017/streamply_security"

# JWT Security
JWT_SECRET="your-super-secure-jwt-secret-key-64-characters-long-for-production"

# Backblaze B2
BACKBLAZE_APPLICATION_KEY_ID="your_key_id"
BACKBLAZE_APPLICATION_KEY="your_key"
BACKBLAZE_BUCKET_NAME="streamply-bucket-prod"

# Email (SendGrid)
SENDGRID_API_KEY="your_sendgrid_key"
FROM_EMAIL="noreply@yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Production settings
NODE_ENV="production"
PORT=3001

# Frontend URL (będzie zaktualizowany po uruchomieniu ngrok)
FRONTEND_URL="https://your-streamply-app.vercel.app"
```

## 3. Instalacja i konfiguracja ngrok (Windows)

### Instalacja ngrok
```powershell
# Opcja 1: Pobierz z https://ngrok.com/download
# Wypakuj ngrok.exe do folderu w PATH (np. C:\tools\ngrok\)

# Opcja 2: Przez Chocolatey
choco install ngrok

# Opcja 3: Przez Scoop
scoop install ngrok

# Autoryzacja (zarejestruj się na https://ngrok.com - DARMOWY PLAN)
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

### Konfiguracja ngrok dla darmowego planu
```yaml
# %USERPROFILE%\.ngrok2\ngrok.yml (dla starszej wersji)
# lub %USERPROFILE%\AppData\Local\ngrok\ngrok.yml (dla nowszej wersji)
version: "2"
authtoken: YOUR_NGROK_TOKEN

# UWAGA: Darmowy plan ngrok nie pozwala na custom subdomain
# Będziesz dostawać losowe URL typu: https://abc123.ngrok.io

tunnels:
  streamply-backend:
    proto: http
    addr: 3001
    # subdomain: streamply-backend  # Nie dostępne w darmowym planie
    
  streamply-proxy:
    proto: http
    addr: 80
    # subdomain: streamply-app     # Nie dostępne w darmowym planie
```

### DARMOWE DOMENY - Alternatywy dla ngrok:

#### Opcja A: Ngrok darmowy + darmowa domena
```powershell
# 1. Ngrok darmowy (losowe URL)
ngrok http 3001
# Dostaniesz: https://abc123.ngrok.io

# 2. Darmowa domena przez Freenom, No-IP, DuckDNS
# - Freenom: https://www.freenom.com (.tk, .ml, .ga, .cf)
# - No-IP: https://www.noip.com (30 dni free)
# - DuckDNS: https://www.duckdns.org (zawsze free)

# 3. CNAME record pointing do ngrok URL
# your-app.freenom-domain.tk -> abc123.ngrok.io
```

#### Opcja B: Cloudflare Tunnel (100% darmowy)
```powershell
# Pobierz cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Zaloguj się
cloudflared tunnel login

# Utwórz tunel
cloudflared tunnel create streamply

# Skonfiguruj tunel
# Utwórz plik config.yml w %USERPROFILE%\.cloudflared\
```

#### Opcja C: LocalTunnel (darmowy)
```powershell
# Instalacja
npm install -g localtunnel

# Uruchomienie
lt --port 3001 --subdomain streamply-backend
# Dostaniesz: https://streamply-backend.loca.lt
```

## 4. Przygotowanie backendu (Windows)

### Inicjalizacja bazy danych
```powershell
cd streamply-backend

# Zainstaluj dependencies
npm install

# Wygeneruj Prisma client
npx prisma generate

# Uruchom migracje
npx prisma migrate deploy

# Opcjonalnie: załaduj przykładowe dane
npx prisma db seed
```

### Uruchomienie backendu w trybie produkcyjnym
```powershell
# Build (jeśli potrzebne)
npm run build

# Uruchom backend
$env:NODE_ENV="production"; npm start

# Lub z PM2 dla lepszej stabilności
npm install -g pm2
pm2 start index.js --name "streamply-backend" --env production
pm2 startup
pm2 save
```

## 5. Nginx na Windows (lub alternatywy)

### Opcja A: Nginx for Windows
```powershell
# Pobierz z http://nginx.org/en/download.html
# Wypakuj do C:\nginx

# Przejdź do folderu nginx
cd C:\nginx

# Edytuj conf\nginx.conf
notepad conf\nginx.conf
```

### Konfiguracja Nginx (C:\nginx\conf\nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    # Upstream definitions
    upstream streamply_backend {
        server localhost:3001;
        keepalive 32;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=streaming:10m rate=50r/m;
    
    server {
        listen 80;
        server_name localhost;
        
        # Security Headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Logging
        access_log logs/streamply.access.log;
        error_log logs/streamply.error.log;
        
        # API Backend Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://streamply_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Fingerprint" always;
            add_header Access-Control-Allow-Credentials "true" always;
            
            # Handle preflight requests
            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin "*" always;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
                add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Fingerprint" always;
                add_header Access-Control-Max-Age 1728000;
                add_header Content-Type "text/plain; charset=utf-8";
                add_header Content-Length 0;
                return 204;
            }
        }
        
        # Frontend proxy (przekieruj do Vercel)
        location / {
            proxy_pass https://your-streamply-app.vercel.app;
            proxy_ssl_server_name on;
            proxy_ssl_verify off;
            proxy_set_header Host your-streamply-app.vercel.app;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Opcja B: Express Proxy (prostsze na Windows)
Jeśli Nginx sprawia problemy, możesz użyć prostego Express proxy:

```javascript
// proxy-server.js w głównym folderze
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 80; // lub 8080 jeśli 80 jest zajęty

// CORS dla wszystkich requestów
app.use(cors({
  origin: '*',
  credentials: true
}));

// Proxy do backendu
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/' // usuń /api prefix
  }
}));

// Proxy do frontendu (Vercel)
app.use('/', createProxyMiddleware({
  target: 'https://your-streamply-app.vercel.app',
  changeOrigin: true,
  secure: true
}));

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
```

```powershell
# Instalacja dependencies dla proxy
npm install express http-proxy-middleware cors

# Uruchomienie proxy
node proxy-server.js
```

### Uruchomienie Nginx (Windows)
```powershell
# Przejdź do folderu nginx
cd C:\nginx

# Sprawdź konfigurację
nginx -t

# Uruchom nginx
start nginx

# Lub w tle
nginx

# Zatrzymanie nginx
nginx -s stop

# Restart nginx
nginx -s reload
```

## 6. Uruchomienie ngrok (Windows)

### Opcja A: Ngrok darmowy (losowe URL)
```powershell
# Terminal 1: Backend
cd streamply-backend
$env:NODE_ENV="production"; npm start

# Terminal 2: Proxy (nginx lub express)
# Jeśli nginx:
cd C:\nginx
nginx

# Jeśli express proxy:
node proxy-server.js

# Terminal 3: Ngrok dla proxy
ngrok http 80

# Terminal 4 (opcjonalnie): Ngrok bezpośrednio dla backendu
ngrok http 3001
```

### Opcja B: LocalTunnel (darmowy z custom subdomain)
```powershell
# Instalacja
npm install -g localtunnel

# Uruchomienie z custom subdomain
lt --port 80 --subdomain streamply-app
# Dostaniesz: https://streamply-app.loca.lt

# Backup dla backendu
lt --port 3001 --subdomain streamply-api
# Dostaniesz: https://streamply-api.loca.lt
```

### Opcja C: Cloudflare Tunnel (darmowy + custom domain)
```powershell
# 1. Pobierz cloudflared z:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# 2. Zaloguj się (potrzebujesz darmowe konto Cloudflare)
cloudflared tunnel login

# 3. Utwórz tunel
cloudflared tunnel create streamply-backend

# 4. Skonfiguruj DNS (w Cloudflare dashboard)
# Dodaj CNAME record: api.yourdomain.com -> xxx.cfargotunnel.com

# 5. Utwórz config file: %USERPROFILE%\.cloudflared\config.yml
```

#### Config dla Cloudflare Tunnel:
```yaml
# %USERPROFILE%\.cloudflared\config.yml
tunnel: YOUR_TUNNEL_ID
credentials-file: C:\Users\YourUser\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

```powershell
# Uruchomienie Cloudflare Tunnel
cloudflared tunnel run streamply-backend
```

## 7. Aktualizacja zmiennych środowiskowych

### Po uruchomieniu ngrok, zaktualizuj:

#### Backend (.env)
```bash
# Zaktualizuj FRONTEND_URL po otrzymaniu ngrok URL
# np. jeśli ngrok proxy działa na https://abc123.ngrok.io
echo "FRONTEND_URL=https://your-streamply-app.vercel.app" >> .env
```

#### Frontend (Vercel Environment Variables)
```bash
# Przez Vercel CLI
vercel env add VITE_API_URL production
# Wartość: https://abc123.ngrok.io/api (URL z ngrok proxy)

# Lub bezpośrednio do backendu:
# Wartość: https://def456.ngrok.io (URL z ngrok backend)
```

#### Aktualizacja CORS w backendzie
W pliku `services/video/VideoRouter.js`:
```javascript
const allowedOrigins = [
  'https://abc123.ngrok.io',  // Twój ngrok proxy URL
  'https://def456.ngrok.io',  // Twój ngrok backend URL (jeśli używasz)
  'https://your-streamply-app.vercel.app',  // Vercel frontend
  'http://localhost:3000',  // Development
  'http://localhost:3001',  // Local backend
  'http://localhost',       // Local nginx
];
```

## 8. Uruchomienie kompletnego systemu (Windows)

### Skrypt startowy (start-streamply-ngrok.ps1)
```powershell
# start-streamply-ngrok.ps1

Write-Host "🚀 Starting Streamply with ngrok..." -ForegroundColor Green

# Sprawdź czy bazy danych działają
Write-Host "Checking databases..." -ForegroundColor Yellow

# PostgreSQL
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not running! Starting..." -ForegroundColor Red
    net start postgresql-x64-14
}

# MongoDB
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -eq "Running") {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB not running! Starting..." -ForegroundColor Red
    net start MongoDB
}

# Uruchom backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd streamply-backend; `$env:NODE_ENV='production'; npm start"
Start-Sleep -Seconds 3

# Uruchom proxy (nginx lub express)
Write-Host "Starting proxy..." -ForegroundColor Yellow
if (Test-Path "C:\nginx\nginx.exe") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\nginx; nginx"
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "node proxy-server.js"
}
Start-Sleep -Seconds 2

# Uruchom ngrok
Write-Host "Starting ngrok..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 80"

Write-Host "✅ Streamply started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy ngrok URL from ngrok dashboard (http://localhost:4040)"
Write-Host "2. Update VITE_API_URL in Vercel"
Write-Host "3. Update CORS origins in backend"
Write-Host "4. Test the application"
```

### Zatrzymanie systemu (stop-streamply.ps1)
```powershell
# stop-streamply.ps1

Write-Host "🛑 Stopping Streamply..." -ForegroundColor Red

# Zatrzymaj ngrok
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

# Zatrzymaj backend Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*index.js*" } | Stop-Process -Force

# Zatrzymaj nginx (opcjonalnie)
if (Test-Path "C:\nginx\nginx.exe") {
    & "C:\nginx\nginx.exe" -s stop
}

Write-Host "✅ Streamply stopped!" -ForegroundColor Green
```

### Uruchomienie skryptów
```powershell
# Nadaj uprawnienia wykonania (jeśli potrzebne)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Uruchom startup
.\start-streamply-ngrok.ps1

# Zatrzymaj wszystko
.\stop-streamply.ps1
```

## 9. Monitoring i debugging (Windows)

### Sprawdzanie statusu
```powershell
# Status backendu
Invoke-RestMethod -Uri "http://localhost:3001/videos/test-cors"

# Status przez proxy
Invoke-RestMethod -Uri "http://localhost/api/videos/test-cors"

# Status przez ngrok (sprawdź URL w ngrok dashboard)
Invoke-RestMethod -Uri "https://abc123.ngrok.io/api/videos/test-cors"

# Sprawdź procesy
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*index.js*" }
Get-Process -Name "nginx" -ErrorAction SilentlyContinue
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

# Status baz danych
Get-Service -Name "postgresql*"
Get-Service -Name "MongoDB"

# Logi nginx (jeśli używasz nginx)
Get-Content "C:\nginx\logs\access.log" -Tail 20
Get-Content "C:\nginx\logs\error.log" -Tail 20
```

### Ngrok dashboard
```
http://localhost:4040
```

## 10. Troubleshooting (Windows)

### Problem: CORS errors
```javascript
// W VideoRouter.js dodaj localhost i ngrok domeny
const allowedOrigins = [
  '*',  // Tymczasowo dla testów
  // lub konkretne domeny:
  'https://abc123.ngrok.io',
  'https://streamply-app.loca.lt',
  'https://your-streamply-app.vercel.app',
];
```

### Problem: Database connection errors
```powershell
# Sprawdź czy bazy działają
net stop postgresql-x64-14
net start postgresql-x64-14

net stop MongoDB
net start MongoDB

# Sprawdź połączenie
psql -h localhost -U streamply -d streamply_prod -c "SELECT version();"
mongosh --eval "db.adminCommand('ismaster')"
```

### Problem: Port 80 zajęty (Windows)
```powershell
# Sprawdź co używa portu 80
netstat -ano | findstr :80

# Użyj innego portu dla proxy
# W nginx.conf zmień na: listen 8080;
# Lub w proxy-server.js: const PORT = 8080;

# Uruchom ngrok na nowym porcie
ngrok http 8080
```

### Problem: Ngrok tunnel disconnected
```powershell
# Uruchom ponownie z debugowaniem
ngrok http 80 --log=stdout

# Lub użyj LocalTunnel jako backup
lt --port 80 --subdomain streamply-app
```

### Problem: PowerShell Execution Policy
```powershell
# Jeśli nie możesz uruchomić skryptów .ps1
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Lub uruchom bezpośrednio:
powershell -ExecutionPolicy Bypass -File .\start-streamply-ngrok.ps1
```

---

## URLs w tym setupie:

- **Backend lokalny**: http://localhost:3001
- **Nginx proxy lokalny**: http://localhost:80 (lub 8080)
- **Express proxy lokalny**: http://localhost:80 (lub 8080)
- **Ngrok proxy**: https://abc123.ngrok.io (losowy URL)
- **LocalTunnel**: https://streamply-app.loca.lt (custom subdomain)
- **Cloudflare Tunnel**: https://api.yourdomain.com (twoja domena)
- **Frontend (Vercel)**: https://your-streamply-app.vercel.app
- **API przez tunnel**: https://abc123.ngrok.io/api/
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Ngrok dashboard**: http://localhost:4040

## Zalety tego setupu:
- ✅ Szybkie uruchomienie na Windows
- ✅ Lokalne bazy danych (szybkie, bez kosztów)
- ✅ HTTPS przez ngrok/LocalTunnel/Cloudflare
- ✅ Możliwość testowania z zewnątrz
- ✅ Łatwe debugowanie
- ✅ **DARMOWE opcje tunelowania**
- ✅ **Darmowe domeny dostępne**
- ✅ Brak kosztów cloud provider-ów

## Rekomendowane opcje dla darmowego setupu:

### Opcja 1: LocalTunnel (najprostrza)
```powershell
# Jedna komenda, custom subdomain
lt --port 80 --subdomain streamply-app
# → https://streamply-app.loca.lt
```

### Opcja 2: Ngrok Free + DuckDNS
```powershell
# 1. Ngrok darmowy
ngrok http 80
# → https://abc123.ngrok.io

# 2. Zarejestruj darmową domenę na DuckDNS.org
# 3. CNAME: streamply.duckdns.org → abc123.ngrok.io
```

### Opcja 3: Cloudflare Tunnel + darmowa domena
```powershell
# Najstabilniejsze rozwiązanie, ale wymaga więcej konfiguracji
# Darmowa domena z Freenom + Cloudflare Tunnel
```
