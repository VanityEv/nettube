# 🌐 Public Security Testing Environment Setup
# Setup nginx proxy with ngrok tunnels for external security testing

Write-Host "🚀 Setting up StreamPly Public Security Testing Environment..." -ForegroundColor Green
Write-Host "This creates a publicly accessible environment for comprehensive security testing!" -ForegroundColor Yellow

# Configuration
$NGINX_DIR = "C:\nginx"
$PROJECT_DIR = Get-Location
$BACKEND_DIR = "$PROJECT_DIR\streamply-backend"
$FRONTEND_DIR = "$PROJECT_DIR\streamply-frontend"

# Check if running as administrator for nginx setup
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Running without admin privileges. Some nginx operations may fail." -ForegroundColor Yellow
}

Write-Host "`n📋 Public Security Testing Architecture:" -ForegroundColor Cyan
Write-Host "   Internet → ngrok proxy tunnel (https://xxx.ngrok.io:443)" -ForegroundColor White
Write-Host "            ↓" -ForegroundColor White  
Write-Host "   nginx proxy (localhost:8080)" -ForegroundColor White
Write-Host "            ↓" -ForegroundColor White
Write-Host "   ngrok backend tunnel (https://yyy.ngrok.io:443)" -ForegroundColor White
Write-Host "            ↓" -ForegroundColor White
Write-Host "   Backend server (localhost:3001)" -ForegroundColor White
Write-Host "   Frontend (Vercel) → ngrok proxy tunnel" -ForegroundColor White

# Function to check if a service is running
function Test-ServiceRunning {
    param($ServiceName)
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        return $service.Status -eq "Running"
    }
    catch {
        return $false
    }
}

