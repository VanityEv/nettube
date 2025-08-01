#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory = $true)]
    [string]$AppName,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBackup,
    
    [Parameter(Mandatory = $false)]
    [switch]$Production
)

Write-Host "🚀 StreamPly Heroku PostgreSQL Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Heroku CLI
if (!(Get-Command heroku -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Heroku CLI not found. Please install: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Check if logged in to Heroku
try {
    $null = heroku auth:whoami
    Write-Host "✅ Heroku CLI authenticated" -ForegroundColor Green
}
catch {
    Write-Host "❌ Not logged in to Heroku. Please run: heroku login" -ForegroundColor Red
    exit 1
}

# Check pg_dump
if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pg_dump not found. Please install PostgreSQL client tools" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites met" -ForegroundColor Green
Write-Host ""

# Step 1: Create Heroku app
Write-Host "📱 Step 1: Creating Heroku app..." -ForegroundColor Yellow
try {
    heroku create $AppName
    Write-Host "✅ App '$AppName' created successfully" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  App '$AppName' might already exist, continuing..." -ForegroundColor Yellow
}

# Step 2: Add PostgreSQL addon
Write-Host "🗄️  Step 2: Adding PostgreSQL addon..." -ForegroundColor Yellow
try {
    heroku addons:create heroku-postgresql:mini --app $AppName
    Write-Host "✅ PostgreSQL addon added" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  PostgreSQL addon might already exist, continuing..." -ForegroundColor Yellow
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Backup local database
if (-not $SkipBackup) {
    Write-Host "💾 Step 3: Backing up local database..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "streamply_backup_$timestamp.sql"
    
    try {
        pg_dump -U streamply_user -h localhost -d streamply_dev --no-owner --no-privileges --file $backupFile
        Write-Host "✅ Database backup created: $backupFile" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Database backup failed. Please check your local PostgreSQL connection" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "⏭️  Step 3: Skipping backup (--SkipBackup flag used)" -ForegroundColor Yellow
    $backupFile = Read-Host "Enter path to existing backup file"
}

# Step 4: Get Heroku database URL
Write-Host "🔗 Step 4: Getting Heroku database info..." -ForegroundColor Yellow
$dbUrl = heroku config:get DATABASE_URL --app $AppName
Write-Host "✅ Database URL obtained" -ForegroundColor Green

# Step 5: Import database
Write-Host "📤 Step 5: Importing database to Heroku..." -ForegroundColor Yellow
try {
    psql $dbUrl -f $backupFile
    Write-Host "✅ Database imported successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Database import failed. Trying alternative method..." -ForegroundColor Red
    
    # Alternative method using Heroku CLI
    try {
        Get-Content $backupFile | heroku pg:psql --app $AppName
        Write-Host "✅ Database imported using alternative method" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Database import failed with both methods" -ForegroundColor Red
        Write-Host "Manual import required. Run:" -ForegroundColor Yellow
        Write-Host "heroku pg:psql --app $AppName < $backupFile" -ForegroundColor Gray
    }
}

# Step 6: Set environment variables
Write-Host "⚙️  Step 6: Setting environment variables..." -ForegroundColor Yellow

$envVars = @{
    "NODE_ENV"              = if ($Production) { "production" } else { "development" }
    "JWT_SECRET"            = "8d0897b0cdf001d20843e82cd50fe34400f554668d7a58d64179fc0a7c6f5315bcba557fe133caa5952b708a436cf4b5971717df90774fad89f4204188182acd"
    "BCRYPT_ROUNDS"         = "12"
    "SENDGRID_FROM_EMAIL"   = "noreply@streamply.com"
    "SENDGRID_FROM_NAME"    = "StreamPly"
    "B2_APPLICATION_KEY_ID" = "00314d6eb331d1b0000000001"
    "B2_APPLICATION_KEY"    = "K003pDl+XIgBMNnoSP6anP3hvwGDkUM"
    "B2_BUCKET_NAME"        = "streamply-bucket-prod"
    "B2_BUCKET_ID"          = "61e4fd069e9b5323918d011b"
    "B2_DOWNLOAD_URL"       = "https://f000.backblazeb2.com"
}

foreach ($key in $envVars.Keys) {
    try {
        heroku config:set "$key=$($envVars[$key])" --app $AppName
        Write-Host "✅ Set $key" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Failed to set $key" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "⚠️  Manual configuration required:" -ForegroundColor Yellow
Write-Host "1. Set SENDGRID_API_KEY (get from SendGrid dashboard)" -ForegroundColor White
Write-Host "2. Set STRIPE_SECRET_KEY (your live Stripe key)" -ForegroundColor White
Write-Host "3. Set FRONTEND_URL (your Vercel app URL)" -ForegroundColor White
Write-Host "4. Set CORS_ORIGIN (same as FRONTEND_URL)" -ForegroundColor White
Write-Host ""

# Step 7: Apply database triggers
Write-Host "🔧 Step 7: Applying database triggers..." -ForegroundColor Yellow
if (Test-Path "simple-video-triggers.sql") {
    try {
        Get-Content "simple-video-triggers.sql" | heroku pg:psql --app $AppName
        Write-Host "✅ Database triggers applied" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Failed to apply triggers automatically" -ForegroundColor Yellow
        Write-Host "Manual trigger setup required" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  simple-video-triggers.sql not found, skipping triggers" -ForegroundColor Yellow
}

# Step 8: Create Procfile
Write-Host "📝 Step 8: Creating Procfile..." -ForegroundColor Yellow
"web: node index.js" | Out-File -FilePath "Procfile" -Encoding ASCII -NoNewline
Write-Host "✅ Procfile created" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "🎉 Deployment setup complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Complete manual environment variable setup" -ForegroundColor White
Write-Host "2. Test database connection:" -ForegroundColor White
Write-Host "   heroku pg:info --app $AppName" -ForegroundColor Gray
Write-Host "3. Deploy your app:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Deploy to Heroku'" -ForegroundColor Gray
Write-Host "   heroku git:remote -a $AppName" -ForegroundColor Gray
Write-Host "   git push heroku main" -ForegroundColor Gray
Write-Host "4. Monitor logs:" -ForegroundColor White
Write-Host "   heroku logs --tail --app $AppName" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Your app will be available at: https://$AppName.herokuapp.com" -ForegroundColor Cyan
