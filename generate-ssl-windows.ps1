# Generate SSL certificates for NGINX on Windows
# This script creates self-signed certificates for development

Write-Host "🔐 Generating SSL certificates for NGINX..." -ForegroundColor Yellow

# Create SSL directory if it doesn't exist
$sslPath = "nginx/ssl"
if (!(Test-Path $sslPath)) {
    New-Item -ItemType Directory -Path $sslPath -Force
    Write-Host "✅ Created SSL directory" -ForegroundColor Green
}

# Check if OpenSSL is available (via Git Bash, WSL, or standalone)
$opensslPaths = @(
    "C:\Program Files\Git\usr\bin\openssl.exe",
    "C:\Program Files (x86)\Git\usr\bin\openssl.exe",
    "openssl"
)

$opensslCmd = $null
foreach ($path in $opensslPaths) {
    try {
        if (Test-Path $path -ErrorAction SilentlyContinue) {
            $opensslCmd = $path
            break
        } elseif ($path -eq "openssl") {
            & $path version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $opensslCmd = $path
                break
            }
        }
    } catch {
        continue
    }
}

if ($opensslCmd) {
    Write-Host "✅ Found OpenSSL at: $opensslCmd" -ForegroundColor Green
    
    # Generate private key
    & $opensslCmd genrsa -out "$sslPath/server.key" 2048
    
    # Generate certificate
    & $opensslCmd req -new -x509 -key "$sslPath/server.key" -out "$sslPath/server.crt" -days 365 -subj "/C=US/ST=Development/L=Localhost/O=Streamply/OU=Development/CN=localhost"
    
    if (Test-Path "$sslPath/server.crt" -and Test-Path "$sslPath/server.key") {
        Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
        Write-Host "📁 Certificate: $sslPath/server.crt" -ForegroundColor White
        Write-Host "🔑 Private Key: $sslPath/server.key" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to generate SSL certificates" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ OpenSSL not found. Creating placeholder certificates..." -ForegroundColor Yellow
    Write-Host "For production, please install OpenSSL or use proper certificates" -ForegroundColor Red
    
    # Create placeholder files
    "# Placeholder SSL Certificate - Replace with real certificate in production" | Out-File -FilePath "$sslPath/server.crt" -Encoding UTF8
    "# Placeholder SSL Private Key - Replace with real key in production" | Out-File -FilePath "$sslPath/server.key" -Encoding UTF8
    
    Write-Host "📝 Placeholder certificates created. HTTPS will not work until real certificates are provided." -ForegroundColor Yellow
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your actual credentials" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Access application at: http://localhost" -ForegroundColor White
