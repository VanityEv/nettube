# 🔒 Local Security Testing Setup for Master Thesis
## OWASP Top 10 Testing with ZAP Scanner

This guide sets up a comprehensive local testing environment for security analysis:
- **Frontend**: Vercel (production-like)
- **Backend**: Local ngrok tunnel (real network exposure)
- **Database**: Local PostgreSQL
- **Logging**: Local MongoDB
- **Proxy**: Local nginx (security gateway)

## 🏗️ Architecture Overview

```
Internet → nginx (localhost:80) → ngrok tunnel → Backend (localhost:3001)
    ↓
Frontend (Vercel) ← API calls → nginx proxy
    ↓
Local PostgreSQL + Local MongoDB
```

## 🚀 Quick Setup Instructions

### 1. Install Required Tools

```powershell
# Install nginx for Windows
winget install nginx

# Install ngrok
winget install ngrok

# Install OWASP ZAP
winget install ZAP.ZAP

# Or download from: https://www.zaproxy.org/download/
```

### 2. Setup Local Database & MongoDB

```powershell
# Start local PostgreSQL (if not running)
net start postgresql-x64-15

# Start local MongoDB (if not running)
net start MongoDB

# Verify connections
psql -U streamply_user -d streamply_dev -h localhost -p 5432
mongo mongodb://localhost:27017/streamply_logs
```

### 3. Configure nginx for Local Testing

Update your Windows nginx configuration:

**File: `C:\nginx\conf\nginx.conf`**
```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    # Include your streamply configuration
    include       streamply-local.conf;
}
```

**File: `C:\nginx\conf\streamply-local.conf`**
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=streaming:10m rate=30r/s;

server {
    listen 80;
    server_name localhost 127.0.0.1 streamply.local;
    
    # Security headers for testing
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    
    # CSP for security testing
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.stripe.com https://*.ngrok.io wss: ws:;
        media-src 'self' https: blob:;
        frame-src 'self' https://js.stripe.com;
        object-src 'none';
    " always;
    
    server_tokens off;
    client_max_body_size 2G;
    
    # Proxy all API requests to ngrok tunnel
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        # Forward to your ngrok tunnel
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for local testing
        add_header Access-Control-Allow-Origin "https://your-vercel-app.vercel.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }
    
    # Authentication with strict rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://127.0.0.1:3001/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "Security Testing Environment Ready\n";
        add_header Content-Type text/plain;
    }
    
    # Block common attacks for testing
    location ~* \.(php|asp|aspx|jsp|cgi)$ {
        deny all;
        return 403;
    }
    
    # Logging for security analysis
    access_log C:/nginx/logs/security-test.access.log combined;
    error_log C:/nginx/logs/security-test.error.log warn;
}
```

### 4. Start Backend with ngrok

```powershell
# Terminal 1: Start your backend
cd streamply-backend
npm start

# Terminal 2: Expose backend via ngrok
ngrok http 3001

# Note the ngrok URL (e.g., https://abc123.ngrok.io)
```

### 5. Update Environment Variables

**File: `streamply-backend/.env`**
```properties
# Local testing configuration
DATABASE_URL="postgresql://streamply_user:streamply_dev_2024@localhost:5432/streamply_dev?schema=public"
MONGODB_URI="mongodb://localhost:27017/streamply_logs"
FRONTEND_URL="https://your-vercel-app.vercel.app"
CORS_ORIGIN="https://your-vercel-app.vercel.app,http://localhost"
NODE_ENV=development

# Your existing config...
JWT_SECRET="8d0897b0cdf001d20843e82cd50fe34400f554668d7a58d64179fc0a7c6f5315bcba557fe133caa5952b708a436cf4b5971717df90774fad89f4204188182acd"
```

### 6. Start nginx

```powershell
# Navigate to nginx directory
cd C:\nginx

# Start nginx
nginx.exe

# Test configuration
nginx.exe -t

# Reload configuration
nginx.exe -s reload

# Stop nginx (when needed)
nginx.exe -s stop
```

### 7. Deploy Frontend to Vercel

```powershell
cd streamply-frontend

# Update API endpoint in your frontend to use nginx proxy
# In your API configuration, use: http://localhost/api

# Deploy to Vercel
vercel deploy --prod
```

## 🛡️ OWASP Top 10 Testing with ZAP

### Setup ZAP for Testing

1. **Start OWASP ZAP**
2. **Configure Target**: `http://localhost` (your nginx proxy)
3. **Setup Context**: Include your Vercel frontend URL

### ZAP Testing Scenarios

**1. A01:2021 – Broken Access Control**
```
Target: http://localhost/api/auth/
Tests: Try accessing admin endpoints without proper authentication
```

