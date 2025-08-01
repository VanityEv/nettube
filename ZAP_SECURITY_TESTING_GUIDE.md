# 🛡️ OWASP ZAP Testing Configuration for StreamPly Security Analysis
# Master Thesis Security Testing Guide

## ZAP Testing Context Configuration

### Target Setup
```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configuration>
    <context>
        <name>StreamPly Security Test</name>
        <desc>Comprehensive OWASP Top 10 testing for master thesis</desc>
        <includedUrls>
            <url>http://localhost.*</url>
            <url>https://.*\.vercel\.app.*</url>
            <url>https://.*\.ngrok\.io.*</url>
        </includedUrls>
        <excludedUrls>
            <url>http://localhost/health</url>
        </excludedUrls>
    </context>
</configuration>
```

## OWASP Top 10 2021 Testing Scenarios

### A01:2021 – Broken Access Control
**Objective**: Test authorization bypass, privilege escalation, CORS misconfigurations

**Test Cases**:
```
1. Authentication Bypass
   - Target: http://localhost/api/auth/login
   - Method: Manipulate JWT tokens, session cookies
   - Tools: ZAP JWT fuzzer, Burp Suite

2. Privilege Escalation
   - Target: http://localhost/api/users/admin
   - Method: Change user role parameters
   - Expected: 403 Forbidden for non-admin users

3. Direct Object References
   - Target: http://localhost/api/videos/{id}
   - Method: Access other users' videos
   - Expected: Only accessible to video owner

4. CORS Misconfiguration
   - Target: All API endpoints
   - Method: Cross-origin requests from unauthorized domains
   - Expected: Proper CORS policy enforcement
```

**ZAP Configuration**:
```
Scanner: Access Control Testing
Strength: High
Threshold: Low
Policy: All Access Control tests enabled
```

### A02:2021 – Cryptographic Failures
**Objective**: Test weak encryption, insecure key management, improper certificate validation

**Test Cases**:
```
1. JWT Token Security
   - Target: Authentication tokens
   - Method: Token manipulation, weak secrets
   - Tools: JWT.io, hashcat for brute force

2. Password Storage
   - Target: Database password hashes
   - Method: Check bcrypt implementation
   - Expected: Strong hashing with salt

3. HTTPS Implementation
   - Target: All encrypted connections
   - Method: SSL/TLS configuration testing
   - Tools: ZAP SSL scanner, testssl.sh

4. Sensitive Data Exposure
   - Target: API responses, error messages
   - Method: Look for exposed credentials/keys
   - Expected: No sensitive data in responses
```

**ZAP Configuration**:
```
Scanner: SSL/TLS Scanner
Tests: Weak cipher suites, certificate validation
Custom: JWT token fuzzing scripts
```

### A03:2021 – Injection
**Objective**: Test SQL injection, NoSQL injection, command injection

**Test Cases**:
```
1. SQL Injection
   - Target: http://localhost/api/videos/search?q=
   - Payloads: ' OR 1=1--, '; DROP TABLE--
   - Expected: Parameterized queries prevent injection

2. NoSQL Injection (MongoDB)
   - Target: Logging endpoints
   - Payloads: {$ne: null}, {$gt: ""}
   - Expected: Proper input sanitization

3. Command Injection
   - Target: File upload endpoints
   - Payloads: ; ls -la, && whoami
   - Expected: No command execution

4. LDAP/XPath Injection
   - Target: Search functionality
   - Payloads: *)(&, ' or '1'='1
   - Expected: Escaped special characters
```

**ZAP Configuration**:
```
Scanner: SQL Injection Scanner
Level: Maximum
Payloads: Extended SQL injection wordlist
Custom: NoSQL injection payloads
```

### A04:2021 – Insecure Design
**Objective**: Test business logic flaws, workflow bypasses

**Test Cases**:
```
1. Business Logic Bypass
   - Target: Subscription validation
   - Method: Access premium content without subscription
   - Expected: Proper authorization checks

2. Workflow Manipulation
   - Target: Video upload process
   - Method: Skip validation steps
   - Expected: Complete workflow validation

3. Rate Limiting Bypass
   - Target: Authentication endpoints
   - Method: Distributed requests, IP rotation
   - Expected: Effective rate limiting

4. Payment Logic
   - Target: Stripe integration
   - Method: Manipulate payment amounts
   - Expected: Server-side validation
```

