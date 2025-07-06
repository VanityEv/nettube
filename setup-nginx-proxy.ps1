# Streamply NGINX Proxy Setup Script
# This script sets up the complete NGINX reverse proxy environment

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SSL,
    
    [Parameter(Mandatory=$false)]
    [switch]$Build,
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean
)

Write-Host "🚀 Streamply NGINX Proxy Setup" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Create necessary directories
$directories = @(
    "nginx/ssl",
    "nginx/logs",
    "logs/nginx",
    "data/postgres",
    "data/mongo",
    "data/redis"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

# Clean up if requested
if ($Clean) {
    Write-Host "🧹 Cleaning up Docker containers and volumes..." -ForegroundColor Yellow
    
    docker-compose down -v --remove-orphans
    docker system prune -f
    docker volume prune -f
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Generate SSL certificates if requested
if ($SSL) {
    Write-Host "🔐 Generating SSL certificates..." -ForegroundColor Yellow
    
    if (!(Test-Path "nginx/ssl/server.crt")) {
        # Generate private key
        openssl genrsa -out nginx/ssl/server.key 2048
        
        # Generate certificate
        openssl req -new -x509 -key nginx/ssl/server.key -out nginx/ssl/server.crt -days 365 -subj "/C=US/ST=State/L=City/O=Streamply/OU=Development/CN=localhost"
        
        Write-Host "✅ SSL certificates generated" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ SSL certificates already exist" -ForegroundColor Blue
    }
}

# Build Docker images if requested
if ($Build) {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    
    # Build frontend
    Write-Host "Building frontend..." -ForegroundColor Cyan
    Set-Location streamply-frontend
    yarn build
    Set-Location ..
    
    # Build Docker images
    docker-compose build --no-cache
    
    Write-Host "✅ Docker images built successfully" -ForegroundColor Green
}

# Copy environment files
if ($Environment -eq "production") {
    Copy-Item ".env.docker" ".env" -Force
    Write-Host "✅ Production environment configured" -ForegroundColor Green
} else {
    if (!(Test-Path ".env")) {
        Copy-Item ".env.docker" ".env" -Force
        Write-Host "⚠️ Created .env from .env.docker template" -ForegroundColor Yellow
        Write-Host "Please update .env with your actual values" -ForegroundColor Red
    }
}

# Validate required environment variables
$requiredVars = @(
    "JWT_SECRET",
    "B2_APPLICATION_KEY_ID",
    "B2_APPLICATION_KEY",
    "STRIPE_SECRET_KEY"
)

$envFile = Get-Content ".env" -ErrorAction SilentlyContinue
$missingVars = @()

foreach ($var in $requiredVars) {
    if (!($envFile | Select-String "^$var=")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️ Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Please update your .env file" -ForegroundColor Yellow
}

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow

if ($Environment -eq "development") {
    docker-compose --profile development up -d
} else {
    docker-compose up -d
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Health checks
$services = @(
    @{ Name = "NGINX"; URL = "http://localhost/health" },
    @{ Name = "Backend API"; URL = "http://localhost/api/health" },
    @{ Name = "Database"; Command = "docker exec streamply-postgres pg_isready -U streamply" }
)

Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

foreach ($service in $services) {
    if ($service.URL) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
            } else {
                Write-Host "❌ $($service.Name) returned status $($response.StatusCode)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ $($service.Name) is not responding" -ForegroundColor Red
        }
    } elseif ($service.Command) {
        $result = Invoke-Expression $service.Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ $($service.Name) health check failed" -ForegroundColor Red
        }
    }
}

# Display service information
Write-Host "`n📊 Service Information:" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost" -ForegroundColor White
Write-Host "🔧 API: http://localhost/api" -ForegroundColor White
Write-Host "🗄️ Database: localhost:5432" -ForegroundColor White
Write-Host "📝 Logs: localhost:27017" -ForegroundColor White
Write-Host "💾 Cache: localhost:6379" -ForegroundColor White

if ($Environment -eq "development") {
    Write-Host "🔧 Adminer: http://localhost:8080" -ForegroundColor White
}

# Display logs command
Write-Host "`n📋 Useful commands:" -ForegroundColor Cyan
Write-Host "View logs: docker-compose logs -f [service]" -ForegroundColor White
Write-Host "Stop services: docker-compose down" -ForegroundColor White
Write-Host "Restart service: docker-compose restart [service]" -ForegroundColor White
Write-Host "View containers: docker-compose ps" -ForegroundColor White

Write-Host "`n🎉 Streamply NGINX Proxy setup completed!" -ForegroundColor Green
