# Streamply Production Deployment Setup
# This script prepares your environment for Heroku and Vercel deployment

Write-Host "🚀 Streamply Production Deployment Setup" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

# Step 1: Install Required CLIs
Write-Host "`n📦 Step 1: Installing Required Tools" -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor White
    exit 1
}

# Install Heroku CLI
Write-Host "`n🔧 Installing Heroku CLI..." -ForegroundColor Cyan
try {
    heroku --version | Out-Null
    Write-Host "✅ Heroku CLI already installed" -ForegroundColor Green
}
catch {
    Write-Host "📦 Installing Heroku CLI via npm..." -ForegroundColor Yellow
    npm install -g heroku
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Heroku CLI installed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to install Heroku CLI" -ForegroundColor Red
        Write-Host "   Manual installation: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor White
    }
}

# Install Vercel CLI
Write-Host "`n🔧 Installing Vercel CLI..." -ForegroundColor Cyan
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI already installed" -ForegroundColor Green
}
catch {
    Write-Host "📦 Installing Vercel CLI via npm..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "   Manual installation: https://vercel.com/cli" -ForegroundColor White
    }
}

# Step 2: Update Frontend Configuration
Write-Host "`n🌐 Step 2: Updating Frontend Configuration" -ForegroundColor Yellow

$frontendEnv = @"
# =============================================================================
# PRODUCTION ENVIRONMENT VARIABLES FOR VERCEL
# Add these to your Vercel project settings
# =============================================================================

# CRITICAL: Disable proxy mode for direct backend connection
REACT_APP_USE_PROXY=false

# BACKEND URLS (Replace 'your-app-name' with your actual Heroku app name)
REACT_APP_BACKEND_URL=https://your-app-name.herokuapp.com
REACT_APP_API_URL=https://your-app-name.herokuapp.com

# STRIPE (Use your live keys for production)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# ENVIRONMENT
REACT_APP_NODE_ENV=production

# ANTI-PIRACY & SECURITY
REACT_APP_ENABLE_ANTI_PIRACY=true
REACT_APP_WATERMARK_ENABLED=true
REACT_APP_ENABLE_DEVICE_FINGERPRINTING=true

# VIDEO SETTINGS
REACT_APP_DEFAULT_VIDEO_QUALITY=720p
REACT_APP_ENABLE_AUTO_QUALITY=true
REACT_APP_ENABLE_HLS=true

# BUILD OPTIMIZATION
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
REACT_APP_DEBUG=false
"@

$frontendEnv | Out-File -FilePath "streamply-frontend\.env.production.vercel" -Encoding UTF8
Write-Host "✅ Created frontend environment template: streamply-frontend\.env.production.vercel" -ForegroundColor Green

# Step 3: Create Heroku Configuration
Write-Host "`n⚙️ Step 3: Creating Heroku Configuration" -ForegroundColor Yellow

$herokuConfig = @"
# =============================================================================
# HEROKU CONFIG VARS SETUP
# Run these commands after creating your Heroku app
# =============================================================================

# Replace 'your-app-name' with your actual Heroku app name
`$APP_NAME = "your-app-name"

# CORE SETTINGS
heroku config:set NODE_ENV=production --app `$APP_NAME
heroku config:set BCRYPT_ROUNDS=12 --app `$APP_NAME

# SECURITY (Generate a strong JWT secret)
heroku config:set JWT_SECRET="your-super-secure-256-bit-jwt-secret-key" --app `$APP_NAME

# STRIPE (Replace with your actual live keys)
heroku config:set STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key" --app `$APP_NAME
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key" --app `$APP_NAME
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" --app `$APP_NAME

# EMAIL (SendGrid)
heroku config:set SENDGRID_API_KEY="SG.your_sendgrid_api_key" --app `$APP_NAME
heroku config:set FROM_EMAIL="noreply@yourdomain.com" --app `$APP_NAME

# BACKBLAZE B2 (Replace with your production credentials)
heroku config:set B2_APPLICATION_KEY_ID="your_b2_key_id" --app `$APP_NAME
heroku config:set B2_APPLICATION_KEY="your_b2_application_key" --app `$APP_NAME
heroku config:set B2_BUCKET_NAME="streamply-videos-prod" --app `$APP_NAME
heroku config:set B2_BUCKET_ID="your_b2_bucket_id" --app `$APP_NAME