**Manual Testing Required**:
```
Business logic testing requires manual analysis
Document workflow vulnerabilities
Test edge cases and race conditions
```

### A05:2021 – Security Misconfiguration
**Objective**: Test default configurations, unnecessary features, security headers

**Test Cases**:
```
1. Security Headers
   - Target: All HTTP responses
   - Check: CSP, HSTS, X-Frame-Options, etc.
   - Expected: Comprehensive security headers

2. Error Handling
   - Target: Invalid endpoints, malformed requests
   - Method: Trigger 500/404 errors
   - Expected: Generic error messages

3. Default Credentials
   - Target: Admin interfaces, databases
   - Method: Test common default passwords
   - Expected: No default credentials

4. Directory Traversal
   - Target: File serving endpoints
   - Payloads: ../../../etc/passwd, ..\\..\\windows\\system32
   - Expected: Path traversal prevention
```

**ZAP Configuration**:
```
Scanner: Directory Traversal
Tests: All misconfiguration tests
Policy: Strict security header validation
```

### A06:2021 – Vulnerable and Outdated Components
**Objective**: Test for known vulnerabilities in dependencies

**Test Cases**:
```
1. Dependency Scanning
   - Target: package.json, node_modules
   - Tools: npm audit, Snyk, OWASP Dependency Check
   - Expected: No high-severity vulnerabilities

2. Framework Vulnerabilities
   - Target: Express.js, React versions
   - Method: Version fingerprinting
   - Expected: Latest stable versions

3. Third-party Libraries
   - Target: Frontend dependencies (CDN)
   - Method: Check for known CVEs
   - Expected: Secure, updated libraries

4. Container Security (if using Docker)
   - Target: Base images, packages
   - Tools: Docker security scanning
   - Expected: Minimal attack surface
```

**Tools Required**:
```
npm audit
OWASP Dependency Check
Snyk CLI
Retire.js
```

### A07:2021 – Identification and Authentication Failures
**Objective**: Test weak authentication, session management issues

**Test Cases**:
```
1. Brute Force Protection
   - Target: http://localhost/api/auth/login
   - Method: Automated login attempts
   - Expected: Account lockout, CAPTCHA

2. Session Management
   - Target: JWT token handling
   - Method: Session fixation, hijacking
   - Expected: Secure session implementation

3. Password Policies
   - Target: Registration/password change
   - Method: Weak password submission
   - Expected: Strong password requirements

4. Multi-factor Authentication
   - Target: Login process
   - Method: Bypass attempts
   - Expected: MFA enforcement (if implemented)
```

**ZAP Configuration**:
```
Scanner: Authentication Testing
Tests: Session management, weak authentication
Fuzzer: Login form fuzzing
```

### A08:2021 – Software and Data Integrity Failures
**Objective**: Test CI/CD security, untrusted sources, insufficient integrity verification

**Test Cases**:
```
1. Content Security Policy
   - Target: Frontend application
   - Method: Inject malicious scripts
   - Expected: CSP blocks execution

2. Subresource Integrity
   - Target: CDN-loaded assets
   - Method: Check SRI hashes
   - Expected: Integrity verification

3. File Upload Validation
   - Target: Video upload endpoints
   - Method: Upload malicious files
   - Expected: File type/content validation

4. Auto-update Mechanisms
   - Target: Any auto-update features
   - Method: Man-in-the-middle attacks
   - Expected: Signed, verified updates
```

**Manual Testing**:
```
Review build process security
Check CDN integrity
Validate file upload mechanisms
```

### A09:2021 – Security Logging and Monitoring Failures
**Objective**: Test logging completeness, monitoring effectiveness

**Test Cases**:
```
1. Security Event Logging
   - Target: Failed login attempts
   - Method: Trigger security events
   - Expected: Comprehensive logging

2. Log Injection
   - Target: Input fields that get logged
   - Payloads: CRLF injection, log forging
   - Expected: Sanitized log entries

3. Sensitive Data in Logs
   - Target: Application logs
   - Method: Review log files
   - Expected: No sensitive data logged

4. Log Integrity
   - Target: Log storage (MongoDB)
   - Method: Attempt log modification
   - Expected: Tamper-evident logging
```

**MongoDB Log Analysis**:
```javascript
// Connect to local MongoDB
use streamply_logs

// Check security events
db.security_events.find().sort({timestamp: -1})

// Analyze failed logins
db.auth_logs.find({event: "login_failed"})

// Monitor suspicious activities
db.security_events.find({severity: "high"})
```

