# 🌐 Public Security Testing Quick Start Guide

## Architecture Overview
```
Internet → ngrok proxy tunnel → nginx (localhost:8080) → ngrok backend tunnel → Backend (localhost:3001)
```

## Step-by-Step Setup

### Prerequisites
```powershell
# Install required tools
winget install nginx
winget install OpenJS.NodeJS
winget install ngrok
winget install ZAP.ZAP
```

### Step 1: Start Backend
```powershell
# Terminal 1
cd streamply-backend
npm start
```

### Step 2: Create Backend ngrok Tunnel
```powershell
# Terminal 2
ngrok http 3001 --subdomain=streamply-backend-test
```
📝 **Copy the ngrok URL** (e.g., `https://streamply-backend-test.ngrok.io`)

### Step 3: Update nginx Config
Edit `nginx/nginx-public-security-test.conf` and replace:
```nginx
server streamply-backend-test.ngrok.io:443;
```
With your actual ngrok backend subdomain.

### Step 4: Start nginx Proxy
```powershell
# Copy config and start nginx
Copy-Item "nginx\nginx-public-security-test.conf" "C:\nginx\conf\nginx.conf" -Force
cd C:\nginx
.\nginx.exe
```

### Step 5: Create Proxy ngrok Tunnel
```powershell
# Terminal 3
ngrok http 8080 --subdomain=streamply-proxy-test
```
📝 **Copy the proxy ngrok URL** (e.g., `https://streamply-proxy-test.ngrok.io`)

### Step 6: Update Frontend
Update your frontend's API base URL to: `https://streamply-proxy-test.ngrok.io/api`

### Step 7: Deploy to Vercel
```powershell
cd streamply-frontend
vercel deploy --prod
```

## Testing URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Public Proxy** | `https://streamply-proxy-test.ngrok.io` | Main testing target |
| **Direct Backend** | `https://streamply-backend-test.ngrok.io` | Compare proxy vs direct |
| **Frontend** | `https://your-app.vercel.app` | End-user interface |
| **Health Checks** | `/health`, `/proxy-status` | Service monitoring |

## Security Testing Scenarios

### 1. Rate Limiting Tests
```bash
# Test auth rate limiting (5 req/sec)
for i in {1..20}; do
  curl -X POST https://streamply-proxy-test.ngrok.io/api/users/signin \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' \
    -w "Status: %{http_code}\n"
done

# Test API rate limiting (10 req/sec)
for i in {1..50}; do
  curl https://streamply-proxy-test.ngrok.io/api/videos \
    -w "Status: %{http_code}\n"
done
```

### 2. Proxy vs Direct Comparison
```bash
# Test proxy protection
curl https://streamply-proxy-test.ngrok.io/api/admin/users

# Test direct backend (should be less protected)
curl https://streamply-backend-test.ngrok.io/api/admin/users
```

### 3. Security Headers Validation
```bash
# Check security headers
curl -I https://streamply-proxy-test.ngrok.io/
```

### 4. OWASP ZAP Scanning
1. Open OWASP ZAP
2. Set target: `https://streamply-proxy-test.ngrok.io`
3. Run automated scan
4. Generate security report

## Monitoring Commands

```powershell
# Watch nginx access logs
Get-Content "C:\nginx\logs\access.log" -Wait

# Monitor security events
mongo streamply_logs --eval "db.security_events.find().sort({timestamp:-1}).limit(10)"

# Check service health
curl https://streamply-proxy-test.ngrok.io/health
curl https://streamply-proxy-test.ngrok.io/proxy-status
```

## Advanced Testing Tools

### Nuclei Scanning
```bash
# Install nuclei
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

# Run OWASP Top 10 scans
nuclei -u https://streamply-proxy-test.ngrok.io -t owasp-top-10/
```

### Burp Suite Professional
1. Set target: `https://streamply-proxy-test.ngrok.io`
2. Configure spider and scanner
3. Run active scan with OWASP Top 10 checks

### Custom Rate Limit Testing
```powershell
# PowerShell rate limit test
1..100 | ForEach-Object -Parallel {
    $response = Invoke-WebRequest "https://streamply-proxy-test.ngrok.io/api/videos" -ErrorAction SilentlyContinue
    Write-Host "Request $using:_`: $($response.StatusCode)"
} -ThrottleLimit 50
```

## Security Analysis Areas

### ✅ Test Coverage
- [ ] **A01: Broken Access Control** - Admin endpoints, JWT validation
- [ ] **A02: Cryptographic Failures** - HTTPS, JWT secrets, password hashing  
- [ ] **A03: Injection** - SQL injection, XSS, command injection
- [ ] **A04: Insecure Design** - Business logic, rate limiting effectiveness
- [ ] **A05: Security Misconfiguration** - Headers, error handling, defaults
- [ ] **A06: Vulnerable Components** - Dependency scanning, version checks
- [ ] **A07: Authentication Failures** - Brute force, session management
- [ ] **A08: Data Integrity** - File upload, CSP, asset integrity
- [ ] **A09: Logging Failures** - Security event monitoring
- [ ] **A10: SSRF** - Internal network access, metadata endpoints

### 📊 Performance Impact Analysis
- Compare response times: proxy vs direct backend
- Monitor CPU/memory usage during attacks
- Analyze rate limiting effectiveness
- Document proxy overhead costs

## Safety Reminders ⚠️

1. **Public Access**: These URLs are publicly accessible on the internet
2. **Test Data Only**: Use only test data, never production secrets
3. **Monitor Traffic**: Watch for unexpected visitors to your tunnels
4. **Time-Limited**: Keep tunnels active only during testing
5. **ngrok Auth**: Consider using ngrok authentication for additional security

## Cleanup Commands

```powershell
# Stop nginx
cd C:\nginx
.\nginx.exe -s quit

# Kill ngrok processes
Get-Process ngrok | Stop-Process

# Clear logs
Remove-Item "C:\nginx\logs\*" -Force
```

## Master Thesis Documentation

### Key Metrics to Capture
- Rate limiting effectiveness (requests blocked vs allowed)
- Security header compliance
- Response time impact of proxy layer
- Attack detection and mitigation
- False positive rates in security controls

### Report Sections
1. **Environment Setup** - Architecture and tool configuration
2. **OWASP Top 10 Testing** - Systematic vulnerability assessment
3. **Proxy Security Analysis** - nginx layer effectiveness
4. **Performance Impact** - Security vs performance trade-offs
5. **Recommendations** - Security improvements and best practices

Your public security testing environment is now ready for comprehensive OWASP Top 10 analysis! 🚀
