#!/usr/bin/env pwsh

Write-Host "🚀 StreamPly SendGrid Migration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "services/mail/Mail.js")) {
    Write-Host "❌ Error: Please run this script from the streamply-backend directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Migration Steps:" -ForegroundColor Green
Write-Host "1. Backup current Mail.js" -ForegroundColor White
Write-Host "2. Replace with SendGrid version" -ForegroundColor White
Write-Host "3. Update environment variables" -ForegroundColor White
Write-Host "4. Test email functionality" -ForegroundColor White
Write-Host ""

# Step 1: Backup current Mail.js
Write-Host "📦 Step 1: Backing up current Mail.js..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "services/mail/Mail.js" "services/mail/Mail.js.backup_$timestamp"
Write-Host "✅ Backup created: Mail.js.backup_$timestamp" -ForegroundColor Green

# Step 2: Replace with SendGrid version
Write-Host "🔄 Step 2: Installing SendGrid version..." -ForegroundColor Yellow
Copy-Item "services/mail/MailSendGrid.js" "services/mail/Mail.js" -Force
Write-Host "✅ Mail.js replaced with SendGrid version" -ForegroundColor Green

# Step 3: Environment variables
Write-Host "⚙️  Step 3: Environment Variables Setup" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 You need to add these to your .env file:" -ForegroundColor Cyan
Write-Host ""
Write-Host "SENDGRID_API_KEY=SG.your-api-key-here" -ForegroundColor White
Write-Host "SENDGRID_FROM_EMAIL=noreply@yourdomain.com" -ForegroundColor White
Write-Host "SENDGRID_FROM_NAME=StreamPly" -ForegroundColor White
Write-Host ""
Write-Host "📝 Remove these old Gmail variables:" -ForegroundColor Red
Write-Host "# MAIL_USERNAME=your-gmail@gmail.com" -ForegroundColor Gray
Write-Host "# MAIL_PASSWORD=your-app-password" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to open .env file
$openEnv = Read-Host "Would you like to open your .env file now? (y/n)"
if ($openEnv -eq "y" -or $openEnv -eq "Y") {
    if (Test-Path ".env") {
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code .env
            Write-Host "✅ .env file opened in VS Code" -ForegroundColor Green
        }
        elseif (Get-Command notepad -ErrorAction SilentlyContinue) {
            notepad .env
            Write-Host "✅ .env file opened in Notepad" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  Please manually edit your .env file" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "❌ .env file not found. Please create one." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Sign up for SendGrid (free): https://sendgrid.com/free/" -ForegroundColor White
Write-Host "2. Get your API key from SendGrid dashboard" -ForegroundColor White
Write-Host "3. Update your .env file with SendGrid credentials" -ForegroundColor White
Write-Host "4. Restart your application" -ForegroundColor White
Write-Host "5. Test email sending" -ForegroundColor White
Write-Host ""

Write-Host "📧 Testing:" -ForegroundColor Cyan
Write-Host "After setup, test with:" -ForegroundColor White
Write-Host 'node -e "import(\"./services/mail/Mail.js\").then(mail => mail.sendTestEmail(\"your-email@domain.com\"));"' -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Migration completed!" -ForegroundColor Green
Write-Host "📖 Check SENDGRID_MIGRATION_GUIDE.md for detailed setup instructions" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
