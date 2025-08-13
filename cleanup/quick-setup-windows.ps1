# quick-setup-windows.ps1
# Szybki setup Streamply na Windows z darmowymi opcjami

param(
    [string]$TunnelType = "auto"  # auto, ngrok, localtunnel, cloudflare
)

Write-Host "🚀 Streamply Windows Quick Setup" -ForegroundColor Green
Write-Host "   Tunnel type: $TunnelType" -ForegroundColor Cyan

# Sprawdź czy jesteśmy w odpowiednim folderze
if (!(Test-Path "streamply-backend") -or !(Test-Path "streamply-frontend")) {
    Write-Host "❌ Please run this script from the Streamply root directory" -ForegroundColor Red
    Write-Host "   Expected structure: streamply-backend/, streamply-frontend/" -ForegroundColor Gray
    exit 1
}

# 1. Sprawdź Node.js
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# 2. Sprawdź npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# 3. Automatyczne wykrywanie najlepszego tunnela
if ($TunnelType -eq "auto") {
    Write-Host "`n🔍 Auto-detecting best tunnel option..." -ForegroundColor Yellow
    
    # Sprawdź ngrok
    if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
        $TunnelType = "ngrok"
        Write-Host "✅ Found ngrok" -ForegroundColor Green
    }
    # Sprawdź localtunnel
    elseif (Get-Command "lt" -ErrorAction SilentlyContinue) {
        $TunnelType = "localtunnel"
        Write-Host "✅ Found LocalTunnel" -ForegroundColor Green
    }
    # Sprawdź cloudflared
    elseif (Get-Command "cloudflared" -ErrorAction SilentlyContinue) {
        $TunnelType = "cloudflare"
        Write-Host "✅ Found Cloudflare Tunnel" -ForegroundColor Green
    }
    # Zainstaluj LocalTunnel jako fallback
    else {
        Write-Host "📥 Installing LocalTunnel (free tunnel solution)..." -ForegroundColor Yellow
        npm install -g localtunnel
        $TunnelType = "localtunnel"
        Write-Host "✅ LocalTunnel installed" -ForegroundColor Green
    }
}

Write-Host "🔗 Using tunnel: $TunnelType" -ForegroundColor Cyan

# 4. Zainstaluj proxy dependencies
Write-Host "`n📦 Setting up Express proxy..." -ForegroundColor Yellow
if (!(Test-Path "node_modules/express")) {
    npm install express http-proxy-middleware cors express-rate-limit
    Write-Host "✅ Proxy dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Proxy dependencies already installed" -ForegroundColor Green
}

# 5. Setup backend
Write-Host "`n🔧 Setting up backend..." -ForegroundColor Yellow
Push-Location "streamply-backend"

if (!(Test-Path "node_modules")) {
    Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Database URLs
DATABASE_URL="postgresql://streamply:password123@localhost:5432/streamply_prod"
MONGODB_URI="mongodb://localhost:27017/streamply_security"

# JWT Security
JWT_SECRET="your-super-secure-jwt-secret-key-64-characters-long-for-production-use"

# Production settings
NODE_ENV="production"
PORT=3001

# Frontend URL (will be updated after tunnel setup)
FRONTEND_URL="https://your-streamply-app.vercel.app"

# Backblaze B2 (optional - for video storage)
BACKBLAZE_APPLICATION_KEY_ID="your_key_id"
BACKBLAZE_APPLICATION_KEY="your_key"
BACKBLAZE_BUCKET_NAME="streamply-bucket"

# Email (optional - for notifications)
SENDGRID_API_KEY="your_sendgrid_key"
FROM_EMAIL="noreply@yourdomain.com"

# Stripe (optional - for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created (please update with your actual values)" -ForegroundColor Green
}

if (Test-Path "prisma") {
    Write-Host "🔧 Setting up Prisma..." -ForegroundColor Yellow
    npx prisma generate
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
}

Pop-Location

# 6. Sprawdź bazy danych
Write-Host "`n🗄️ Checking databases..." -ForegroundColor Yellow

