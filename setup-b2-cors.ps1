# Setup B2 CORS Configuration
# This script helps configure CORS rules for your B2 bucket

Write-Host "🌐 B2 CORS Configuration Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Steps to configure CORS for your B2 bucket:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Go to: https://secure.backblaze.com/b2_buckets.htm" -ForegroundColor Green
Write-Host "2. Click on your bucket: streamply-bucket-prod" -ForegroundColor Green
Write-Host "3. Go to 'Bucket Settings' tab" -ForegroundColor Green
Write-Host "4. Scroll down to 'CORS Rules'" -ForegroundColor Green
Write-Host "5. Add this CORS configuration:" -ForegroundColor Green

Write-Host ""
Write-Host "📄 CORS Configuration Options:" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 For ngrok development (RECOMMENDED):" -ForegroundColor Yellow
Write-Host "Select: 'Share everything in this bucket with all HTTPS origins'" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Alternative - Specific ngrok URL:" -ForegroundColor Yellow
Write-Host "Select: 'Share everything in this bucket with this one origin'" -ForegroundColor Green
Write-Host "Enter: https://your-ngrok-url.ngrok-free.app" -ForegroundColor Green
Write-Host ""
Write-Host "📋 If using JSON configuration:" -ForegroundColor Magenta
Write-Host @"
[
  {
    "corsRuleName": "streamply-backend-api",
    "allowedOrigins": [
      "http://localhost:3001",
      "https://*.ngrok-free.app"
    ],
      "http://localhost:5000", 
      "https://your-frontend-domain.com"
    ],
    "allowedHeaders": [
      "authorization",
      "content-type",
      "x-bz-file-name",
      "x-bz-content-sha1"
    ],
    "allowedOperations": [
      "b2_download_file_by_id",
      "b2_download_file_by_name",
      "b2_upload_file"
    ],
    "maxAgeSeconds": 3600
  }
]
"@ -ForegroundColor White

Write-Host ""
Write-Host "🔧 Alternative: Use Development Mode" -ForegroundColor Yellow
Write-Host "Your .env is already set to development mode, which simulates B2 uploads." -ForegroundColor Gray
Write-Host "This is recommended for local development and testing." -ForegroundColor Gray

Write-Host ""
Write-Host "✅ After CORS setup, change NODE_ENV to 'production' in .env" -ForegroundColor Green
Write-Host ""
