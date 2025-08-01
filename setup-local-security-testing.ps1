# 🛡️ Local Security Testing Environment Setup
# Automated setup for OWASP Top 10 testing with ZAP scanner

Write-Host "🚀 Setting up StreamPly Local Security Testing Environment..." -ForegroundColor Green
Write-Host "This setup is perfect for Master Thesis security analysis!" -ForegroundColor Yellow

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

Write-Host "`n📋 Security Testing Architecture:" -ForegroundColor Cyan
Write-Host "   Internet → nginx (localhost:80) → Backend (localhost:3001)" -ForegroundColor White
Write-Host "   Frontend (Vercel) → nginx proxy → Local services" -ForegroundColor White
Write-Host "   Local PostgreSQL + Local MongoDB for data storage" -ForegroundColor White

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
    "node" = "node.exe"
    "npm" = "npm.cmd"
    "psql" = "psql.exe"
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
            "psql" { Write-Host "   winget install PostgreSQL.PostgreSQL" -ForegroundColor White }
            "mongo" { Write-Host "   winget install MongoDB.Server" -ForegroundColor White }
        }
    }
    Write-Host "`n🛡️  For ZAP testing, also install:" -ForegroundColor Yellow
    Write-Host "   winget install ZAP.ZAP" -ForegroundColor White
    Write-Host "   winget install ngrok" -ForegroundColor White
    
    $continue = Read-Host "`nDo you want to continue without these tools? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Please install missing tools and run again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🔧 Setting up nginx configuration..." -ForegroundColor Cyan