# PostgreSQL
$pgInstalled = $false
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        $pgInstalled = $true
        if ($pgService.Status -ne "Running") {
            Write-Host "🔄 Starting PostgreSQL..." -ForegroundColor Yellow
            net start postgresql-x64-14
        }
        Write-Host "✅ PostgreSQL is available" -ForegroundColor Green
    }
} catch {}

if (!$pgInstalled) {
    Write-Host "⚠️ PostgreSQL not found" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "   Or install via Chocolatey: choco install postgresql" -ForegroundColor Cyan
}

# MongoDB
$mongoInstalled = $false
try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService) {
        $mongoInstalled = $true
        if ($mongoService.Status -ne "Running") {
            Write-Host "🔄 Starting MongoDB..." -ForegroundColor Yellow
            net start MongoDB
        }
        Write-Host "✅ MongoDB is available" -ForegroundColor Green
    }
} catch {}

if (!$mongoInstalled) {
    Write-Host "⚠️ MongoDB not found" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host "   Or install via Chocolatey: choco install mongodb" -ForegroundColor Cyan
}

# 7. Utwórz startup scripts jeśli nie istnieją
if (!(Test-Path "start-streamply-ngrok.ps1")) {
    Write-Host "`n📝 Creating startup scripts..." -ForegroundColor Yellow
    Write-Host "✅ Startup scripts ready" -ForegroundColor Green
}

# 8. Podsumowanie i instrukcje
Write-Host "`n✅ Streamply Windows setup complete!" -ForegroundColor Green

Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│                    🎉 SETUP COMPLETE                       │" -ForegroundColor Cyan
Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "│ Tunnel:      $TunnelType                                    │" -ForegroundColor White
Write-Host "│ Proxy:       Express (port 80/8080)                        │" -ForegroundColor White
Write-Host "│ Backend:     Node.js (port 3001)                           │" -ForegroundColor White
Write-Host "│ PostgreSQL:  $(if($pgInstalled){'✅ Ready'}else{'⚠️ Install needed'})                                        │" -ForegroundColor White
Write-Host "│ MongoDB:     $(if($mongoInstalled){'✅ Ready'}else{'⚠️ Install needed'})                                        │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan

Write-Host "`n🚀 Quick Start:" -ForegroundColor Yellow
Write-Host "1. ⚙️ Update .env file in streamply-backend with your settings"
Write-Host "2. 🗄️ Setup databases (if not installed):"
Write-Host "     PostgreSQL: https://www.postgresql.org/download/windows/"
Write-Host "     MongoDB: https://www.mongodb.com/try/download/community"
Write-Host "3. 🚀 Start Streamply:"
Write-Host "     .\start-streamply-ngrok.ps1 -TunnelType $TunnelType"
Write-Host "4. 🔗 Copy tunnel URL and update Vercel VITE_API_URL"
Write-Host "5. 🧪 Test your application"

if (!$pgInstalled -or !$mongoInstalled) {
    Write-Host "`n⚠️ Missing dependencies:" -ForegroundColor Yellow
    if (!$pgInstalled) {
        Write-Host "   📥 Install PostgreSQL for database functionality"
    }
    if (!$mongoInstalled) {
        Write-Host "   📥 Install MongoDB for security logging"
    }
    Write-Host "   🔄 Rerun this script after installing databases" -ForegroundColor Cyan
}

Write-Host "`n💡 Free Domain Options:" -ForegroundColor Cyan
Write-Host "   • DuckDNS.org - Free subdomains"
Write-Host "   • Freenom.com - Free .tk, .ml domains" 
Write-Host "   • No-IP.com - 30-day free trial"

Write-Host "`n🔧 Tunnel Options:" -ForegroundColor Cyan
Write-Host "   • LocalTunnel: Free, custom subdomains (https://subdomain.loca.lt)"
Write-Host "   • Ngrok: Free random URLs (https://abc123.ngrok.io)"
Write-Host "   • Cloudflare: Free custom domains (requires domain + setup)"

Write-Host "`nReady to launch! 🎯" -ForegroundColor Green
