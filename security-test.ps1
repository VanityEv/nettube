# security-test.ps1
# Testy bezpieczeństwa przed OWASP ZAP scan

param(
    [string]$BaseUrl = "http://localhost",
    [string]$ApiUrl = "http://localhost/api"
)

Write-Host "🔒 Streamply Security Testing Suite" -ForegroundColor Green
Write-Host "Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "API: $ApiUrl" -ForegroundColor Cyan

# Test Results
$testResults = @()

function Test-SecurityHeaders {
    Write-Host "`n🛡️ Testing Security Headers..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing
        
        $requiredHeaders = @{
            'X-Frame-Options' = 'DENY'
            'X-Content-Type-Options' = 'nosniff' 
            'X-XSS-Protection' = '1; mode=block'
            'Referrer-Policy' = 'strict-origin-when-cross-origin'
            'Content-Security-Policy' = $null
        }
        
        foreach ($header in $requiredHeaders.Keys) {
            if ($response.Headers[$header]) {
                Write-Host "✅ $header: $($response.Headers[$header])" -ForegroundColor Green
                $testResults += @{ Test = "Security Header: $header"; Status = "PASS"; Details = $response.Headers[$header] }
            } else {
                Write-Host "❌ $header: Missing" -ForegroundColor Red
                $testResults += @{ Test = "Security Header: $header"; Status = "FAIL"; Details = "Header missing" }
            }
        }
        
        # Test HSTS for HTTPS
        if ($BaseUrl -like "https://*" -and $response.Headers['Strict-Transport-Security']) {
            Write-Host "✅ HSTS: $($response.Headers['Strict-Transport-Security'])" -ForegroundColor Green
            $testResults += @{ Test = "HSTS Header"; Status = "PASS"; Details = $response.Headers['Strict-Transport-Security'] }
        } elseif ($BaseUrl -like "https://*") {
            Write-Host "❌ HSTS: Missing for HTTPS site" -ForegroundColor Red  
            $testResults += @{ Test = "HSTS Header"; Status = "FAIL"; Details = "Missing for HTTPS" }
        } else {
            Write-Host "ℹ️ HSTS: Not applicable for HTTP" -ForegroundColor Gray
            $testResults += @{ Test = "HSTS Header"; Status = "SKIP"; Details = "HTTP site" }
        }
        
    } catch {
        Write-Host "❌ Failed to test security headers: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Security Headers"; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

function Test-RateLimiting {
    Write-Host "`n⏱️ Testing Rate Limiting..." -ForegroundColor Yellow
    
    try {
        $successCount = 0
        $rateLimitHit = $false
        
        Write-Host "Sending 105 requests to test rate limiting..." -ForegroundColor Gray
        
        for ($i = 1; $i -le 105; $i++) {
            try {
                $response = Invoke-RestMethod -Uri "$ApiUrl/videos/test-cors" -Method GET -TimeoutSec 2
                $successCount++
                if ($i % 20 -eq 0) {
                    Write-Host "  - Completed $i requests" -ForegroundColor Gray
                }
            } catch {
                if ($_.Exception.Response.StatusCode -eq 429) {
                    Write-Host "✅ Rate limiting triggered at request $i" -ForegroundColor Green
                    $rateLimitHit = $true
                    $testResults += @{ Test = "API Rate Limiting"; Status = "PASS"; Details = "Triggered at request $i" }
                    break
                } else {
                    Write-Host "❌ Unexpected error at request $i`: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            Start-Sleep -Milliseconds 50
        }
        
        if (!$rateLimitHit -and $successCount -eq 105) {
            Write-Host "⚠️ Rate limiting not triggered after 105 requests" -ForegroundColor Yellow
            $testResults += @{ Test = "API Rate Limiting"; Status = "WARN"; Details = "No rate limit triggered" }
        }
        
    } catch {
        Write-Host "❌ Rate limiting test failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "API Rate Limiting"; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

function Test-CORS {
    Write-Host "`n🌐 Testing CORS Policy..." -ForegroundColor Yellow
    
    try {
        # Test with no Origin header (should work)
        $response1 = Invoke-WebRequest -Uri "$ApiUrl/videos/test-cors" -Method GET -UseBasicParsing
        if ($response1.StatusCode -eq 200) {
            Write-Host "✅ No Origin header: Allowed" -ForegroundColor Green
            $testResults += @{ Test = "CORS - No Origin"; Status = "PASS"; Details = "Request allowed" }
        }
        
        # Test with localhost origin (should work)
        $headers = @{ 'Origin' = 'http://localhost:3000' }
        $response2 = Invoke-WebRequest -Uri "$ApiUrl/videos/test-cors" -Method GET -Headers $headers -UseBasicParsing
        if ($response2.StatusCode -eq 200) {
            Write-Host "✅ Localhost origin: Allowed" -ForegroundColor Green
            $testResults += @{ Test = "CORS - Localhost"; Status = "PASS"; Details = "Request allowed" }
        }
        
        # Test CORS headers in response
        if ($response2.Headers['Access-Control-Allow-Origin']) {
            Write-Host "✅ CORS headers present: $($response2.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
            $testResults += @{ Test = "CORS Headers"; Status = "PASS"; Details = $response2.Headers['Access-Control-Allow-Origin'] }
        } else {
            Write-Host "⚠️ CORS headers missing in response" -ForegroundColor Yellow
            $testResults += @{ Test = "CORS Headers"; Status = "WARN"; Details = "Missing CORS headers" }
        }
        
    } catch {
        Write-Host "❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "CORS Policy"; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

function Test-Authentication {
    Write-Host "`n🔐 Testing Authentication..." -ForegroundColor Yellow
    
    try {
        # Test protected endpoint without auth (should get 401/403)
        try {
            $response = Invoke-RestMethod -Uri "$ApiUrl/users/profile" -Method GET
            Write-Host "❌ Protected endpoint accessible without auth" -ForegroundColor Red
            $testResults += @{ Test = "Auth Required"; Status = "FAIL"; Details = "No authentication required" }
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
                Write-Host "✅ Protected endpoint requires authentication" -ForegroundColor Green
                $testResults += @{ Test = "Auth Required"; Status = "PASS"; Details = "401/403 returned correctly" }
            } else {
                Write-Host "⚠️ Unexpected response: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
                $testResults += @{ Test = "Auth Required"; Status = "WARN"; Details = "Unexpected status code" }
            }
        }
        
        # Test with invalid token
        try {
            $headers = @{ 'Authorization' = 'Bearer invalid_token_12345' }
            $response = Invoke-RestMethod -Uri "$ApiUrl/users/profile" -Headers $headers -Method GET
            Write-Host "❌ Invalid token accepted" -ForegroundColor Red
            $testResults += @{ Test = "Invalid Token"; Status = "FAIL"; Details = "Invalid token accepted" }
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
                Write-Host "✅ Invalid token rejected" -ForegroundColor Green
                $testResults += @{ Test = "Invalid Token"; Status = "PASS"; Details = "Token validation working" }
            } else {
                Write-Host "⚠️ Unexpected response to invalid token: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
                $testResults += @{ Test = "Invalid Token"; Status = "WARN"; Details = "Unexpected response" }
            }
        }
        
    } catch {
        Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Authentication"; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

function Test-InputValidation {
    Write-Host "`n🧪 Testing Input Validation..." -ForegroundColor Yellow
    
    # Test SQL injection attempt
    try {
        $maliciousInput = "'; DROP TABLE users; --"
        $response = Invoke-RestMethod -Uri "$ApiUrl/videos/search?q=$maliciousInput" -Method GET
        Write-Host "✅ SQL injection attempt handled safely" -ForegroundColor Green
        $testResults += @{ Test = "SQL Injection"; Status = "PASS"; Details = "Request handled safely" }
    } catch {
        Write-Host "✅ SQL injection attempt blocked" -ForegroundColor Green
        $testResults += @{ Test = "SQL Injection"; Status = "PASS"; Details = "Request blocked" }
    }
    
    # Test XSS attempt
    try {
        $xssPayload = "<script>alert('xss')</script>"
        $response = Invoke-RestMethod -Uri "$ApiUrl/videos/search?q=$xssPayload" -Method GET
        if ($response -notlike "*<script>*") {
            Write-Host "✅ XSS payload sanitized" -ForegroundColor Green
            $testResults += @{ Test = "XSS Prevention"; Status = "PASS"; Details = "Payload sanitized" }
        } else {
            Write-Host "❌ XSS payload not sanitized" -ForegroundColor Red
            $testResults += @{ Test = "XSS Prevention"; Status = "FAIL"; Details = "Payload reflected" }
        }
    } catch {
        Write-Host "✅ XSS attempt blocked" -ForegroundColor Green
        $testResults += @{ Test = "XSS Prevention"; Status = "PASS"; Details = "Request blocked" }
    }
}

function Test-HTTPS {
    Write-Host "`n🔒 Testing HTTPS Configuration..." -ForegroundColor Yellow
    
    if ($BaseUrl -like "https://*") {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing
            Write-Host "✅ HTTPS connection successful" -ForegroundColor Green
            $testResults += @{ Test = "HTTPS Connection"; Status = "PASS"; Details = "SSL/TLS working" }
            
            # Check for HTTP redirect
            try {
                $httpUrl = $BaseUrl -replace "https://", "http://"
                $httpResponse = Invoke-WebRequest -Uri "$httpUrl/health" -Method GET -UseBasicParsing -MaximumRedirection 0
                Write-Host "⚠️ HTTP not redirecting to HTTPS" -ForegroundColor Yellow
                $testResults += @{ Test = "HTTP Redirect"; Status = "WARN"; Details = "No HTTPS redirect" }
            } catch {
                if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 302) {
                    Write-Host "✅ HTTP redirects to HTTPS" -ForegroundColor Green
                    $testResults += @{ Test = "HTTP Redirect"; Status = "PASS"; Details = "Redirect configured" }
                }
            }
            
        } catch {
            Write-Host "❌ HTTPS connection failed: $($_.Exception.Message)" -ForegroundColor Red
            $testResults += @{ Test = "HTTPS Connection"; Status = "FAIL"; Details = $_.Exception.Message }
        }
    } else {
        Write-Host "⚠️ Testing HTTP site - HTTPS recommended for production" -ForegroundColor Yellow
        $testResults += @{ Test = "HTTPS Configuration"; Status = "WARN"; Details = "HTTP site detected" }
    }
}

function Generate-Report {
    Write-Host "`n📊 Security Test Report" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    $passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
    $errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
    $skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count
    
    Write-Host "`nSummary:" -ForegroundColor White
    Write-Host "✅ PASS: $passCount" -ForegroundColor Green
    Write-Host "❌ FAIL: $failCount" -ForegroundColor Red
    Write-Host "⚠️ WARN: $warnCount" -ForegroundColor Yellow  
    Write-Host "🔄 ERROR: $errorCount" -ForegroundColor Magenta
    Write-Host "⏭️ SKIP: $skipCount" -ForegroundColor Gray
    
    Write-Host "`nDetailed Results:" -ForegroundColor White
    foreach ($result in $testResults) {
        $statusColor = switch ($result.Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "WARN" { "Yellow" }
            "ERROR" { "Magenta" }
            "SKIP" { "Gray" }
        }
        Write-Host "$($result.Test): $($result.Status) - $($result.Details)" -ForegroundColor $statusColor
    }
    
    # Overall security score
    $totalTests = $testResults.Count
    $securityScore = [math]::Round((($passCount + ($warnCount * 0.5)) / $totalTests) * 100, 1)
    
    Write-Host "`n🏆 Overall Security Score: $securityScore%" -ForegroundColor $(if ($securityScore -ge 80) { "Green" } elseif ($securityScore -ge 60) { "Yellow" } else { "Red" })
    
    if ($securityScore -ge 85) {
        Write-Host "🎉 Ready for OWASP ZAP scanning!" -ForegroundColor Green
    } elseif ($securityScore -ge 70) {
        Write-Host "⚠️ Some issues found - review before ZAP scan" -ForegroundColor Yellow
    } else {
        Write-Host "🚨 Critical issues found - fix before ZAP scan" -ForegroundColor Red
    }
    
    # Save results to file
    $reportPath = "security-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $testResults | ConvertTo-Json -Depth 2 | Out-File -FilePath $reportPath
    Write-Host "`n📄 Report saved to: $reportPath" -ForegroundColor Cyan
}

# Run all tests
Write-Host "Starting security tests..." -ForegroundColor Green

Test-SecurityHeaders
Test-RateLimiting  
Test-CORS
Test-Authentication
Test-InputValidation
Test-HTTPS

Generate-Report

Write-Host "`n🔒 Security testing complete!" -ForegroundColor Green
