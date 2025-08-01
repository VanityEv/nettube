# start-streamply-ngrok.ps1
# Skrypt startowy dla Streamply z ngrok na Windows

param(
    [string]$TunnelType = "localtunnel",  # localtunnel, ngrok, cloudflare
    [int]$ProxyPort = 80,
    [int]$BackendPort = 3001,
    [string]$ProxyType = "express"  # express, nginx
)

Write-Host "🚀 Starting Streamply with $TunnelType tunnel..." -ForegroundColor Green
Write-Host "   Proxy: $ProxyType on port $ProxyPort" -ForegroundColor Cyan
Write-Host "   Backend: Node.js on port $BackendPort" -ForegroundColor Cyan
Write-Host "   Using LocalTunnel (no session limits!) 🎉" -ForegroundColor Green

# Sprawdź czy Node.js jest zainstalowany
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Sprawdź czy bazy danych działają
Write-Host "`n🔍 Checking databases..." -ForegroundColor Yellow

# PostgreSQL
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting PostgreSQL..." -ForegroundColor Yellow
        net start postgresql-x64-14
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "⚠️ PostgreSQL service not found. Please install PostgreSQL." -ForegroundColor Yellow
}

# MongoDB
try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction Stop
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting MongoDB..." -ForegroundColor Yellow
        net start MongoDB
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "⚠️ MongoDB service not found. Please install MongoDB." -ForegroundColor Yellow
}

# Sprawdź czy potrzebne pakiety są zainstalowane
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

if ($ProxyType -eq "express") {
    if (!(Test-Path "node_modules/express")) {
        Write-Host "📥 Installing proxy dependencies..." -ForegroundColor Yellow
        npm install express http-proxy-middleware cors express-rate-limit
    }
}