**2. A02:2021 – Cryptographic Failures**
```
Target: All HTTPS connections
Tests: SSL/TLS configuration, JWT token security
```

**3. A03:2021 – Injection**
```
Target: http://localhost/api/videos/upload
Tests: SQL injection, NoSQL injection via MongoDB logs
```

**4. A04:2021 – Insecure Design**
```
Target: Overall application flow
Tests: Business logic flaws, rate limiting bypass
```

**5. A05:2021 – Security Misconfiguration**
```
Target: nginx headers, error pages
Tests: Security headers, server information disclosure
```

**6. A06:2021 – Vulnerable Components**
```
Target: All endpoints
Tests: Outdated libraries, known CVEs
```

**7. A07:2021 – Authentication Failures**
```
Target: http://localhost/api/auth/
Tests: Brute force, session management
```

**8. A08:2021 – Software Integrity Failures**
```
Target: Frontend assets, CDN content
Tests: CSP violations, untrusted sources
```

**9. A09:2021 – Logging Failures**
```
Target: Security events in MongoDB
Tests: Log injection, sensitive data in logs
```

**10. A10:2021 – Server-Side Request Forgery**
```
Target: Video upload, external API calls
Tests: SSRF via file upload, webhook manipulation
```

### Automated ZAP Scan

```bash
# Full active scan
zap-full-scan.py -t http://localhost -r zap_report.html

# Specific API scan
zap-api-scan.py -t http://localhost/api -f openapi -r api_report.html

# Baseline scan
zap-baseline.py -t http://localhost -r baseline_report.html
```

## 📊 Monitoring & Logging

### nginx Logs
```powershell
# Real-time access log monitoring
Get-Content C:\nginx\logs\security-test.access.log -Wait

# Error log analysis
Get-Content C:\nginx\logs\security-test.error.log -Wait
```

### MongoDB Security Logs
```javascript
// Connect to local MongoDB
use streamply_logs

// Query security events
db.security_events.find().sort({timestamp: -1}).limit(10)

// Query authentication attempts
db.auth_logs.find({event: "login_attempt"}).sort({timestamp: -1})
```

### PostgreSQL Audit
```sql
-- Check user access patterns
SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 10;

-- Monitor video access
SELECT * FROM video_views ORDER BY created_at DESC LIMIT 10;
```

## 🎯 Testing Checklist for Master Thesis

### Security Testing Areas

- [ ] **Authentication & Authorization**
  - [ ] JWT token validation
  - [ ] Role-based access control
  - [ ] Session management
  - [ ] Password policies

- [ ] **Input Validation**
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] File upload security
  - [ ] API parameter validation

- [ ] **Rate Limiting & DDoS Protection**
  - [ ] nginx rate limiting effectiveness
  - [ ] API endpoint protection
  - [ ] Upload rate limiting
  - [ ] Streaming bandwidth limits

- [ ] **Security Headers**
  - [ ] CSP implementation
  - [ ] HSTS configuration
  - [ ] X-Frame-Options
  - [ ] Security header completeness

- [ ] **Video Security**
  - [ ] Anti-piracy measures
  - [ ] HLS token validation
  - [ ] Video access controls
  - [ ] Download prevention

- [ ] **Logging & Monitoring**
  - [ ] Security event logging
  - [ ] Failed authentication tracking
  - [ ] Suspicious activity detection
  - [ ] Log integrity

### Performance Under Attack

- [ ] Response times during DDoS simulation
- [ ] Resource consumption monitoring
- [ ] Rate limiting behavior
- [ ] Recovery time after attacks

## 📝 Documentation for Thesis

### Generate Security Reports

```powershell
# ZAP HTML reports
# API security report
# nginx log analysis
# Performance metrics
# Vulnerability assessment
```

### Key Metrics to Measure

1. **Response Time Impact**: Normal vs. under attack
2. **Rate Limiting Effectiveness**: Requests blocked vs. allowed
3. **Security Header Coverage**: Headers present vs. missing
4. **Vulnerability Count**: By OWASP category
5. **False Positive Rate**: ZAP findings vs. actual vulnerabilities

## 🚀 Quick Start Commands

```powershell
# 1. Start all services
cd C:\nginx && nginx.exe
cd streamply-backend && npm start
ngrok http 3001

# 2. Update frontend API URL to http://localhost/api
# 3. Deploy frontend to Vercel
cd streamply-frontend && vercel deploy --prod

# 4. Start ZAP and begin testing
# 5. Monitor logs and collect metrics
```

This setup gives you a realistic testing environment with real network exposure while keeping sensitive data local. Perfect for comprehensive security analysis in your master thesis!
