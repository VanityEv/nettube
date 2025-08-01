#!/usr/bin/env pwsh

Write-Host "=== StreamPly Database Triggers Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlExists) {
    Write-Host "❌ PostgreSQL psql command not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add psql to your PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run the SQL file manually in pgAdmin or your preferred database tool" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "📖 Applying database triggers..." -ForegroundColor Green
Write-Host ""

# Get database URL from environment or prompt
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "⚠️  DATABASE_URL not found in environment" -ForegroundColor Yellow
    $dbUrl = Read-Host "Please enter your database URL (or press Enter to use default connection)"
}

try {
    # Apply the SQL file
    if ($dbUrl) {
        & psql $dbUrl -f "database-triggers-video-stats.sql"
    }
    else {
        & psql -f "database-triggers-video-stats.sql"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database triggers applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🧪 Testing the triggers..." -ForegroundColor Cyan
        Write-Host ""
        
        # Test the functions
        if ($dbUrl) {
            & psql $dbUrl -c "SELECT recalculate_all_video_stats() as videos_updated;"
        }
        else {
            & psql -c "SELECT recalculate_all_video_stats() as videos_updated;"
        }
        
        Write-Host ""
        Write-Host "🎉 Setup complete! Your video statistics will now update automatically." -ForegroundColor Green
    }
    else {
        throw "psql command failed"
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error applying triggers: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin or your database tool" -ForegroundColor Yellow
    Write-Host "2. Run the contents of database-triggers-video-stats.sql" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to continue"