# Sprawdź czy backend dependencies są zainstalowane
if (Test-Path "streamply-backend") {
    Push-Location "streamply-backend"
    if (!(Test-Path "node_modules")) {
        Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Wygeneruj Prisma client jeśli potrzebne
    if (Test-Path "prisma") {
        Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
        npx prisma generate
    }
    Pop-Location
}

# Sprawdź czy porty są wolne
Write-Host "`n🔍 Checking ports..." -ForegroundColor Yellow

$portsToCheck = @($ProxyPort, $BackendPort)
foreach ($port in $portsToCheck) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "⚠️ Port $port is already in use!" -ForegroundColor Yellow
        if ($port -eq $ProxyPort) {
            $ProxyPort = 8080
            Write-Host "   Using alternative port $ProxyPort for proxy" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

# Uruchom backend
Write-Host "`n🚀 Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd streamply-backend; Write-Host '🔥 Backend starting on port $BackendPort...' -ForegroundColor Green; `$env:NODE_ENV='production'; `$env:PORT='$BackendPort'; npm start"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Test backend
try {
    $backendTest = Invoke-RestMethod -Uri "http://localhost:$BackendPort/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend health check failed, but continuing..." -ForegroundColor Yellow
}

# Uruchom proxy
Write-Host "🔄 Starting $ProxyType proxy on port $ProxyPort..." -ForegroundColor Yellow

if ($ProxyType -eq "express") {
    # Express proxy
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '🌐 Express Proxy starting on port $ProxyPort...' -ForegroundColor Green; `$env:PROXY_PORT='$ProxyPort'; node proxy-server.js"
    ) -WindowStyle Normal
} elseif ($ProxyType -eq "nginx" -and (Test-Path "C:\nginx\nginx.exe")) {
    # Nginx proxy
    Start-Process powershell -ArgumentList @(
        "-NoExit", 
        "-Command",
        "cd C:\nginx; Write-Host '🌐 Nginx starting on port $ProxyPort...' -ForegroundColor Green; nginx"
    ) -WindowStyle Normal
} else {
    Write-Host "⚠️ Nginx not found, falling back to Express proxy..." -ForegroundColor Yellow
    $ProxyType = "express"
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command", 
        "Write-Host '🌐 Express Proxy starting on port $ProxyPort...' -ForegroundColor Green; `$env:PROXY_PORT='$ProxyPort'; node proxy-server.js"
    ) -WindowStyle Normal
}

Start-Sleep -Seconds 3

# Test proxy
try {
    $proxyTest = Invoke-RestMethod -Uri "http://localhost:$ProxyPort/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Proxy is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Proxy health check failed, but continuing..." -ForegroundColor Yellow
}

# Uruchom tunnel
Write-Host "`n🌐 Starting $TunnelType tunnel..." -ForegroundColor Yellow

switch ($TunnelType.ToLower()) {
    "ngrok" {
        if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "Write-Host '🔗 Ngrok tunnel starting...' -ForegroundColor Green; Write-Host 'Dashboard: http://localhost:4040' -ForegroundColor Cyan; ngrok http $ProxyPort"
            ) -WindowStyle Normal
            Write-Host "📊 Ngrok dashboard will be available at: http://localhost:4040" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Ngrok not found! Please install ngrok first." -ForegroundColor Red
        }
    }
    "localtunnel" {
        if (Get-Command "lt" -ErrorAction SilentlyContinue) {
            Write-Host "🔗 LocalTunnel starting..." -ForegroundColor Green
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "Write-Host '🌐 LocalTunnel connecting to port $ProxyPort...' -ForegroundColor Green; lt --port $ProxyPort"
            ) -WindowStyle Normal
            Start-Sleep -Seconds 3
            Write-Host "🌐 Your tunnel URL will be displayed in the tunnel terminal window" -ForegroundColor Cyan
        } else {
            Write-Host "📥 LocalTunnel not found! Installing..." -ForegroundColor Yellow
            npm install -g localtunnel
            Start-Sleep -Seconds 3
            Write-Host "🔗 Starting LocalTunnel..." -ForegroundColor Green
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "Write-Host '🌐 LocalTunnel connecting to port $ProxyPort...' -ForegroundColor Green; lt --port $ProxyPort"
            ) -WindowStyle Normal
            Start-Sleep -Seconds 3
            Write-Host "🌐 Your tunnel URL will be displayed in the tunnel terminal window" -ForegroundColor Cyan
        }
    }
    "cloudflare" {
        if (Get-Command "cloudflared" -ErrorAction SilentlyContinue) {
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "Write-Host '🔗 Cloudflare tunnel starting...' -ForegroundColor Green; cloudflared tunnel --url http://localhost:$ProxyPort"
            ) -WindowStyle Normal
        } else {
            Write-Host "❌ Cloudflared not found! Please install cloudflared first." -ForegroundColor Red
            Write-Host "   Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Cyan
        }
    }
    default {
        Write-Host "❌ Unknown tunnel type: $TunnelType" -ForegroundColor Red
        Write-Host "   Available options: ngrok, localtunnel, cloudflare" -ForegroundColor Cyan
    }
}

Start-Sleep -Seconds 3

# Podsumowanie
Write-Host "`n✅ Streamply deployment started!" -ForegroundColor Green
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│                    🚀 STREAMPLY RUNNING                     │" -ForegroundColor Cyan  
Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "│ Backend:     http://localhost:$BackendPort                            │" -ForegroundColor White
Write-Host "│ Proxy:       http://localhost:$ProxyPort ($ProxyType)                    │" -ForegroundColor White
Write-Host "│ Tunnel:      $TunnelType (check terminal for URL)               │" -ForegroundColor White
Write-Host "│ Dashboard:   http://localhost:4040 (if ngrok)              │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. 📋 Copy tunnel URL from the tunnel terminal window"
Write-Host "2. 🔧 Update VITE_API_URL in Vercel environment variables"
Write-Host "3. 🔗 Update CORS origins in streamply-backend (if needed)"
Write-Host "4. 🧪 Test the application end-to-end"
Write-Host "5. 🛑 Run .\stop-streamply.ps1 to stop all services"

Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
Write-Host "- Check all terminal windows for errors"
Write-Host "- Verify databases are running: Get-Service postgresql*, MongoDB"
Write-Host "- Test endpoints: Invoke-RestMethod http://localhost:$ProxyPort/health"
Write-Host "- View logs in each terminal window"

Write-Host "`nPress any key to continue monitoring or Ctrl+C to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
