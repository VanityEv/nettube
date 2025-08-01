# OWASP Top 10 Rate Limiting Security Test Guide

## Current Rate Limiting Implementation Analysis

### Application-Level Protection (express-rate-limit)

#### Authentication Endpoints (/api/users/signin, /signup, /resetPassword)
- **Limit**: 5 requests per IP per 15 minutes
- **Response**: `429 Too Many Requests`
- **Message**: "Too many authentication attempts, please try again later."
- **Scope**: Per-IP blocking (individual user blocked, others continue)

#### Video API Endpoints (/api/videos/*)
- **Limit**: 100 requests per IP per 15 minutes
- **Streaming Limit**: 50 requests per (IP + User ID) per 5 minutes
- **Response**: `429 Too Many Requests`
- **Scope**: Per-user blocking (smart key generation)

#### Review Endpoints (/api/reviews/*)
- **Limit**: 20 requests per IP per 15 minutes
- **Response**: `429 Too Many Requests`
- **Scope**: Per-IP blocking

### nginx-Level Protection (First Line of Defense)

#### Rate Limiting Zones
- **API Zone**: 10 requests/second per IP
- **Upload Zone**: 1 request/second per IP
- **Auth Zone**: 5 requests/second per IP
- **Streaming Zone**: 30 requests/second per IP

## Security Testing Scenarios for Master Thesis

### Test 1: Individual User Blocking Verification
**OWASP Reference**: A07:2021 – Identification and Authentication Failures

```powershell
# Terminal 1: Attack simulation (should get blocked)
for ($i = 1; $i -le 10; $i++) {
    Write-Host "Attempt $i"
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/users/signin" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"attacker@test.com","password":"wrongpassword"}' `
        -ErrorAction SilentlyContinue
    if ($response) { $response | ConvertTo-Json }
    Start-Sleep 1
}

# Terminal 2: Legitimate user test (should still work)
$validToken = "your_valid_jwt_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/videos" `
    -Headers @{Authorization="Bearer $validToken"}
```

**Expected Result**: 
- Terminal 1: Gets 429 error after 5 attempts
- Terminal 2: Continues to work normally

### Test 2: DDoS Simulation
**OWASP Reference**: A09:2021 – Security Logging and Monitoring Failures

```powershell
# Simulate multiple IPs (using different source ports)
1..20 | ForEach-Object -Parallel {
    $ip = $using:_
    Write-Host "Testing from simulated IP: $ip"
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/videos" `
            -Headers @{"X-Forwarded-For"="192.168.1.$ip"}
        Write-Host "IP $ip: Success"
    } catch {
        Write-Host "IP $ip: Blocked - $($_.Exception.Message)"
    }
} -ThrottleLimit 10
```

### Test 3: Streaming Endpoint Abuse
**OWASP Reference**: A04:2021 – Insecure Design

```powershell
# Test streaming rate limits
$token = "your_valid_token"
$videoId = "test-video-uuid"

1..60 | ForEach-Object {
    $attempt = $_
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/videos/stream/$videoId" `
            -Headers @{Authorization="Bearer $token"} `
            -Method HEAD
        Write-Host "Stream attempt $attempt`: $($response.StatusCode)"
    } catch {
        Write-Host "Stream attempt $attempt`: BLOCKED - $($_.Exception.Message)"
    }
    Start-Sleep 0.1
}
```

### Test 4: nginx vs Express Rate Limiting
**OWASP Reference**: A06:2021 – Vulnerable and Outdated Components

```powershell
# Test nginx rate limiting (10 req/sec for API)
1..50 | ForEach-Object {
    $start = Get-Date
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/api/videos" -TimeoutSec 1
        $duration = (Get-Date) - $start
        Write-Host "Request $_`: Success in $($duration.TotalMilliseconds)ms"
    } catch {
        Write-Host "Request $_`: Failed - $($_.Exception.Message)"
    }
}
```

## OWASP ZAP Integration Commands

### Start ZAP Proxy for Testing
```powershell
# Start ZAP in daemon mode
& "C:\Program Files\ZAP\Zed Attack Proxy\zap.bat" -daemon -port 8090

# Configure proxy for testing
$proxy = "http://127.0.0.1:8090"
```

### Automated Security Scan
```powershell
# Spider the application through ZAP
Invoke-RestMethod -Uri "http://localhost:8090/JSON/spider/action/scan/" `
    -Method GET `
    -Body @{url="http://localhost:3001/api"}

# Run active scan
Invoke-RestMethod -Uri "http://localhost:8090/JSON/ascan/action/scan/" `
    -Method GET `
    -Body @{url="http://localhost:3001/api"}
```

## Expected Behavior Analysis

### ✅ CORRECT: Individual User Blocking
- Rate limit exceeded = specific IP/user blocked
- Other users continue normal access
- Application remains available
- Logs security events properly

### ✅ CORRECT: Graduated Defense
1. **nginx** (Layer 1): Blocks obvious abuse (10+ req/sec)
2. **Express** (Layer 2): Fine-grained limits per endpoint type
3. **Application** (Layer 3): Business logic validation

### ⚠️ POTENTIAL IMPROVEMENTS
- Add Redis for distributed rate limiting (production)
- Implement progressive penalties (increasing timeouts)
- Add CAPTCHA for repeated violations
- Geographic IP blocking for persistent attacks

## Security Event Monitoring

Your application logs rate limit violations:
```javascript
// From your mongoLogger.js integration
{
  "event_type": "rate_limit_exceeded",
  "ip": "192.168.1.100",
  "endpoint": "/api/users/signin",
  "user_id": "uuid-if-authenticated",
  "timestamp": "2024-01-15T10:30:00Z",
  "headers": {...}
}
```

## Testing Report Template

### Test Results Summary
- [ ] Individual blocking works (not application-wide)
- [ ] Multiple endpoints have appropriate limits
- [ ] nginx and Express layers coordinate properly
- [ ] Security events are logged correctly
- [ ] Legitimate users unaffected during attacks
- [ ] Rate limiting effectiveness measured

### Thesis Documentation
Use these test results to demonstrate:
1. **Layered Security Approach** (Defense in Depth)
2. **Proportional Response** (Individual vs System blocking)
3. **Monitoring Integration** (Security event logging)
4. **Real-world Attack Mitigation** (Brute force, DDoS)

This configuration provides excellent protection for your master thesis research while maintaining usability for legitimate users.
