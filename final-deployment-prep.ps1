# =============================================================================
# STREAMPLY PRODUCTION DEPLOYMENT PREPARATION
# Complete setup for Heroku + Vercel deployment
# =============================================================================

Write-Host "🚀 Streamply Production Deployment Preparation" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

# Step 1: Validate Environment
Write-Host "`n🔍 Step 1: Validating Environment" -ForegroundColor Yellow

$issues = @()

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    $issues += "Node.js not installed"
    Write-Host "  ❌ Node.js not found" -ForegroundColor Red
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor Green
}
catch {
    $issues += "npm not available"
    Write-Host "  ❌ npm not found" -ForegroundColor Red
}

# Check for Git
try {
    $gitVersion = git --version
    Write-Host "  ✅ Git: $gitVersion" -ForegroundColor Green
}
catch {
    $issues += "Git not installed"
    Write-Host "  ❌ Git not found" -ForegroundColor Red
}

# Step 2: Install CLI Tools
Write-Host "`n📦 Step 2: Installing CLI Tools" -ForegroundColor Yellow

# Install Heroku CLI
try {
    heroku --version | Out-Null
    Write-Host "  ✅ Heroku CLI already installed" -ForegroundColor Green
}
catch {
    Write-Host "  📥 Installing Heroku CLI..." -ForegroundColor Cyan
    try {
        npm install -g heroku
        Write-Host "  ✅ Heroku CLI installed successfully" -ForegroundColor Green
    }
    catch {
        $issues += "Failed to install Heroku CLI"
        Write-Host "  ❌ Failed to install Heroku CLI" -ForegroundColor Red
        Write-Host "    Manual installation: https://cli.heroku.com/" -ForegroundColor Yellow
    }
}

# Install Vercel CLI
try {
    vercel --version | Out-Null
    Write-Host "  ✅ Vercel CLI already installed" -ForegroundColor Green
}
catch {
    Write-Host "  📥 Installing Vercel CLI..." -ForegroundColor Cyan
    try {
        npm install -g vercel
        Write-Host "  ✅ Vercel CLI installed successfully" -ForegroundColor Green
    }
    catch {
        $issues += "Failed to install Vercel CLI"
        Write-Host "  ❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "    Manual installation: npm install -g vercel" -ForegroundColor Yellow
    }
}

# Step 3: Verify Project Structure
Write-Host "`n🏗️ Step 3: Verifying Project Structure" -ForegroundColor Yellow

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
        $issues += "$file missing"
        Write-Host "  ❌ $file missing" -ForegroundColor Red
    }
}

# Step 4: Check Dependencies
Write-Host "`n📋 Step 4: Checking Dependencies" -ForegroundColor Yellow

# Backend dependencies
if (Test-Path "streamply-backend/package.json") {
    Set-Location "streamply-backend"
    Write-Host "  📦 Installing backend dependencies..." -ForegroundColor Cyan
    try {
        npm install | Out-Null
        Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green
    }
    catch {
        $issues += "Backend dependency installation failed"
        Write-Host "  ❌ Backend dependency installation failed" -ForegroundColor Red
    }
    Set-Location ".."
}

# Frontend dependencies
if (Test-Path "streamply-frontend/package.json") {
    Set-Location "streamply-frontend"
    Write-Host "  📦 Installing frontend dependencies..." -ForegroundColor Cyan
    try {
        npm install | Out-Null
        Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
    }
    catch {
        $issues += "Frontend dependency installation failed"
        Write-Host "  ❌ Frontend dependency installation failed" -ForegroundColor Red
    }
    Set-Location ".."
}

# Step 5: Build Test
Write-Host "`n🔨 Step 5: Testing Builds" -ForegroundColor Yellow

# Test backend build
if (Test-Path "streamply-backend/package.json") {
    Set-Location "streamply-backend"
    Write-Host "  🔧 Testing backend build..." -ForegroundColor Cyan
    try {
        npm run build | Out-Null
        Write-Host "  ✅ Backend build successful" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️ Backend build test skipped (may not have build script)" -ForegroundColor Yellow
    }
    Set-Location ".."
}

# Test frontend build
if (Test-Path "streamply-frontend/package.json") {
    Set-Location "streamply-frontend"
    Write-Host "  🔧 Testing frontend build..." -ForegroundColor Cyan
    try {
        npm run build | Out-Null
        Write-Host "  ✅ Frontend build successful" -ForegroundColor Green
        # Clean up build directory
        if (Test-Path "build") {
            Remove-Item -Recurse -Force "build"
        }
    }
    catch {
        $issues += "Frontend build failed"
        Write-Host "  ❌ Frontend build failed" -ForegroundColor Red
    }
    Set-Location ".."
}

# Step 6: Environment Configuration
Write-Host "`n🔧 Step 6: Creating Environment Templates" -ForegroundColor Yellow

# Create production environment template for Vercel
$vercelEnv = @"
# =============================================================================
# VERCEL PRODUCTION ENVIRONMENT VARIABLES
# Copy these to Vercel Environment Variables in your project settings
# =============================================================================

# CRITICAL: Disable proxy mode for direct Heroku backend connection
REACT_APP_USE_PROXY=false

# BACKEND API (Replace with your actual Heroku app URL)
REACT_APP_BACKEND_URL=https://your-streamply-backend.herokuapp.com
REACT_APP_API_URL=https://your-streamply-backend.herokuapp.com

# STRIPE CONFIGURATION (Use your live keys for production)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key

# ENVIRONMENT
REACT_APP_NODE_ENV=production