# Function to check if a process is running
function Test-ProcessRunning {
    param($ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if a port is in use
function Test-PortInUse {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

Write-Host "`n🔍 Checking Prerequisites..." -ForegroundColor Cyan

# Check for required tools
$tools = @{
    "nginx" = "nginx.exe"
    "node"  = "node.exe"
    "npm"   = "npm.cmd"
    "ngrok" = "ngrok.exe"
    "psql"  = "psql.exe"
    "mongo" = "mongo.exe"
}

$missingTools = @()
foreach ($tool in $tools.GetEnumerator()) {
    try {
        $null = Get-Command $tool.Value -ErrorAction Stop
        Write-Host "   ✅ $($tool.Key) found" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ $($tool.Key) not found" -ForegroundColor Red
        $missingTools += $tool.Key
    }
}

if ($missingTools.Count -gt 0) {
    Write-Host "`n📦 Missing tools detected. Install commands:" -ForegroundColor Yellow
    foreach ($tool in $missingTools) {
        switch ($tool) {
            "nginx" { Write-Host "   winget install nginx" -ForegroundColor White }
            "node" { Write-Host "   winget install OpenJS.NodeJS" -ForegroundColor White }
            "npm" { Write-Host "   (included with Node.js)" -ForegroundColor White }
            "ngrok" { Write-Host "   winget install ngrok" -ForegroundColor White }
            "psql" { Write-Host "   winget install PostgreSQL.PostgreSQL" -ForegroundColor White }
            "mongo" { Write-Host "   winget install MongoDB.Server" -ForegroundColor White }
        }
    }
    Write-Host "`n🛡️  For ZAP testing, also install:" -ForegroundColor Yellow
    Write-Host "   winget install ZAP.ZAP" -ForegroundColor White
    
    $continue = Read-Host "`nDo you want to continue without these tools? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Please install missing tools and run again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🔧 Setting up nginx configuration for public proxy..." -ForegroundColor Cyan

# Copy nginx configuration
if (Test-Path $NGINX_DIR) {
    try {
        Copy-Item "$PROJECT_DIR\nginx\nginx-public-security-test.conf" "$NGINX_DIR\conf\nginx.conf" -Force
        Write-Host "   ✅ nginx configuration updated for public testing" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Failed to copy nginx config: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Manual step: Copy nginx-public-security-test.conf to $NGINX_DIR\conf\nginx.conf" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ❌ nginx directory not found at $NGINX_DIR" -ForegroundColor Red
    Write-Host "   Please install nginx or update NGINX_DIR variable" -ForegroundColor Yellow
}

Write-Host "`n🗄️ Checking database services..." -ForegroundColor Cyan

# Check PostgreSQL
if (Test-ServiceRunning "postgresql*") {
    Write-Host "   ✅ PostgreSQL service is running" -ForegroundColor Green
}
else {
    Write-Host "   ❌ PostgreSQL service not running" -ForegroundColor Red
    Write-Host "   Start with: net start postgresql-x64-15" -ForegroundColor Yellow
}

# Check MongoDB
if (Test-ServiceRunning "MongoDB") {
    Write-Host "   ✅ MongoDB service is running" -ForegroundColor Green
}
else {
    Write-Host "   ❌ MongoDB service not running" -ForegroundColor Red
    Write-Host "   Start with: net start MongoDB" -ForegroundColor Yellow
}

Write-Host "`n🔧 Preparing backend environment..." -ForegroundColor Cyan

if (Test-Path $BACKEND_DIR) {
    Push-Location $BACKEND_DIR
    
    # Check if dependencies are installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 Installing backend dependencies..." -ForegroundColor Yellow
        npm install
    }
    else {
        Write-Host "   ✅ Backend dependencies already installed" -ForegroundColor Green
    }
    
    # Check environment file
    if (Test-Path ".env") {
        Write-Host "   ✅ Environment file exists" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Environment file not found" -ForegroundColor Red
        Write-Host "   Please ensure .env file is configured properly" -ForegroundColor Yellow
    }
    
    Pop-Location
}
else {
    Write-Host "   ❌ Backend directory not found: $BACKEND_DIR" -ForegroundColor Red
}

Write-Host "`n🚀 Starting Public Security Testing Environment..." -ForegroundColor Green

Write-Host "`n1️⃣ Starting backend server..." -ForegroundColor Cyan
if (Test-Path $BACKEND_DIR) {
    if (Test-PortInUse 3001) {
        Write-Host "   ⚠️  Port 3001 already in use. Backend may already be running." -ForegroundColor Yellow
    }
    else {
        Write-Host "   🚀 Starting backend on port 3001..." -ForegroundColor Yellow
        Write-Host "   💡 Run this in Terminal 1: cd streamply-backend && npm start" -ForegroundColor Cyan
    }
}

Write-Host "`n2️⃣ Starting ngrok tunnel for backend..." -ForegroundColor Cyan
Write-Host "   🌐 Run this in Terminal 2: ngrok http 3001 --subdomain=streamply-backend-test" -ForegroundColor Cyan
Write-Host "   📝 Note the backend ngrok URL (e.g., https://streamply-backend-test.ngrok.io)" -ForegroundColor Yellow

Write-Host "`n3️⃣ Starting nginx proxy..." -ForegroundColor Cyan
if (Test-Path $NGINX_DIR) {
    Push-Location $NGINX_DIR
    
    # Test nginx configuration
    $testConfig = & .\nginx.exe -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ nginx configuration is valid" -ForegroundColor Green
        
        # Start nginx on port 8080 (to avoid conflicts)
        if (Test-ProcessRunning "nginx") {
            Write-Host "   🔄 nginx already running, reloading..." -ForegroundColor Yellow
            & .\nginx.exe -s reload
        }
        else {
            Write-Host "   🚀 Starting nginx on port 8080..." -ForegroundColor Yellow
            Start-Process "nginx.exe" -WindowStyle Hidden
            Start-Sleep 2
            
            if (Test-PortInUse 8080) {
                Write-Host "   ✅ nginx started successfully on port 8080" -ForegroundColor Green
            }
            else {
                Write-Host "   ❌ nginx failed to start on port 8080" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "   ❌ nginx configuration error:" -ForegroundColor Red
        Write-Host "   $testConfig" -ForegroundColor Yellow
    }
    
    Pop-Location
}

Write-Host "`n4️⃣ Starting ngrok tunnel for nginx proxy..." -ForegroundColor Cyan
Write-Host "   🌐 Run this in Terminal 3: ngrok http 8080 --subdomain=streamply-proxy-test" -ForegroundColor Cyan
Write-Host "   📝 Note the proxy ngrok URL (e.g., https://streamply-proxy-test.ngrok.io)" -ForegroundColor Yellow

Write-Host "`n5️⃣ Frontend deployment..." -ForegroundColor Cyan
Write-Host "   💡 Update frontend API base URL to: https://streamply-proxy-test.ngrok.io/api" -ForegroundColor Cyan
Write-Host "   💡 Deploy to Vercel: cd streamply-frontend && vercel deploy --prod" -ForegroundColor Cyan

Write-Host "`n🛡️ External Security Testing Setup:" -ForegroundColor Yellow
Write-Host "   1. Open OWASP ZAP on any machine" -ForegroundColor White
Write-Host "   2. Set target URL: https://streamply-proxy-test.ngrok.io" -ForegroundColor White
Write-Host "   3. Configure context to include your Vercel frontend" -ForegroundColor White
Write-Host "   4. Run automated scans for OWASP Top 10" -ForegroundColor White
Write-Host "   5. Test from multiple locations/networks" -ForegroundColor White
Write-Host "   6. Generate comprehensive security reports" -ForegroundColor White

Write-Host "`n📊 Monitoring Commands:" -ForegroundColor Yellow
Write-Host "   nginx logs: Get-Content C:\nginx\logs\access.log -Wait" -ForegroundColor White
Write-Host "   Security events: mongo streamply_logs --eval 'db.security_events.find().sort({timestamp:-1}).limit(5)'" -ForegroundColor White
Write-Host "   Proxy health: curl https://streamply-proxy-test.ngrok.io/health" -ForegroundColor White
Write-Host "   Backend health: curl https://streamply-backend-test.ngrok.io/health" -ForegroundColor White

Write-Host "`n🎓 Advanced Security Testing Benefits:" -ForegroundColor Green
Write-Host "   • Test from external networks (realistic attack scenarios)" -ForegroundColor White
Write-Host "   • Analyze proxy layer security effectiveness" -ForegroundColor White
Write-Host "   • Monitor performance under distributed attacks" -ForegroundColor White
Write-Host "   • Compare direct backend vs proxied security" -ForegroundColor White
Write-Host "   • Test with real SSL/TLS certificates from ngrok" -ForegroundColor White
Write-Host "   • Simulate CDN and load balancer scenarios" -ForegroundColor White

Write-Host "`n✅ Public Security Testing Environment Setup Complete!" -ForegroundColor Green
Write-Host "🌐 Ready for comprehensive external security analysis!" -ForegroundColor Cyan

# Provide step-by-step execution guide
Write-Host "`n📋 Terminal Execution Guide:" -ForegroundColor Yellow
Write-Host "   Terminal 1: cd streamply-backend && npm start" -ForegroundColor White
Write-Host "   Terminal 2: ngrok http 3001 --subdomain=streamply-backend-test" -ForegroundColor White
Write-Host "   Terminal 3: ngrok http 8080 --subdomain=streamply-proxy-test" -ForegroundColor White
Write-Host "   Terminal 4: (Optional) ZAP scanning and monitoring" -ForegroundColor White

Write-Host "`n🔗 Testing URLs (update with your actual ngrok subdomains):" -ForegroundColor Cyan
Write-Host "   Public Proxy: https://streamply-proxy-test.ngrok.io" -ForegroundColor White
Write-Host "   Direct Backend: https://streamply-backend-test.ngrok.io" -ForegroundColor White
Write-Host "   Frontend: https://your-app.vercel.app" -ForegroundColor White
Write-Host "   Local nginx: http://localhost:8080" -ForegroundColor White

Write-Host "`n⚠️  Important Security Notes:" -ForegroundColor Red
Write-Host "   • ngrok tunnels are PUBLIC - anyone can access them" -ForegroundColor Yellow
Write-Host "   • Use only for testing - never for production" -ForegroundColor Yellow
Write-Host "   • Monitor logs closely for unexpected traffic" -ForegroundColor Yellow
Write-Host "   • Consider using ngrok auth tokens for protection" -ForegroundColor Yellow

# Save configuration summary
$configSummary = @"
# StreamPly Public Security Testing Configuration
Generated: $(Get-Date)

## Architecture
Internet → ngrok proxy tunnel → nginx (localhost:8080) → ngrok backend tunnel → Backend (localhost:3001)

## Public URLs (update with actual ngrok URLs)
- Proxy Tunnel: https://streamply-proxy-test.ngrok.io
- Backend Tunnel: https://streamply-backend-test.ngrok.io  
- Frontend: https://your-app.vercel.app

## Local Services
- nginx proxy: http://localhost:8080
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
- MongoDB: localhost:27017

## Security Testing Targets
1. Public Proxy (https://streamply-proxy-test.ngrok.io)
   - Rate limiting effectiveness
   - Security headers
   - Proxy misconfigurations
   - SSL/TLS security

2. Direct Backend (https://streamply-backend-test.ngrok.io)
   - API security 
   - Authentication bypass
   - Injection attacks
   - Business logic flaws

## Execution Commands
Terminal 1: cd streamply-backend && npm start
Terminal 2: ngrok http 3001 --subdomain=streamply-backend-test
Terminal 3: ngrok http 8080 --subdomain=streamply-proxy-test

## Security Testing Tools
- OWASP ZAP: Target both proxy and backend URLs
- Burp Suite: Professional testing
- Nuclei: Automated vulnerability scanning
- Custom scripts: Rate limiting, auth testing

## Monitoring
- nginx access logs: C:\nginx\logs\access.log
- MongoDB security events: streamply_logs.security_events
- ngrok dashboard: https://dashboard.ngrok.com

## Safety Reminders
- These are PUBLIC URLs - anyone can access
- Use only for testing, never production
- Monitor for unexpected traffic
- Consider ngrok authentication
"@

$configSummary | Out-File -FilePath "public-security-testing-config.txt" -Encoding UTF8
Write-Host "`n📄 Public testing configuration saved to: public-security-testing-config.txt" -ForegroundColor Green

Write-Host "`n🔒 Next: Create the nginx config file for public testing..." -ForegroundColor Cyan
