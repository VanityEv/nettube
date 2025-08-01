# start-streamply.ps1 - Quick deployment script
# Simple launcher for Streamply with localtunnel

Write-Host "🚀 Quick Streamply Deployment" -ForegroundColor Green
Write-Host "   Using LocalTunnel (reliable & free!) 🎉" -ForegroundColor Cyan

# Run the full deployment script with localtunnel
.\start-streamply-localtunnel.ps1 -TunnelType localtunnel
