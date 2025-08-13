# start-streamply-localtunnel.ps1
# Complete Streamply LocalTunnel deployment script for Windows

param(
    [string]$Subdomain = "streamply-dev",  # Consistent subdomain for LocalTunnel
    [int]$BackendPort = 3001
)

Write-Host "🚀 Starting Streamply with LocalTunnel..." -ForegroundColor Green
Write-Host "   Backend: Node.js on port $BackendPort" -ForegroundColor Cyan
Write-Host "   Tunnel URL: https://$Subdomain.loca.lt" -ForegroundColor Cyan
Write-Host "   Using consistent subdomain for stable development! 🎉" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if databases are running
Write-Host "`n🔍 Checking databases..." -ForegroundColor Yellow

# PostgreSQL
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    }
    else {
        Write-Host "🔄 Starting PostgreSQL..." -ForegroundColor Yellow
        net start postgresql-x64-14
        Start-Sleep -Seconds 2
    }
}
catch {
    Write-Host "⚠️ PostgreSQL service not found. Please install PostgreSQL." -ForegroundColor Yellow
}

# MongoDB
try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction Stop
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    }
    else {
        Write-Host "🔄 Starting MongoDB..." -ForegroundColor Yellow
        net start MongoDB
        Start-Sleep -Seconds 2
    }
}
catch {
    Write-Host "⚠️ MongoDB service not found. Please install MongoDB." -ForegroundColor Yellow
}

# Check and install dependencies
Write-Host "`n� Checking dependencies..." -ForegroundColor Yellow

# Check if backend dependencies are installed
if (Test-Path "streamply-backend") {
    Push-Location "streamply-backend"
    if (!(Test-Path "node_modules")) {
        Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Generate Prisma client if needed
    if (Test-Path "prisma") {
        Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
        npx prisma generate
    }
    Pop-Location
}

# Check if LocalTunnel is installed
Write-Host "� Checking LocalTunnel..." -ForegroundColor Yellow
try {
    $ltVersion = npx localtunnel --version 2>$null
    Write-Host "✅ LocalTunnel already installed" -ForegroundColor Green
}
catch {
    Write-Host "📥 Installing LocalTunnel..." -ForegroundColor Yellow
    npm install -g localtunnel
}

# Check if backend port is available
Write-Host "`n🔍 Checking backend port $BackendPort..." -ForegroundColor Yellow
$connection = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "⚠️ Port $BackendPort is already in use! Stopping existing processes..." -ForegroundColor Yellow
    # Kill existing Node.js processes on this port
    Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
        $proc = $_
        try {
            $connections = netstat -ano | Select-String ":$BackendPort"
            if ($connections -match $proc.Id) {
                Write-Host "🔄 Stopping process $($proc.Id) using port $BackendPort" -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force
            }
        }
        catch {}
    }
    Start-Sleep -Seconds 2
}
else {
    Write-Host "✅ Port $BackendPort is available" -ForegroundColor Green
}

# Start backend
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
}
catch {
    Write-Host "⚠️ Backend health check failed, but continuing..." -ForegroundColor Yellow
}

# Clean up any existing LocalTunnel processes
Write-Host "`n🔄 Cleaning up existing LocalTunnel processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*localtunnel*" -or $_.MainWindowTitle -like "*localtunnel*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start LocalTunnel with consistent subdomain
Write-Host "🌐 Starting LocalTunnel with subdomain: $Subdomain..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '🔗 LocalTunnel connecting to port $BackendPort with subdomain $Subdomain...' -ForegroundColor Green; Write-Host 'URL: https://$Subdomain.loca.lt' -ForegroundColor Cyan; npx localtunnel --port $BackendPort --subdomain $Subdomain"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Test LocalTunnel connection
try {
    $tunnelTest = Invoke-RestMethod -Uri "https://$Subdomain.loca.lt/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ LocalTunnel is responding" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ LocalTunnel health check failed. You may need to authenticate in browser first." -ForegroundColor Yellow
}

# Update .env file with consistent URL
Write-Host "`n🔧 Updating .env file with tunnel URL..." -ForegroundColor Yellow
$envFile = "streamply-frontend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $newEnvContent = @()
    $apiUrlUpdated = $false
    
    foreach ($line in $envContent) {
        if ($line -match "^REACT_APP_API_URL=") {
            $newEnvContent += "REACT_APP_API_URL=https://$Subdomain.loca.lt"
            $apiUrlUpdated = $true
        }
        elseif ($line -match "^REACT_APP_BACKEND_URL=") {
            $newEnvContent += "REACT_APP_BACKEND_URL=https://$Subdomain.loca.lt/api"
        }
        elseif ($line -match "^REACT_APP_BASE_URL=") {
            $newEnvContent += "REACT_APP_BASE_URL=https://$Subdomain.loca.lt"
        }
        else {
            $newEnvContent += $line
        }
    }
    
    if (-not $apiUrlUpdated) {
        $newEnvContent += "REACT_APP_API_URL=https://$Subdomain.loca.lt"
    }
    
    $newEnvContent | Set-Content $envFile
    Write-Host "✅ .env file updated with tunnel URL" -ForegroundColor Green
}
else {
    Write-Host "⚠️ .env file not found in streamply-frontend/" -ForegroundColor Yellow
}

# Summary
Write-Host "`n✅ Streamply LocalTunnel deployment started!" -ForegroundColor Green
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│                🚀 STREAMPLY LOCALTUNNEL READY               │" -ForegroundColor Cyan  
Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "│ Backend:     http://localhost:$BackendPort                            │" -ForegroundColor White
Write-Host "│ Tunnel:      https://$Subdomain.loca.lt                    │" -ForegroundColor White
Write-Host "│ Frontend:    Update and restart dev server                 │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. 🌐 Visit https://$Subdomain.loca.lt in browser to authenticate once" -ForegroundColor Green
Write-Host "2. � Restart your frontend dev server (yarn start)" -ForegroundColor Green
Write-Host "3. 🧪 Test login functionality through LocalTunnel" -ForegroundColor Green
Write-Host "4. 🛑 Use Ctrl+C in terminal windows to stop services" -ForegroundColor Gray

Write-Host "`n💡 Important Notes:" -ForegroundColor Cyan
Write-Host "- First visit to https://$Subdomain.loca.lt requires browser authentication"
Write-Host "- CORS is already configured for .loca.lt domains in backend"
Write-Host "- .env file updated automatically with consistent URL"
Write-Host "- Same subdomain will be used every time you run this script"

Write-Host "`nPress any key to continue monitoring or Ctrl+C to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