### A10:2021 – Server-Side Request Forgery (SSRF)
**Objective**: Test for internal network access, cloud metadata exposure

**Test Cases**:
```
1. Internal Network Access
   - Target: File upload, webhook endpoints
   - Payloads: http://localhost:22, http://169.254.169.254/
   - Expected: Internal network isolation

2. Cloud Metadata Access
   - Target: URL-based features
   - Payloads: AWS/Azure/GCP metadata endpoints
   - Expected: Cloud metadata protection

3. Port Scanning via SSRF
   - Target: URL processing endpoints
   - Method: Internal port enumeration
   - Expected: Port access restrictions

4. Protocol Bypass
   - Target: URL validation
   - Payloads: file://, ftp://, gopher://
   - Expected: HTTP/HTTPS only allowed
```

**ZAP Configuration**:
```
Scanner: SSRF Scanner
Tests: Internal network access
Payloads: Cloud metadata endpoints
```

## Automated Testing Scripts

### ZAP Automation Framework Configuration
```yaml
env:
  contexts:
    - name: "StreamPly Security Test"
      urls: ["http://localhost"]
      includePaths: ["http://localhost/api/.*"]
      excludePaths: ["http://localhost/health"]

jobs:
  - type: spiderAjax
    parameters:
      context: "StreamPly Security Test"
      url: "http://localhost"
      
  - type: activeScan
    parameters:
      context: "StreamPly Security Test"
      policy: "Default Policy"
      
  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "security-reports"
      reportFile: "streamply-security-report"
```

### PowerShell Testing Script
```powershell
# Run comprehensive security tests
$testResults = @{}

# Test 1: Security Headers
$headers = Invoke-WebRequest -Uri "http://localhost/health" -Method GET
$testResults["SecurityHeaders"] = @{
    "CSP" = $headers.Headers["Content-Security-Policy"]
    "HSTS" = $headers.Headers["Strict-Transport-Security"]
    "XFrame" = $headers.Headers["X-Frame-Options"]
}

# Test 2: Rate Limiting
$rateLimitTest = @()
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/api/auth/login" -Method POST
        $rateLimitTest += $response.StatusCode
    }
    catch {
        $rateLimitTest += $_.Exception.Response.StatusCode.Value__
    }
}
$testResults["RateLimit"] = $rateLimitTest

# Test 3: Error Handling
try {
    $errorTest = Invoke-WebRequest -Uri "http://localhost/api/nonexistent" -Method GET
}
catch {
    $testResults["ErrorHandling"] = $_.Exception.Response.StatusCode.Value__
}

# Output results
$testResults | ConvertTo-Json -Depth 3 | Out-File "security-test-results.json"
```

## Testing Schedule for Master Thesis

### Week 1: Environment Setup & Baseline
- [ ] Set up local testing environment
- [ ] Configure ZAP and other tools
- [ ] Establish baseline security posture
- [ ] Document initial findings

### Week 2: Automated Scanning (A01-A05)
- [ ] Run ZAP automated scans
- [ ] Test broken access control
- [ ] Analyze cryptographic implementations
- [ ] Injection testing
- [ ] Security misconfiguration assessment

### Week 3: Manual Testing (A06-A10)
- [ ] Dependency vulnerability analysis
- [ ] Authentication mechanism testing
- [ ] Integrity verification testing
- [ ] Logging and monitoring review
- [ ] SSRF testing

### Week 4: Analysis & Documentation
- [ ] Compile all findings
- [ ] Risk assessment and prioritization
- [ ] Remediation recommendations
- [ ] Final security report
- [ ] Thesis documentation

## Expected Deliverables

### Security Assessment Report
1. **Executive Summary**
   - Overall security posture
   - Critical findings
   - Risk rating

2. **Technical Findings**
   - Detailed vulnerability descriptions
   - Proof of concept examples
   - CVSS scoring

3. **Remediation Plan**
   - Prioritized fixes
   - Implementation timeline
   - Verification steps

4. **Architecture Review**
   - Security controls effectiveness
   - Design recommendations
   - Best practices compliance

### Academic Contribution
- Comparative analysis of web application security
- nginx proxy security effectiveness
- OWASP Top 10 coverage analysis
- Real-world vulnerability assessment methodology

This comprehensive testing approach will provide excellent material for your master thesis while ensuring thorough security coverage of your StreamPly application!
