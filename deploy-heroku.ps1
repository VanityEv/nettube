#!/usr/bin/env pwsh
# Heroku Deployment Script for Streamply Backend
# Run this script to deploy your secure backend to Heroku

Write-Host "🚀 Streamply Heroku Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "streamply-backend\package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
Set-Location streamply-backend

Write-Host "📋 Starting Heroku deployment..." -ForegroundColor Yellow

# Step 1: Create Heroku app (if not exists)
$appName = Read-Host "Enter your Heroku app name (or press Enter to auto-generate)"
if ([string]::IsNullOrWhiteSpace($appName)) {
    Write-Host "1️⃣ Creating Heroku app..." -ForegroundColor Green
    heroku create
}
else {
    Write-Host "1️⃣ Creating Heroku app: $appName..." -ForegroundColor Green
    heroku create $appName
}

# Step 2: Add PostgreSQL addon
Write-Host "2️⃣ Adding PostgreSQL addon..." -ForegroundColor Green
heroku addons:create heroku-postgresql:essential-0

# Step 3: Set environment variables
Write-Host "3️⃣ Setting environment variables..." -ForegroundColor Green
Write-Host "   ⚠️  You need to set these manually in Heroku Dashboard or via CLI:" -ForegroundColor Yellow

$envVars = @(
    "JWT_SECRET",
    "STRIPE_SECRET_KEY", 
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SENDGRID_API_KEY",
    "FROM_EMAIL",
    "B2_KEY_ID",
    "B2_APPLICATION_KEY", 
    "B2_BUCKET_NAME",
    "B2_BUCKET_ID",
    "FRONTEND_URL",
    "CORS_ORIGIN",
    "MONGO_URI",
    "NODE_ENV=production"
)

foreach ($var in $envVars) {
    Write-Host "      heroku config:set $var=your_value_here" -ForegroundColor Gray
}

# Step 4: Create Procfile
Write-Host "4️⃣ Creating Procfile..." -ForegroundColor Green
@"
web: npm start
release: npx prisma migrate deploy
"@ | Out-File -FilePath "Procfile" -Encoding utf8NoBOM

# Step 5: Update package.json scripts for Heroku
Write-Host "5️⃣ Updating package.json for Heroku..." -ForegroundColor Green

# Read current package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json

# Add Heroku-specific scripts
if (-not $packageJson.scripts) {
    $packageJson.scripts = @{}
}

$packageJson.scripts.start = "node index.js"
$packageJson.scripts.build = "npx prisma generate"
$packageJson.scripts."heroku-postbuild" = "npx prisma generate"

# Convert back to JSON and save
$packageJson | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding utf8NoBOM

# Step 6: Initialize git and deploy
Write-Host "6️⃣ Deploying to Heroku..." -ForegroundColor Green

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit - Secure Streamply backend"
}

# Add Heroku remote and deploy
git add .
git commit -m "Heroku deployment configuration" -AllowEmpty
git push heroku main

# Step 7: Run database migration
Write-Host "7️⃣ Running database migration..." -ForegroundColor Green
heroku run npx prisma migrate deploy

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set your environment variables in Heroku Dashboard" -ForegroundColor White
Write-Host "2. Configure your Stripe webhooks to point to your Heroku app" -ForegroundColor White
Write-Host "3. Update your Vercel frontend with the new backend URL" -ForegroundColor White
Write-Host "4. Test all functionality in production" -ForegroundColor White
Write-Host ""

# Get the app URL
$appUrl = heroku info -s | Where-Object { $_ -like "web_url=*" } | ForEach-Object { $_.Split("=")[1] }
Write-Host "🌐 Your backend is available at: $appUrl" -ForegroundColor Cyan

Set-Location ..
