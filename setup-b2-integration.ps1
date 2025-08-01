#!/usr/bin/env powershell
# =============================================================================
# STREAMPLY B2 CLOUD STORAGE SETUP SCRIPT
# =============================================================================
# This script helps you complete the Backblaze B2 cloud storage integration
# for your Streamply video platform.

Write-Host "🚀 Streamply B2 Cloud Storage Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if user has B2 credentials
Write-Host "📋 B2 Setup Checklist:" -ForegroundColor Yellow
Write-Host "1. ✅ B2 bucket created (you mentioned you have this)"
Write-Host "2. ⏳ B2 application credentials needed"
Write-Host "3. ⏳ Environment variables configuration"
Write-Host "4. ⏳ Database schema migration"
Write-Host "5. ⏳ Test upload functionality"
Write-Host ""

Write-Host "📝 To complete the B2 integration, you need:" -ForegroundColor Cyan
Write-Host "1. Go to your Backblaze B2 account → Application Keys"
Write-Host "2. Create a new Application Key (or use existing)"
Write-Host "3. Copy the following information:"
Write-Host "   - Application Key ID"
Write-Host "   - Application Key"
Write-Host "   - Bucket Name"
Write-Host "   - Bucket ID"
Write-Host ""

Write-Host "🔧 Current B2 Configuration Status:" -ForegroundColor Magenta

# Check environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "B2_APPLICATION_KEY_ID=`"your_actual_application_key_id_here`"") {
        Write-Host "❌ B2_APPLICATION_KEY_ID needs to be set" -ForegroundColor Red
    }
    else {
        Write-Host "✅ B2_APPLICATION_KEY_ID is configured" -ForegroundColor Green
    }
    
    if ($envContent -match "B2_APPLICATION_KEY=`"your_actual_application_key_here`"") {
        Write-Host "❌ B2_APPLICATION_KEY needs to be set" -ForegroundColor Red
    }
    else {
        Write-Host "✅ B2_APPLICATION_KEY is configured" -ForegroundColor Green
    }
    
    if ($envContent -match "B2_BUCKET_NAME=`"your_actual_bucket_name_here`"") {
        Write-Host "❌ B2_BUCKET_NAME needs to be set" -ForegroundColor Red
    }
    else {
        Write-Host "✅ B2_BUCKET_NAME is configured" -ForegroundColor Green
    }
    
    if ($envContent -match "B2_BUCKET_ID=`"your_actual_bucket_id_here`"") {
        Write-Host "❌ B2_BUCKET_ID needs to be set" -ForegroundColor Red
    }
    else {
        Write-Host "✅ B2_BUCKET_ID is configured" -ForegroundColor Green
    }
}
else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔨 What I've already completed for you:" -ForegroundColor Green
Write-Host "✅ Fixed VideoRouter.js buffer/file path mismatch"
Write-Host "✅ Added avatar_url, video_url, thumbnail_url fields to Prisma schema"
Write-Host "✅ Updated UserRouter.js to use B2 cloud storage for avatars"
Write-Host "✅ Created database migration script (002_add_b2_url_fields.sql)"
Write-Host "✅ B2 helpers are ready with development mode support"
Write-Host ""

Write-Host "⚡ Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with actual B2 credentials:"
Write-Host "   B2_APPLICATION_KEY_ID='your_key_id'"
Write-Host "   B2_APPLICATION_KEY='your_application_key'"
Write-Host "   B2_BUCKET_NAME='your_bucket_name'"
Write-Host "   B2_BUCKET_ID='your_bucket_id'"
Write-Host ""
Write-Host "2. Run database migration:"
Write-Host "   psql -d streamply_dev -f prisma/migrations/002_add_b2_url_fields.sql"
Write-Host "   (or use your preferred PostgreSQL client)"
Write-Host ""
Write-Host "3. Test the integration:"
Write-Host "   npm start"
Write-Host "   # Upload a video/avatar through your admin panel"
Write-Host ""

Write-Host "💡 Development Mode:" -ForegroundColor Cyan
Write-Host "The system is configured to work in development mode even without"
Write-Host "real B2 credentials. It will simulate uploads and return demo URLs."
Write-Host "This lets you test the flow before setting up production credentials."
Write-Host ""

Write-Host "🔗 Useful Links:" -ForegroundColor Blue
Write-Host "- B2 Console: https://secure.backblaze.com/b2_buckets.htm"
Write-Host "- B2 App Keys: https://secure.backblaze.com/app_keys.htm"
Write-Host "- B2 Documentation: https://www.backblaze.com/b2/docs/"
Write-Host ""

Write-Host "✨ B2 Integration is ready! Just add your credentials and test." -ForegroundColor Green
