# =============================================================================
# STREAMPLY PRODUCTION DEPLOYMENT SCRIPT
# Deploys backend to Heroku and frontend to Vercel
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$HerokuAppName,
    
    [Parameter(Mandatory = $true)]
    [string]$VercelProjectName,
    
    [Parameter(Mandatory = $false)]
    [switch]$SetupEnv,
    
    [Parameter(Mandatory = $false)]
    [switch]$DeployBackend,
    
    [Parameter(Mandatory = $false)]
    [switch]$DeployFrontend,
    
    [Parameter(Mandatory = $false)]
    [switch]$FullDeploy
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Streamply Production Deployment" -ForegroundColor Green
Write-Host "Backend: $HerokuAppName.herokuapp.com" -ForegroundColor Yellow
Write-Host "Frontend: $VercelProjectName.vercel.app" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

# Check prerequisites
function Test-Prerequisites {
    Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    $missing = @()
    
    # Check Heroku CLI
    try {
        heroku --version | Out-Null
        Write-Host "  ✅ Heroku CLI installed" -ForegroundColor Green
    }
    catch {
        $missing += "Heroku CLI"
        Write-Host "  ❌ Heroku CLI not found" -ForegroundColor Red
    }
    
    # Check Vercel CLI
    try {
        vercel --version | Out-Null
        Write-Host "  ✅ Vercel CLI installed" -ForegroundColor Green
    }
    catch {
        $missing += "Vercel CLI"
        Write-Host "  ❌ Vercel CLI not found" -ForegroundColor Red
    }
    
    # Check Git
    try {
        git --version | Out-Null
        Write-Host "  ✅ Git installed" -ForegroundColor Green
    }
    catch {
        $missing += "Git"
        Write-Host "  ❌ Git not found" -ForegroundColor Red
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "`n❌ Missing prerequisites:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host "`nInstall missing tools and try again." -ForegroundColor Yellow
        exit 1
    }
}

# Setup environment variables
function Set-EnvironmentVariables {
    Write-Host "`n🔧 Setting up environment variables..." -ForegroundColor Yellow
    
    # Prompt for required variables
    $envVars = @{}
    
    Write-Host "`n🔐 Security Configuration:" -ForegroundColor Cyan
    $envVars["JWT_SECRET"] = Read-Host "Enter JWT Secret (256-bit minimum)"
    
    Write-Host "`n💳 Stripe Configuration:" -ForegroundColor Cyan
    $envVars["STRIPE_SECRET_KEY"] = Read-Host "Enter Stripe Secret Key (sk_live_...)"
    $envVars["STRIPE_PUBLISHABLE_KEY"] = Read-Host "Enter Stripe Publishable Key (pk_live_...)"
    $envVars["STRIPE_WEBHOOK_SECRET"] = Read-Host "Enter Stripe Webhook Secret (whsec_...)"
    
    Write-Host "`n📧 Email Configuration:" -ForegroundColor Cyan
    $envVars["SENDGRID_API_KEY"] = Read-Host "Enter SendGrid API Key (SG....)"
    $envVars["FROM_EMAIL"] = Read-Host "Enter From Email Address"
    
    Write-Host "`n☁️ Backblaze B2 Configuration:" -ForegroundColor Cyan
    $envVars["B2_KEY_ID"] = Read-Host "Enter B2 Application Key ID"
    $envVars["B2_APPLICATION_KEY"] = Read-Host "Enter B2 Application Key"
    $envVars["B2_BUCKET_NAME"] = Read-Host "Enter B2 Bucket Name"
    $envVars["B2_BUCKET_ID"] = Read-Host "Enter B2 Bucket ID"
    
    Write-Host "`n🗄️ MongoDB Configuration:" -ForegroundColor Cyan
    $envVars["MONGODB_URI"] = Read-Host "Enter MongoDB Atlas URI (mongodb+srv://...)"
    
    # Set URLs
    $envVars["FRONTEND_URL"] = "https://$VercelProjectName.vercel.app"
    $envVars["CORS_ORIGIN"] = "https://$VercelProjectName.vercel.app"
    $envVars["BCRYPT_ROUNDS"] = "12"
    
    # Set Heroku config vars
    Write-Host "`n📤 Setting Heroku config vars..." -ForegroundColor Yellow
    foreach ($key in $envVars.Keys) {
        Write-Host "  Setting $key..." -NoNewline
        try {
            heroku config:set "$key=$($envVars[$key])" -a $HerokuAppName | Out-Null
            Write-Host " ✅" -ForegroundColor Green
        }
        catch {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return $envVars
}

# Deploy backend to Heroku
function Deploy-Backend {
    Write-Host "`n🚀 Deploying backend to Heroku..." -ForegroundColor Yellow
    
    Set-Location "streamply-backend"
    
    try {
        # Initialize git if needed
        if (!(Test-Path ".git")) {
            Write-Host "  Initializing Git repository..." -ForegroundColor Cyan
            git init
            git add .
            git commit -m "Initial commit for Heroku deployment"
        }
        
        # Add Heroku remote
        Write-Host "  Adding Heroku remote..." -ForegroundColor Cyan
        try {
            heroku git:remote -a $HerokuAppName
        }
        catch {
            # Remote might already exist
            Write-Host "    Remote already exists, continuing..." -ForegroundColor Yellow
        }
        
        # Add PostgreSQL addon if not exists
        Write-Host "  Ensuring PostgreSQL addon..." -ForegroundColor Cyan
        try {
            heroku addons:create heroku-postgresql:essential-0 -a $HerokuAppName 2>$null
            Write-Host "    PostgreSQL addon created" -ForegroundColor Green
        }
        catch {
            Write-Host "    PostgreSQL addon already exists" -ForegroundColor Yellow
        }
        
        # Deploy to Heroku
        Write-Host "  Pushing to Heroku..." -ForegroundColor Cyan
        git add .
        git commit -m "Deploy to Heroku - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -q
        git push heroku main
        
        Write-Host "  ✅ Backend deployed successfully!" -ForegroundColor Green
        Write-Host "    URL: https://$HerokuAppName.herokuapp.com" -ForegroundColor White
        
    }
    catch {
        Write-Host "  ❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Set-Location ".."
    }
    
    return $true
}

# Deploy frontend to Vercel
function Deploy-Frontend {
    param($BackendUrl)
    
    Write-Host "`n🌐 Deploying frontend to Vercel..." -ForegroundColor Yellow
    
    Set-Location "streamply-frontend"
    
    try {
        # Update environment configuration
        Write-Host "  Updating production environment..." -ForegroundColor Cyan
        
        # Create production environment file
        $prodEnv = @"
REACT_APP_BACKEND_URL=$BackendUrl
REACT_APP_API_URL=$BackendUrl
REACT_APP_USE_PROXY=false
REACT_APP_NODE_ENV=production
REACT_APP_ENABLE_ANTI_PIRACY=true
REACT_APP_WATERMARK_ENABLED=true
REACT_APP_ENABLE_DEVICE_FINGERPRINTING=true
REACT_APP_DEFAULT_VIDEO_QUALITY=720p
REACT_APP_ENABLE_AUTO_QUALITY=true
REACT_APP_ENABLE_HLS=true
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
REACT_APP_DEBUG=false
"@
        $prodEnv | Out-File -FilePath ".env.production" -Encoding UTF8
        
        # Update vercel.json with correct backend URL
        $vercelConfig = Get-Content "vercel.json" | ConvertFrom-Json
        $vercelConfig.env.REACT_APP_BACKEND_URL = $BackendUrl
        $vercelConfig | ConvertTo-Json -Depth 10 | Out-File "vercel.json" -Encoding UTF8
        
        # Deploy to Vercel
        Write-Host "  Deploying to Vercel..." -ForegroundColor Cyan
        vercel --prod --yes --name $VercelProjectName
        
        Write-Host "  ✅ Frontend deployed successfully!" -ForegroundColor Green
        Write-Host "    URL: https://$VercelProjectName.vercel.app" -ForegroundColor White
        
    }
    catch {
        Write-Host "  ❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Set-Location ".."
    }
    
    return $true
}

# Test deployment
function Test-Deployment {
    param($BackendUrl, $FrontendUrl)
    
    Write-Host "`n🧪 Testing deployment..." -ForegroundColor Yellow
    
    # Test backend
    try {
        Write-Host "  Testing backend API..." -NoNewline
        $response = Invoke-RestMethod -Uri "$BackendUrl/videos/all" -TimeoutSec 30
        Write-Host " ✅" -ForegroundColor Green
    }
    catch {
        Write-Host " ⚠️ (Expected - may need authentication)" -ForegroundColor Yellow
    }
    
    # Test frontend
    try {
        Write-Host "  Testing frontend..." -NoNewline
        $response = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
        }
        else {
            Write-Host " ❌ Status: $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
try {
    Test-Prerequisites
    
    $backendUrl = "https://$HerokuAppName.herokuapp.com"
    $frontendUrl = "https://$VercelProjectName.vercel.app"
    
    if ($SetupEnv -or $FullDeploy) {
        $envVars = Set-EnvironmentVariables
    }
    
    if ($DeployBackend -or $FullDeploy) {
        if (!(Deploy-Backend)) {
            exit 1
        }
    }
    
    if ($DeployFrontend -or $FullDeploy) {
        if (!(Deploy-Frontend -BackendUrl $backendUrl)) {
            exit 1
        }
    }
    
    if ($FullDeploy) {
        Test-Deployment -BackendUrl $backendUrl -FrontendUrl $frontendUrl
    }
    
    Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "Frontend: $frontendUrl" -ForegroundColor White
    Write-Host "Backend: $backendUrl" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Update DNS records if using custom domain" -ForegroundColor White
    Write-Host "2. Configure Stripe webhooks: $backendUrl/stripe/webhook" -ForegroundColor White
    Write-Host "3. Test video upload and streaming functionality" -ForegroundColor White
    Write-Host "4. Set up monitoring and alerting" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
