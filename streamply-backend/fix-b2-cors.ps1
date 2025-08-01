# B2 CORS Configuration - Backend Only Access
# This configuration ensures only your backend can access B2 directly,
# forcing all frontend requests to go through your proxy

Write-Host "🔒 B2 CORS - Backend Only Configuration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 IMPORTANT: Configure B2 CORS to ONLY allow backend access" -ForegroundColor Red
Write-Host ""

Write-Host "1. Go to: https://secure.backblaze.com/b2_buckets.htm" -ForegroundColor Green
Write-Host "2. Click on your bucket: streamply-bucket-prod" -ForegroundColor Green
Write-Host "3. Go to 'Bucket Settings' tab" -ForegroundColor Green
Write-Host "4. Scroll down to 'CORS Rules'" -ForegroundColor Green
Write-Host "5. Replace existing CORS with this configuration:" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 JSON CORS Configuration (Backend Only - ngrok):" -ForegroundColor Yellow
Write-Host @"
[
  {
    "corsRuleName": "backend-only-access-ngrok",
    "allowedOrigins": [
      "https://5f272ab3efb4.ngrok-free.app",
      "http://localhost:3001"
    ],
    "allowedHeaders": [
      "authorization",
      "content-type",
      "x-bz-file-name",
      "x-bz-content-sha1",
      "range",
      "user-agent"
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
Write-Host "🚫 DO NOT include frontend URLs in CORS:" -ForegroundColor Red
Write-Host "   - Do NOT add http://localhost:3000" -ForegroundColor Red
Write-Host "   - Do NOT add your Vercel frontend domain" -ForegroundColor Red
Write-Host "   - Do NOT use 'Share with all origins'" -ForegroundColor Red

Write-Host ""
Write-Host "✅ This forces all HLS requests to go through your backend proxy" -ForegroundColor Green
Write-Host "✅ Your authentication and URL rewriting will work correctly" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 After updating CORS, test with:" -ForegroundColor Cyan
Write-Host "   node test-hls-endpoint.mjs" -ForegroundColor Gray
