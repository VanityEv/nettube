# =============================================================================
# STREAMPLY PRE-DEPLOYMENT SETUP
# Prepares your application for production deployment
# =============================================================================

param(
    [Parameter(Mandatory = $false)]
    [switch]$Check,
    
    [Parameter(Mandatory = $false)]
    [switch]$Setup,
    
    [Parameter(Mandatory = $false)]
    [switch]$Build,
    
    [Parameter(Mandatory = $false)]
    [switch]$All
)

Write-Host "🚀 Streamply Pre-Deployment Setup" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

function Test-DeploymentReadiness {
    Write-Host "`n✅ Deployment Readiness Checklist:" -ForegroundColor Yellow
    
    $issues = @()
    
    # Check required files
    $requiredFiles = @(
        "streamply-backend/package.json",
        "streamply-backend/Procfile", 
        "streamply-backend/index.js",
        "streamply-frontend/package.json",
        "streamply-frontend/vercel.json",
        "streamply-frontend/src/constants.ts"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $file exists" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $file missing" -ForegroundColor Red
            $issues += "$file missing"
        }
    }
    
    # Check backend dependencies
    Write-Host "`n📦 Backend Dependencies:" -ForegroundColor Yellow
    Set-Location "streamply-backend"
    
    $package = Get-Content "package.json" | ConvertFrom-Json
    $requiredDeps = @("express", "cors", "jsonwebtoken", "bcryptjs", "prisma", "@prisma/client", "stripe")
    
    foreach ($dep in $requiredDeps) {
        if ($package.dependencies.$dep) {
            Write-Host "  ✅ $dep installed" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $dep missing" -ForegroundColor Red
            $issues += "Backend dependency $dep missing"
        }
    }
    
    # Check scripts
    if ($package.scripts.start) {
        Write-Host "  ✅ start script defined" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ start script missing" -ForegroundColor Red
        $issues += "Backend start script missing"
    }
    
    Set-Location ".."
    
    # Check frontend dependencies  
    Write-Host "`n📦 Frontend Dependencies:" -ForegroundColor Yellow
    Set-Location "streamply-frontend"
    
    $frontendPackage = Get-Content "package.json" | ConvertFrom-Json
    $requiredFrontendDeps = @("react", "react-dom", "typescript", "@types/react")
    
    foreach ($dep in $requiredFrontendDeps) {
        if ($frontendPackage.dependencies.$dep -or $frontendPackage.devDependencies.$dep) {
            Write-Host "  ✅ $dep installed" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $dep missing" -ForegroundColor Red
            $issues += "Frontend dependency $dep missing"
        }
    }
    
    Set-Location ".."
    
    # Check environment configuration
    Write-Host "`n🔧 Environment Configuration:" -ForegroundColor Yellow
    
    # Check if constants.ts handles production
    $constants = Get-Content "streamply-frontend/src/constants.ts" -Raw
    if ($constants -match "NODE_ENV.*production") {
        Write-Host "  ✅ Production environment handling" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️ Production environment detection may need review" -ForegroundColor Yellow
    }
    
    # Check Procfile
    if (Test-Path "streamply-backend/Procfile") {
        $procfile = Get-Content "streamply-backend/Procfile"
        if ($procfile -match "web:.*npm start" -or $procfile -match "web:.*node") {
            Write-Host "  ✅ Procfile configured correctly" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Procfile needs web process definition" -ForegroundColor Red
            $issues += "Procfile missing web process"
        }
    }
    
    # Security check
    Write-Host "`n🔒 Security Configuration:" -ForegroundColor Yellow
    
    $securityFiles = @(
        "streamply-backend/services/security/mongoLogger.js",
        "streamply-backend/services/security/deviceFingerprinting.js",
        "streamply-backend/helpers/verifyToken.js"
    )
    
    foreach ($file in $securityFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $(Split-Path $file -Leaf) exists" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ $(Split-Path $file -Leaf) missing" -ForegroundColor Red
            $issues += "Security file $file missing"
        }
    }
    
    # Summary
    if ($issues.Count -eq 0) {
        Write-Host "`n🎉 All checks passed! Ready for deployment." -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "`n❌ Issues found:" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        return $false
    }
}