# Copy nginx configuration
if (Test-Path $NGINX_DIR) {
    try {
        Copy-Item "$PROJECT_DIR\nginx\nginx-local-security-test.conf" "$NGINX_DIR\conf\nginx.conf" -Force
        Write-Host "   ✅ nginx configuration updated" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Failed to copy nginx config: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Manual step: Copy nginx-local-security-test.conf to $NGINX_DIR\conf\nginx.conf" -ForegroundColor Yellow
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

Write-Host "`n🎯 Security Testing Checklist:" -ForegroundColor Cyan
Write-Host "   📋 OWASP Top 10 Testing Areas:" -ForegroundColor White
Write-Host "      • A01: Broken Access Control" -ForegroundColor Gray
Write-Host "      • A02: Cryptographic Failures" -ForegroundColor Gray
Write-Host "      • A03: Injection" -ForegroundColor Gray
Write-Host "      • A04: Insecure Design" -ForegroundColor Gray
Write-Host "      • A05: Security Misconfiguration" -ForegroundColor Gray
Write-Host "      • A06: Vulnerable Components" -ForegroundColor Gray
Write-Host "      • A07: Authentication Failures" -ForegroundColor Gray
Write-Host "      • A08: Software Integrity Failures" -ForegroundColor Gray
Write-Host "      • A09: Logging Failures" -ForegroundColor Gray
Write-Host "      • A10: Server-Side Request Forgery" -ForegroundColor Gray

Write-Host "`n🚀 Starting Local Security Testing Environment..." -ForegroundColor Green

Write-Host "`n1️⃣ Starting nginx proxy..." -ForegroundColor Cyan
if (Test-Path $NGINX_DIR) {
    Push-Location $NGINX_DIR
    
    # Test nginx configuration
    $testConfig = & .\nginx.exe -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ nginx configuration is valid" -ForegroundColor Green
        
        # Start nginx
        if (Test-ProcessRunning "nginx") {
            Write-Host "   🔄 nginx already running, reloading..." -ForegroundColor Yellow
            & .\nginx.exe -s reload
        }
        else {
            Write-Host "   🚀 Starting nginx..." -ForegroundColor Yellow
            Start-Process "nginx.exe" -WindowStyle Hidden
            Start-Sleep 2
            
            if (Test-PortInUse 80) {
                Write-Host "   ✅ nginx started successfully on port 80" -ForegroundColor Green
            }
            else {
                Write-Host "   ❌ nginx failed to start on port 80" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "   ❌ nginx configuration error:" -ForegroundColor Red
        Write-Host "   $testConfig" -ForegroundColor Yellow
    }
    
    Pop-Location
}

Write-Host "`n2️⃣ Starting backend server..." -ForegroundColor Cyan
if (Test-Path $BACKEND_DIR) {
    if (Test-PortInUse 3001) {
        Write-Host "   ⚠️  Port 3001 already in use. Backend may already be running." -ForegroundColor Yellow
    }
    else {
        Write-Host "   🚀 Starting backend on port 3001..." -ForegroundColor Yellow
        Write-Host "   💡 Run this in a separate terminal: cd streamply-backend && npm start" -ForegroundColor Cyan
    }
}

Write-Host "`n3️⃣ ngrok tunnel setup..." -ForegroundColor Cyan
Write-Host "   💡 Run this in a separate terminal: ngrok http 3001" -ForegroundColor Cyan
Write-Host "   📝 Note the ngrok URL for external testing" -ForegroundColor Yellow

Write-Host "`n4️⃣ Frontend deployment..." -ForegroundColor Cyan
Write-Host "   💡 Update frontend API base URL to: http://localhost/api" -ForegroundColor Cyan
Write-Host "   💡 Deploy to Vercel: cd streamply-frontend && vercel deploy --prod" -ForegroundColor Cyan

Write-Host "`n🛡️ ZAP Security Testing Setup:" -ForegroundColor Yellow
Write-Host "   1. Open OWASP ZAP" -ForegroundColor White
Write-Host "   2. Set target URL: http://localhost" -ForegroundColor White
Write-Host "   3. Configure context to include your Vercel frontend" -ForegroundColor White
Write-Host "   4. Run automated scans for OWASP Top 10" -ForegroundColor White
Write-Host "   5. Generate security reports for your thesis" -ForegroundColor White

Write-Host "`n📊 Monitoring Commands:" -ForegroundColor Yellow
Write-Host "   nginx logs: Get-Content C:\nginx\logs\streamply-security-test.access.log -Wait" -ForegroundColor White
Write-Host "   Security events: mongo streamply_logs --eval 'db.security_events.find().sort({timestamp:-1}).limit(5)'" -ForegroundColor White
Write-Host "   Health check: curl http://localhost/health" -ForegroundColor White

Write-Host "`n🎓 Master Thesis Testing Tips:" -ForegroundColor Green
Write-Host "   • Document all security findings with screenshots" -ForegroundColor White
Write-Host "   • Test each OWASP Top 10 category systematically" -ForegroundColor White
Write-Host "   • Monitor performance impact during attacks" -ForegroundColor White
Write-Host "   • Compare results with/without nginx proxy" -ForegroundColor White
Write-Host "   • Generate comprehensive security reports" -ForegroundColor White

Write-Host "`n✅ Local Security Testing Environment Setup Complete!" -ForegroundColor Green
Write-Host "🔍 Ready for comprehensive OWASP Top 10 security analysis!" -ForegroundColor Cyan

# Provide next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start backend: cd streamply-backend && npm start" -ForegroundColor White
Write-Host "   2. Start ngrok: ngrok http 3001" -ForegroundColor White
Write-Host "   3. Update frontend API URL and deploy to Vercel" -ForegroundColor White
Write-Host "   4. Launch OWASP ZAP and begin security testing" -ForegroundColor White
Write-Host "   5. Document findings for your master thesis" -ForegroundColor White

Write-Host "`n🔗 Key URLs for testing:" -ForegroundColor Cyan
Write-Host "   nginx proxy: http://localhost" -ForegroundColor White
Write-Host "   API health check: http://localhost/health" -ForegroundColor White
Write-Host "   Backend direct: http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: https://your-app.vercel.app" -ForegroundColor White

# Save configuration summary
$configSummary = @"
# StreamPly Security Testing Configuration Summary
Generated: $(Get-Date)

## Environment Setup
- nginx proxy: http://localhost:80
- Backend: http://localhost:3001
- Database: Local PostgreSQL
- Logging: Local MongoDB
- Frontend: Vercel deployment

## Testing URLs
- nginx proxy: http://localhost
- API endpoints: http://localhost/api/*
- Health check: http://localhost/health

## Security Testing Areas (OWASP Top 10)
1. Broken Access Control - /api/auth endpoints
2. Cryptographic Failures - JWT tokens, HTTPS
3. Injection - SQL/NoSQL injection vectors
4. Insecure Design - Business logic flaws
5. Security Misconfiguration - nginx headers, errors
6. Vulnerable Components - Dependency scanning
7. Authentication Failures - Brute force testing
8. Software Integrity Failures - CSP, asset integrity
9. Logging Failures - Security event logging
10. SSRF - File upload, webhook testing

## Key Files
- nginx config: nginx/nginx-local-security-test.conf
- Environment: streamply-backend/.env
- Setup guide: LOCAL_SECURITY_TESTING_SETUP.md

## Monitoring
- nginx access log: C:\nginx\logs\streamply-security-test.access.log
- nginx error log: C:\nginx\logs\streamply-security-test.error.log
- MongoDB security events: streamply_logs.security_events
- PostgreSQL audit: user_sessions, video_views tables
"@

$configSummary | Out-File -FilePath "security-testing-config.txt" -Encoding UTF8
Write-Host "`n📄 Configuration summary saved to: security-testing-config.txt" -ForegroundColor Green