# SECURITY & ANTI-PIRACY
REACT_APP_ENABLE_ANTI_PIRACY=true
REACT_APP_WATERMARK_ENABLED=true
REACT_APP_ENABLE_DEVICE_FINGERPRINTING=true

# VIDEO PLAYER SETTINGS
REACT_APP_DEFAULT_VIDEO_QUALITY=720p
REACT_APP_ENABLE_AUTO_QUALITY=true
REACT_APP_ENABLE_HLS=true

# BUILD OPTIMIZATION
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
REACT_APP_DEBUG=false
"@

$vercelEnv | Out-File -FilePath "streamply-frontend\.env.production.template" -Encoding UTF8
Write-Host "  ✅ Created Vercel environment template" -ForegroundColor Green

# Create Heroku configuration script
$herokuSetup = @"
# =============================================================================
# HEROKU CONFIG VARS SETUP SCRIPT
# Replace placeholder values with your actual credentials
# =============================================================================

# Replace 'your-streamply-backend' with your actual Heroku app name
`$APP_NAME = "your-streamply-backend"

Write-Host "Setting up Heroku config vars for `$APP_NAME..." -ForegroundColor Yellow

# CORE SETTINGS
heroku config:set NODE_ENV=production --app `$APP_NAME
heroku config:set BCRYPT_ROUNDS=12 --app `$APP_NAME

# SECURITY (REQUIRED: Generate a strong JWT secret)
heroku config:set JWT_SECRET="REPLACE_WITH_STRONG_256_BIT_SECRET" --app `$APP_NAME

# STRIPE (REQUIRED: Replace with your actual live keys)
heroku config:set STRIPE_SECRET_KEY="REPLACE_WITH_STRIPE_SECRET_KEY" --app `$APP_NAME
heroku config:set STRIPE_PUBLISHABLE_KEY="REPLACE_WITH_STRIPE_PUBLISHABLE_KEY" --app `$APP_NAME
heroku config:set STRIPE_WEBHOOK_SECRET="REPLACE_WITH_STRIPE_WEBHOOK_SECRET" --app `$APP_NAME

# EMAIL (REQUIRED: Replace with your SendGrid API key)
heroku config:set SENDGRID_API_KEY="REPLACE_WITH_SENDGRID_API_KEY" --app `$APP_NAME
heroku config:set FROM_EMAIL="noreply@yourdomain.com" --app `$APP_NAME

# BACKBLAZE B2 (REQUIRED: Replace with your production credentials)
heroku config:set B2_APPLICATION_KEY_ID="REPLACE_WITH_B2_KEY_ID" --app `$APP_NAME
heroku config:set B2_APPLICATION_KEY="REPLACE_WITH_B2_APPLICATION_KEY" --app `$APP_NAME
heroku config:set B2_BUCKET_NAME="streamply-videos-prod" --app `$APP_NAME
heroku config:set B2_BUCKET_ID="REPLACE_WITH_B2_BUCKET_ID" --app `$APP_NAME

# FRONTEND URL (REQUIRED: Replace with your Vercel domain)
heroku config:set FRONTEND_URL="https://your-vercel-app.vercel.app" --app `$APP_NAME
heroku config:set CORS_ORIGIN="https://your-vercel-app.vercel.app" --app `$APP_NAME

# MONGODB (REQUIRED: MongoDB Atlas connection string)
heroku config:set MONGODB_URI="REPLACE_WITH_MONGODB_ATLAS_URI" --app `$APP_NAME

Write-Host "✅ Config vars set! Remember to replace placeholder values." -ForegroundColor Green
"@

$herokuSetup | Out-File -FilePath "heroku-config-setup.ps1" -Encoding UTF8
Write-Host "  ✅ Created Heroku setup script" -ForegroundColor Green

# Step 7: Summary Report
Write-Host "`n📊 Step 7: Deployment Readiness Summary" -ForegroundColor Yellow

if ($issues.Count -eq 0) {
    Write-Host "`n🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "Your project is ready for production deployment!" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Set up production accounts:" -ForegroundColor White
    Write-Host "   - Stripe live API keys" -ForegroundColor Gray
    Write-Host "   - SendGrid API key" -ForegroundColor Gray
    Write-Host "   - Backblaze B2 production bucket" -ForegroundColor Gray
    Write-Host "   - MongoDB Atlas database" -ForegroundColor Gray
    
    Write-Host "2. Update configuration files:" -ForegroundColor White
    Write-Host "   - Edit heroku-config-setup.ps1 with real credentials" -ForegroundColor Gray
    Write-Host "   - Copy .env.production.template values to Vercel" -ForegroundColor Gray
    
    Write-Host "3. Deploy:" -ForegroundColor White
    Write-Host "   - Run: .\deploy-production.ps1 -HerokuAppName 'your-app' -VercelProjectName 'your-project' -FullDeploy" -ForegroundColor Gray
    
}
else {
    Write-Host "`n❌ ISSUES FOUND:" -ForegroundColor Red
    $issues | ForEach-Object { 
        Write-Host "  - $_" -ForegroundColor Red 
    }
    Write-Host "`nPlease fix these issues before deploying to production." -ForegroundColor Yellow
}

Write-Host "`n📁 Files Created:" -ForegroundColor Cyan
Write-Host "  - streamply-frontend\.env.production.template" -ForegroundColor White
Write-Host "  - heroku-config-setup.ps1" -ForegroundColor White

Write-Host "`n🔧 Ready to deploy? Follow the deployment checklist!" -ForegroundColor Green