function Install-CLIs {
    Write-Host "`n📥 Installing deployment CLIs..." -ForegroundColor Yellow
    
    # Check and install Heroku CLI
    try {
        heroku --version | Out-Null
        Write-Host "  ✅ Heroku CLI already installed" -ForegroundColor Green
    }
    catch {
        Write-Host "  📦 Installing Heroku CLI..." -ForegroundColor Cyan
        try {
            winget install Heroku.HerokuCLI
            Write-Host "  ✅ Heroku CLI installed" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ Failed to install Heroku CLI" -ForegroundColor Red
            Write-Host "  Please install manually from: https://cli.heroku.com/" -ForegroundColor Yellow
        }
    }
    
    # Check and install Vercel CLI
    try {
        vercel --version | Out-Null
        Write-Host "  ✅ Vercel CLI already installed" -ForegroundColor Green
    }
    catch {
        Write-Host "  📦 Installing Vercel CLI..." -ForegroundColor Cyan
        try {
            npm install -g vercel
            Write-Host "  ✅ Vercel CLI installed" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ Failed to install Vercel CLI" -ForegroundColor Red
            Write-Host "  Please run: npm install -g vercel" -ForegroundColor Yellow
        }
    }
}

function Build-Applications {
    Write-Host "`n🔨 Building applications..." -ForegroundColor Yellow
    
    # Build backend (Prisma generation)
    Write-Host "  Building backend..." -ForegroundColor Cyan
    Set-Location "streamply-backend"
    try {
        npm run build
        Write-Host "  ✅ Backend built successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Backend build failed" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    Set-Location ".."
    
    # Build frontend
    Write-Host "  Building frontend..." -ForegroundColor Cyan
    Set-Location "streamply-frontend"
    try {
        npm run build
        Write-Host "  ✅ Frontend built successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Frontend build failed" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    Set-Location ".."
    
    return $true
}

function Show-DeploymentGuide {
    Write-Host "`n📋 Deployment Guide:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 🔑 Prepare your credentials:" -ForegroundColor Yellow
    Write-Host "   - Heroku account and CLI login" -ForegroundColor White
    Write-Host "   - Vercel account and CLI login" -ForegroundColor White
    Write-Host "   - Stripe API keys (production)" -ForegroundColor White
    Write-Host "   - Backblaze B2 credentials" -ForegroundColor White
    Write-Host "   - SendGrid API key" -ForegroundColor White
    Write-Host "   - MongoDB Atlas URI" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 🚀 Run deployment:" -ForegroundColor Yellow
    Write-Host "   .\deploy-production.ps1 -HerokuAppName 'your-app-name' -VercelProjectName 'your-project' -FullDeploy" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. 🔧 Post-deployment setup:" -ForegroundColor Yellow
    Write-Host "   - Configure Stripe webhooks" -ForegroundColor White
    Write-Host "   - Test video upload/streaming" -ForegroundColor White
    Write-Host "   - Set up monitoring" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Example deployment command:" -ForegroundColor Green
    Write-Host "   .\deploy-production.ps1 -HerokuAppName 'streamply-backend-prod' -VercelProjectName 'streamply-frontend' -FullDeploy" -ForegroundColor Cyan
}

# Main execution
try {
    if ($Check -or $All) {
        if (!(Test-DeploymentReadiness)) {
            Write-Host "`n⚠️  Please fix the issues above before deploying." -ForegroundColor Yellow
            exit 1
        }
    }
    
    if ($Setup -or $All) {
        Install-CLIs
    }
    
    if ($Build -or $All) {
        if (!(Build-Applications)) {
            Write-Host "`n❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
            exit 1
        }
    }
    
    Show-DeploymentGuide
    
    Write-Host "`n✅ Pre-deployment setup complete!" -ForegroundColor Green
    Write-Host "You're ready to deploy to production! 🚀" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