# FRONTEND URL (Replace with your Vercel domain)
heroku config:set FRONTEND_URL="https://your-vercel-app.vercel.app" --app `$APP_NAME
heroku config:set CORS_ORIGIN="https://your-vercel-app.vercel.app" --app `$APP_NAME

# MONGODB (MongoDB Atlas connection string)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/streamply_logs" --app `$APP_NAME

# DATABASE_URL and REDIS_URL will be automatically set by Heroku addons
"@

$herokuConfig | Out-File -FilePath "heroku-setup.ps1" -Encoding UTF8
Write-Host "✅ Created Heroku setup script: heroku-setup.ps1" -ForegroundColor Green

# Step 4: Create deployment checklist
Write-Host "`n📋 Step 4: Creating Deployment Checklist" -ForegroundColor Yellow

$checklist = @"
# 🚀 STREAMPLY PRODUCTION DEPLOYMENT CHECKLIST

## BEFORE DEPLOYMENT

### 1. Set Up Production Accounts
- [ ] Stripe Account (Live keys)
- [ ] SendGrid Account (API key)  
- [ ] Backblaze B2 Account (Production bucket)
- [ ] MongoDB Atlas (Database cluster)

### 2. Install CLIs
- [ ] Heroku CLI installed
- [ ] Vercel CLI installed
- [ ] Logged into both services

### 3. Prepare Environment Variables
- [ ] Updated heroku-setup.ps1 with real credentials
- [ ] Updated .env.production.vercel with real values

## DEPLOYMENT STEPS

### 1. Deploy Backend to Heroku
```powershell
# Navigate to backend directory
cd streamply-backend

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Add buildpacks
heroku buildpacks:add --index 1 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
heroku buildpacks:add --index 2 heroku/nodejs

# Add database addons
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini

# Set environment variables (run your heroku-setup.ps1 commands)
# ... (all the config:set commands)

# Deploy
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a your-app-name
git push heroku main
```

### 2. Deploy Frontend to Vercel
```powershell
# Navigate to frontend directory
cd streamply-frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Copy values from .env.production.vercel
```

### 3. Update CORS Settings
- [ ] Update backend VideoRouter.js with your Vercel domain
- [ ] Update UserRouter.js with your Vercel domain
- [ ] Update ReviewRouter.js with your Vercel domain

### 4. Test Deployment
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Authentication works
- [ ] Video upload/streaming works

## POST-DEPLOYMENT

### 1. Configure Webhooks
- [ ] Stripe webhook: https://your-app.herokuapp.com/user/stripe/webhook

### 2. DNS/Domain Setup (Optional)
- [ ] Custom domain for Heroku app
- [ ] Custom domain for Vercel app

### 3. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance
- [ ] Set up alerts

## ARCHITECTURE CHANGE

**Current (Local/Docker):**
Frontend -> NGINX Proxy -> Backend

**Production:**
Frontend (Vercel) -> Backend (Heroku)

Key difference: No NGINX proxy in production, direct connection.
"@

$checklist | Out-File -FilePath "DEPLOYMENT_CHECKLIST.md" -Encoding UTF8
Write-Host "✅ Created deployment checklist: DEPLOYMENT_CHECKLIST.md" -ForegroundColor Green

# Summary
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Install CLIs if they failed: npm install -g heroku vercel" -ForegroundColor White
Write-Host "2. Set up production accounts (Stripe, SendGrid, B2, MongoDB Atlas)" -ForegroundColor White
Write-Host "3. Update heroku-setup.ps1 with your real credentials" -ForegroundColor White
Write-Host "4. Update .env.production.vercel with your real values" -ForegroundColor White
Write-Host "5. Follow the DEPLOYMENT_CHECKLIST.md step by step" -ForegroundColor White

Write-Host "`n⚠️ IMPORTANT CHANGES FOR PRODUCTION:" -ForegroundColor Red
Write-Host "- REACT_APP_USE_PROXY=false (disables NGINX proxy)" -ForegroundColor Yellow
Write-Host "- REACT_APP_BACKEND_URL=https://your-app.herokuapp.com" -ForegroundColor Yellow
Write-Host "- Update CORS in backend to allow your Vercel domain" -ForegroundColor Yellow
Write-Host "- Use production API keys (not development/test keys)" -ForegroundColor Yellow

Write-Host "`n🔧 Ready to deploy? Run:" -ForegroundColor Cyan
Write-Host "1. heroku login" -ForegroundColor White
Write-Host "2. vercel login" -ForegroundColor White
Write-Host "3. Follow DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
