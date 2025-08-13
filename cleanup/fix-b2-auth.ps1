# B2 Credentials Issue Fix
# Your B2 Application Key appears to be invalid or expired

Write-Host "🔐 B2 Authentication Issue Detected" -ForegroundColor Red
Write-Host "====================================" -ForegroundColor Red

Write-Host ""
Write-Host "❌ Error: B2 returns 401 Unauthorized" -ForegroundColor Red
Write-Host "This means your Application Key is invalid, expired, or deleted." -ForegroundColor Yellow

Write-Host ""
Write-Host "🔧 Solution Steps:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Go to: https://secure.backblaze.com/app_keys.htm" -ForegroundColor Green
Write-Host "2. Check if your Application Key '14d6eb331d1b' is still listed" -ForegroundColor Green
Write-Host "3. If NOT listed: Create a new Application Key" -ForegroundColor Green
Write-Host "4. If listed: Delete and recreate the key (it may be corrupted)" -ForegroundColor Green

Write-Host ""
Write-Host "🆕 Creating New Application Key:" -ForegroundColor Magenta
Write-Host "- Name: streamply-backend-$(Get-Date -Format 'yyyyMMdd')" -ForegroundColor Gray
Write-Host "- Type: All Capabilities" -ForegroundColor Gray
Write-Host "- Bucket Access: streamply-bucket-prod" -ForegroundColor Gray

Write-Host ""
Write-Host "📝 Update .env file with new credentials:" -ForegroundColor Yellow
Write-Host 'B2_APPLICATION_KEY_ID="your-new-key-id"' -ForegroundColor White
Write-Host 'B2_APPLICATION_KEY="your-new-application-key"' -ForegroundColor White

Write-Host ""
Write-Host "⚠️  Temporary Workaround:" -ForegroundColor Cyan
Write-Host "Your system is now in development mode with simulated B2 uploads." -ForegroundColor Gray
Write-Host "Video processing will work for testing purposes." -ForegroundColor Gray

Write-Host ""
Write-Host "🧪 Test after fixing credentials:" -ForegroundColor Green
Write-Host "1. Update .env with new B2 credentials" -ForegroundColor Green
Write-Host "2. Change NODE_ENV back to 'production'" -ForegroundColor Green
Write-Host "3. Restart your backend server" -ForegroundColor Green
Write-Host "4. Try video upload again" -ForegroundColor Green

Write-Host ""
