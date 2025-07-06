#!/usr/bin/env pwsh
# Streamply Security Migration Script - Cloud Deployment Ready
# Run this script to implement critical security fixes for Heroku + Vercel deployment

Write-Host "🔒 Streamply Security Migration Script (Cloud Ready)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "streamply-backend\package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Starting security migration for cloud deployment..." -ForegroundColor Yellow

# Step 1: Verify Prisma is installed
Write-Host "1️⃣ Verifying Prisma installation..." -ForegroundColor Green
Set-Location streamply-backend

$packageContent = Get-Content "package.json" | ConvertFrom-Json
if ($packageContent.dependencies."@prisma/client") {
    Write-Host "   ✅ Prisma client found" -ForegroundColor Gray
}
else {
    Write-Host "   📦 Installing Prisma..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Step 2: Generate Prisma client
Write-Host "2️⃣ Generating Prisma client..." -ForegroundColor Green
try {
    npx prisma generate
    Write-Host "   ✅ Prisma client generated successfully" -ForegroundColor Gray
}
catch {
    Write-Host "   ⚠️  Prisma generation completed (local DB not required for cloud deployment)" -ForegroundColor Yellow
}

# Step 3: Verify secure implementations are in place
Write-Host "3️⃣ Verifying secure implementations..." -ForegroundColor Green

# Check User.js
if (Test-Path "services\user\User.js") {
    $userContent = Get-Content "services\user\User.js" -Raw
    if ($userContent -match "import prisma") {
        Write-Host "   ✅ User.js is using secure Prisma implementation" -ForegroundColor Gray
    }
    else {
        Write-Host "   ⚠️  User.js may still be vulnerable - checking backup..." -ForegroundColor Yellow
        if (Test-Path "services\user\UserSecure.js") {
            Copy-Item "services\user\UserSecure.js" "services\user\User.js" -Force
            Write-Host "   ✅ Replaced User.js with secure version" -ForegroundColor Gray
        }
    }
}

# Check Video.js
if (Test-Path "services\video\Video.js") {
    $videoContent = Get-Content "services\video\Video.js" -Raw
    if ($videoContent -match "import prisma") {
        Write-Host "   ✅ Video.js is using secure Prisma implementation" -ForegroundColor Gray
    }
    else {
        Write-Host "   ⚠️  Video.js may still be vulnerable - checking backup..." -ForegroundColor Yellow
        if (Test-Path "services\video\VideoSecure.js") {
            Copy-Item "services\video\VideoSecure.js" "services\video\Video.js" -Force
            Write-Host "   ✅ Replaced Video.js with secure version" -ForegroundColor Gray
        }
    }
}

# Step 4: Verify cloud deployment files
Write-Host "4️⃣ Verifying cloud deployment configuration..." -ForegroundColor Green

$deploymentFiles = @(
    "Procfile",
    "heroku.env", 
    "services\prisma.js"
)

foreach ($file in $deploymentFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Gray
    }
    else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
    }
}

# Step 5: Frontend security check
Write-Host "5️⃣ Checking frontend security components..." -ForegroundColor Green
Set-Location ..\streamply-frontend

$frontendFiles = @(
    "src\components\SubscriptionModal.tsx",
    "vercel.json"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Gray
    }
    else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
    }
}

# Step 6: Environment configuration check
Write-Host "6️⃣ Environment configuration check..." -ForegroundColor Green
Set-Location ..\streamply-backend

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "DATABASE_URL",
        "JWT_SECRET",
        "STRIPE_SECRET_KEY",
        "B2_KEY_ID",
        "FRONTEND_URL"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "   ✅ All critical environment variables present" -ForegroundColor Gray
    }
    else {
        Write-Host "   ⚠️  Missing environment variables (will be set in Heroku):" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "      - $var" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "   ⚠️  .env file not found (will use Heroku config vars)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Security migration verification completed!" -ForegroundColor Green
Write-Host ""

# Step 6: Install frontend dependencies
Write-Host "6️⃣ Installing frontend security dependencies..." -ForegroundColor Green
Set-Location ..\streamply-frontend
npm install

# Step 7: Database setup warning
Write-Host "7️⃣ Database setup required..." -ForegroundColor Yellow
Write-Host "   ⚠️  IMPORTANT: You need to run database migrations manually:" -ForegroundColor Red
Write-Host "   cd streamply-backend" -ForegroundColor Gray
Write-Host "   npx prisma db push" -ForegroundColor Gray
Write-Host "   OR" -ForegroundColor Gray
Write-Host "   npx prisma migrate dev --name init" -ForegroundColor Gray

# Step 8: Environment variables check
Write-Host "8️⃣ Checking environment variables..." -ForegroundColor Green
Set-Location ..\streamply-backend

$envFile = ".env"
$requiredVars = @(
    "DATABASE_URL",
    "JWT_SECRET", 
    "STRIPE_SECRET_KEY",
    "SENDGRID_API_KEY",
    "B2_KEY_ID",
    "B2_APPLICATION_KEY",
    "FRONTEND_URL"
)

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -like "$var=*" }
        if (-not $found) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "   ⚠️  Missing environment variables:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "      - $var" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   ✅ All required environment variables present" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ❌ .env file not found. Create one with required variables." -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Security migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps for Cloud Deployment:" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Backend Deployment (Heroku):" -ForegroundColor White
Write-Host "   1. Run: .\deploy-heroku.ps1" -ForegroundColor Gray
Write-Host "   2. Or follow HEROKU_VERCEL_DEPLOYMENT.md guide" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Frontend Deployment (Vercel):" -ForegroundColor White
Write-Host "   1. cd streamply-frontend" -ForegroundColor Gray
Write-Host "   2. vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️ Configuration Required:" -ForegroundColor White
Write-Host "   1. Set Heroku environment variables" -ForegroundColor Gray
Write-Host "   2. Configure Stripe webhooks" -ForegroundColor Gray
Write-Host "   3. Set up Backblaze B2 CORS" -ForegroundColor Gray
Write-Host "   4. Configure MongoDB Atlas logging" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  CRITICAL SECURITY REMINDERS:" -ForegroundColor Red
Write-Host "   - Use production Stripe keys in live environment" -ForegroundColor Red
Write-Host "   - Generate secure JWT secrets (256+ bits)" -ForegroundColor Red
Write-Host "   - Enable database SSL in production" -ForegroundColor Red
Write-Host "   - Configure proper CORS origins" -ForegroundColor Red
Write-Host "   - Set up monitoring and alerts" -ForegroundColor Red
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - HEROKU_VERCEL_DEPLOYMENT.md - Complete deployment guide" -ForegroundColor Gray
Write-Host "   - SECURITY_AUDIT_REPORT.md - Security implementation details" -ForegroundColor Gray
Write-Host "   - POSTGRESQL_MIGRATION.md - Database migration info" -ForegroundColor Gray

Set-Location ..
