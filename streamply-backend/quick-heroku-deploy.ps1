#!/usr/bin/env pwsh

Write-Host "🚀 Quick Heroku PostgreSQL Deployment for StreamPly" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Get app name from user
$appName = Read-Host "Enter your Heroku app name (e.g., streamply-backend-prod)"

Write-Host ""
Write-Host "📋 Deployment Steps:" -ForegroundColor Green
Write-Host ""

# Step 1: Login to Heroku
Write-Host "1️⃣  Login to Heroku..." -ForegroundColor Yellow
heroku login

# Step 2: Create app and add PostgreSQL
Write-Host "2️⃣  Creating app and adding PostgreSQL..." -ForegroundColor Yellow
heroku create $appName
heroku addons:create heroku-postgresql:mini --app $appName

# Step 3: Export local database
Write-Host "3️⃣  Exporting local database..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "streamply_backup_$timestamp.sql"

Write-Host "📤 Creating database backup..." -ForegroundColor Cyan
pg_dump -U streamply_user -h localhost -d streamply_dev --no-owner --no-privileges --file $backupFile

if (Test-Path $backupFile) {
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed. Check your PostgreSQL connection." -ForegroundColor Red
    exit 1
}

# Step 4: Import to Heroku
Write-Host "4️⃣  Importing to Heroku database..." -ForegroundColor Yellow
$dbUrl = heroku config:get DATABASE_URL --app $appName
Write-Host "Database URL obtained, importing..." -ForegroundColor Cyan

try {
    psql $dbUrl -f $backupFile
    Write-Host "✅ Database imported successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Direct import failed, trying Heroku CLI method..." -ForegroundColor Yellow
    Get-Content $backupFile | heroku pg:psql --app $appName
}

# Step 5: Set essential environment variables
Write-Host "5️⃣  Setting environment variables..." -ForegroundColor Yellow

# Copy JWT secret from local .env
if (Test-Path ".env") {
    $jwtSecret = (Get-Content ".env" | Where-Object { $_ -match "^JWT_SECRET=" }) -replace "JWT_SECRET=", "" -replace '"', ''
    if ($jwtSecret) {
        heroku config:set JWT_SECRET="$jwtSecret" --app $appName
        Write-Host "✅ JWT_SECRET copied from local .env" -ForegroundColor Green
    }
}

# Set other variables
heroku config:set NODE_ENV=production --app $appName
heroku config:set BCRYPT_ROUNDS=12 --app $appName
heroku config:set SENDGRID_FROM_EMAIL="noreply@streamply.com" --app $appName
heroku config:set SENDGRID_FROM_NAME="StreamPly" --app $appName

Write-Host "✅ Basic environment variables set" -ForegroundColor Green

# Step 6: Apply database triggers
Write-Host "6️⃣  Applying database triggers..." -ForegroundColor Yellow
if (Test-Path "simple-video-triggers.sql") {
    Get-Content "simple-video-triggers.sql" | heroku pg:psql --app $appName
    Write-Host "✅ Database triggers applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Trigger file not found, skipping" -ForegroundColor Yellow
}

# Step 7: Deploy
Write-Host "7️⃣  Deploying to Heroku..." -ForegroundColor Yellow

# Check if git repo exists
if (!(Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Add Heroku remote
heroku git:remote -a $appName

# Deploy
git add .
git commit -m "Deploy StreamPly to Heroku with PostgreSQL"
git push heroku main

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your app: https://$appName.herokuapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Manual setup required:" -ForegroundColor Yellow
Write-Host "1. Add SendGrid API key:" -ForegroundColor White
Write-Host "   heroku config:set SENDGRID_API_KEY='SG.your-key' --app $appName" -ForegroundColor Gray
Write-Host "2. Add Stripe keys (for production):" -ForegroundColor White
Write-Host "   heroku config:set STRIPE_SECRET_KEY='sk_live_...' --app $appName" -ForegroundColor Gray
Write-Host "3. Set frontend URL:" -ForegroundColor White
Write-Host "   heroku config:set FRONTEND_URL='https://your-vercel-app.vercel.app' --app $appName" -ForegroundColor Gray
Write-Host "4. Set CORS origin:" -ForegroundColor White
Write-Host "   heroku config:set CORS_ORIGIN='https://your-vercel-app.vercel.app' --app $appName" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Monitor your app:" -ForegroundColor Cyan
Write-Host "heroku logs --tail --app $appName" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Check database:" -ForegroundColor Cyan
Write-Host "heroku pg:info --app $appName" -ForegroundColor Gray

Read-Host "Press Enter to continue"
