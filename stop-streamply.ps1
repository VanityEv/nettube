# stop-streamply.ps1
# Skrypt zatrzymania dla Streamply na Windows

Write-Host "🛑 Stopping Streamply services..." -ForegroundColor Red

# Funkcja do bezpiecznego zatrzymania procesów
function Stop-ProcessesSafely {
    param(
        [string]$ProcessName,
        [string]$DisplayName
    )
    
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "🔄 Stopping $DisplayName processes..." -ForegroundColor Yellow
            foreach ($process in $processes) {
                try {
                    $process.CloseMainWindow()
                    Start-Sleep -Seconds 2
                    if (!$process.HasExited) {
                        $process | Stop-Process -Force
                    }
                    Write-Host "✅ Stopped $DisplayName (PID: $($process.Id))" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️ Could not stop $DisplayName (PID: $($process.Id)): $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "ℹ️ No $DisplayName processes found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️ Error checking for $DisplayName processes: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Zatrzymaj ngrok
Write-Host "`n🔗 Stopping tunnel services..." -ForegroundColor Yellow
Stop-ProcessesSafely -ProcessName "ngrok" -DisplayName "Ngrok"

# Zatrzymaj LocalTunnel (lt)
try {
    $ltProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*lt *" }
    if ($ltProcesses) {
        Write-Host "🔄 Stopping LocalTunnel processes..." -ForegroundColor Yellow
        $ltProcesses | Stop-Process -Force
        Write-Host "✅ LocalTunnel processes stopped" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️ No LocalTunnel processes found" -ForegroundColor Gray
}

# Zatrzymaj cloudflared
Stop-ProcessesSafely -ProcessName "cloudflared" -DisplayName "Cloudflare Tunnel"

# Zatrzymaj backend Node.js
Write-Host "`n🔧 Stopping backend services..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*index.js*" -or 
        $_.CommandLine -like "*npm start*" -or
        $_.CommandLine -like "*streamply-backend*"
    }
    
    if ($nodeProcesses) {
        Write-Host "🔄 Stopping Node.js backend processes..." -ForegroundColor Yellow
        foreach ($process in $nodeProcesses) {
            try {
                $process | Stop-Process -Force
                Write-Host "✅ Stopped Node.js backend (PID: $($process.Id))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Could not stop Node.js process (PID: $($process.Id)): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "ℹ️ No Node.js backend processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Error checking for Node.js processes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Zatrzymaj proxy server
Write-Host "`n🌐 Stopping proxy services..." -ForegroundColor Yellow
try {
    $proxyProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*proxy-server.js*"
    }
    
    if ($proxyProcesses) {
        Write-Host "🔄 Stopping Express proxy processes..." -ForegroundColor Yellow
        $proxyProcesses | Stop-Process -Force
        Write-Host "✅ Express proxy processes stopped" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️ No Express proxy processes found" -ForegroundColor Gray
}

# Zatrzymaj nginx (jeśli używany)
try {
    if (Test-Path "C:\nginx\nginx.exe") {
        Write-Host "🔄 Stopping Nginx..." -ForegroundColor Yellow
        Start-Process -FilePath "C:\nginx\nginx.exe" -ArgumentList "-s", "stop" -Wait -NoNewWindow
        Write-Host "✅ Nginx stopped" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not stop Nginx: $($_.Exception.Message)" -ForegroundColor Yellow
}

Stop-ProcessesSafely -ProcessName "nginx" -DisplayName "Nginx"

# Sprawdź czy porty są zwolnione
Write-Host "`n🔍 Checking if ports are freed..." -ForegroundColor Yellow
$commonPorts = @(80, 3001, 4040, 8080)

foreach ($port in $commonPorts) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "⚠️ Port $port is still in use" -ForegroundColor Yellow
        try {
            $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   Could not identify process using port $port" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ Port $port is free" -ForegroundColor Green
    }
}

# Oczyszczenie - zatrzymaj wszystkie PowerShell okna związane ze Streamply
Write-Host "`n🧹 Cleaning up PowerShell windows..." -ForegroundColor Yellow
try {
    $currentPID = $PID
    $psProcesses = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { 
        $_.Id -ne $currentPID 
    }
    
    if ($psProcesses) {
        Write-Host "Found $($psProcesses.Count) other PowerShell processes" -ForegroundColor Gray
        Write-Host "⚠️ You may need to manually close Streamply terminal windows" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ℹ️ Could not check other PowerShell processes" -ForegroundColor Gray
}

# Opcjonalnie zatrzymaj bazy danych
Write-Host "`n🗄️ Database services (optional):" -ForegroundColor Cyan
Write-Host "   PostgreSQL: net stop postgresql-x64-14" -ForegroundColor Gray
Write-Host "   MongoDB: net stop MongoDB" -ForegroundColor Gray
Write-Host "   (Databases left running for faster restart)" -ForegroundColor Gray

# Podsumowanie
Write-Host "`n✅ Streamply services stopped!" -ForegroundColor Green
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│                    🛑 STREAMPLY STOPPED                     │" -ForegroundColor Cyan
Write-Host "├─────────────────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "│ ✅ Tunnel services stopped                                  │" -ForegroundColor White
Write-Host "│ ✅ Backend services stopped                                 │" -ForegroundColor White
Write-Host "│ ✅ Proxy services stopped                                   │" -ForegroundColor White
Write-Host "│ ℹ️ Databases left running                                   │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan

Write-Host "`n💡 To restart Streamply:" -ForegroundColor Cyan
Write-Host "   .\start-streamply-ngrok.ps1" -ForegroundColor White

Write-Host "`n💡 To stop databases too:" -ForegroundColor Cyan
Write-Host "   net stop postgresql-x64-14" -ForegroundColor White
Write-Host "   net stop MongoDB" -ForegroundColor White

Write-Host "`nAll done! 🎉" -ForegroundColor Green
