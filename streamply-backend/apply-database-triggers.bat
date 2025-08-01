@echo off
echo === StreamPly Database Triggers Setup ===
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL psql command not found in PATH
    echo Please install PostgreSQL or add psql to your PATH
    echo.
    echo Alternative: Run the SQL file manually in pgAdmin or your preferred database tool
    pause
    exit /b 1
)

echo 📖 Applying database triggers...
echo.

REM Apply the SQL file
psql -f database-triggers-video-stats.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database triggers applied successfully!
    echo.
    echo 🧪 Testing the triggers...
    echo.
    
    REM Test the functions
    psql -c "SELECT recalculate_all_video_stats() as videos_updated;"
    
    echo.
    echo 🎉 Setup complete! Your video statistics will now update automatically.
) else (
    echo.
    echo ❌ Error applying triggers. Please check your database connection.
    echo.
    echo Manual setup:
    echo 1. Open pgAdmin or your database tool
    echo 2. Run the contents of database-triggers-video-stats.sql
)

echo.
pause
