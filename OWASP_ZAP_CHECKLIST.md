# 🔒 OWASP ZAP Pre-Deployment Checklist

## ✅ Sprawdź przed uruchomieniem ZAP

### 1. Uruchom aplikację
```powershell
# Start Streamply z pełną konfiguracją bezpieczeństwa
.\start-streamply-ngrok.ps1 -TunnelType localtunnel

# Sprawdź czy wszystkie serwisy działają
.\security-test.ps1 -BaseUrl "https://your-tunnel-url.loca.lt"
```

### 2. Upewnij się że masz:
- [x] 🔗 Działający tunel (ngrok/localtunnel/cloudflare)
- [x] 🗄️ Lokalne bazy danych (PostgreSQL + MongoDB)
- [x] 🔧 Backend na porcie 3001
- [x] 🌐 Proxy na porcie 80/8080
- [x] 📊 Ngrok dashboard na localhost:4040

### 3. Test podstawowych endpointów:
```powershell
# Health check
Invoke-RestMethod "https://your-tunnel-url.loca.lt/health"

# CORS test
Invoke-RestMethod "https://your-tunnel-url.loca.lt/api/videos/test-cors"

# Proxy status
Invoke-RestMethod "https://your-tunnel-url.loca.lt/proxy-status"
```

---

## 🎯 Konfiguracja OWASP ZAP

### 1. Download OWASP ZAP
```
https://www.zaproxy.org/download/
```

### 2. Podstawowa konfiguracja ZAP:

#### Target Configuration:
```
Target URL: https://your-tunnel-url.loca.lt
Context Name: Streamply
Include in Context: https://your-tunnel-url.loca.lt.*
Exclude from Context: 
  - https://your-tunnel-url.loca.lt/api/videos/upload.*
  - https://your-tunnel-url.loca.lt/api/videos/video/stream.*
```

#### Authentication (Optional):
```
Authentication Method: JSON-based authentication
Login URL: https://your-tunnel-url.loca.lt/api/signin
Username: test@streamply.com
Password: TestPass123!
Login Request Data: {"email":"test@streamply.com","password":"TestPass123!"}
```

#### Session Management:
```
Session Management Method: Cookie-based Session Management
or JWT Token in Authorization header
```

### 3. Scan Policy:
```
Scan Policy: Default Policy (recommended)
Attack Strength: Medium
Alert Threshold: Medium
```

---

## 🚀 Sekwencja skanowania ZAP

### Krok 1: Manual Explore (5 min)
```
1. Otwórz ZAP
2. Wpisz: https://your-tunnel-url.loca.lt
3. Kliknij "Launch Browser"
4. Nawiguj po aplikacji ręcznie:
   - Strona główna
   - /health
   - /proxy-status
   - /api/videos/test-cors
```

### Krok 2: Spider Scan (10 min)
```
1. Right-click na target URL
2. Attack → Spider
3. Czekaj na zakończenie
4. Sprawdź Sites tree - powinny być wszystkie endpointy
```

### Krok 3: Active Scan (20-30 min)
```
1. Right-click na target URL
2. Attack → Active Scan
3. Użyj Default Policy
4. Monitor postęp w Active Scan tab
5. Sprawdzaj Alerts tab na bieżąco
```

### Krok 4: Report Generation
```
1. Report → Generate Report
2. Format: HTML lub PDF
3. Zapisz raport
4. Przeanalizuj wyniki
```

---

## 🎯 Oczekiwane wyniki ZAP

### ✅ Powinno być OK (zielone/info):
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP
- **HTTPS**: SSL/TLS configuration  
- **Authentication**: JWT token validation
- **Session Management**: Secure cookie settings
- **CORS**: Proper origin validation
- **Input Validation**: No injection vulnerabilities

### ⚠️ Możliwe ostrzeżenia (żółte):
- **CSP 'unsafe-inline'**: Potrzebne dla React (acceptable)
- **Missing HSTS**: Jeśli testujesz przez HTTP (dodaj HTTPS)
- **Cookie SameSite**: Możliwe dla dev cookies
- **Information Disclosure**: Wersje bibliotek (nie krytyczne)

### 🚨 NIE powinno być (czerwone):
- **SQL Injection**: Chronione przez Prisma
- **XSS**: Chronione przez sanityzację + CSP
- **Authentication Bypass**: JWT implementacja
- **CSRF**: Token-based authentication
- **Clickjacking**: X-Frame-Options: DENY
- **Directory Traversal**: Path validation

---

## 📊 Interpretacja wyników

### High Risk (0 expected):
```
❌ Critical vulnerabilities requiring immediate fix
```

### Medium Risk (0-2 expected):
```
⚠️ Usually false positives or minor configuration issues
```

### Low Risk (2-5 expected):
```
ℹ️ Informational findings or minor improvements
```

### Informational (5-10 expected):
```
💡 Best practice recommendations
```

---

## 🛠️ Rozwiązywanie problemów ZAP

### Problem: ZAP nie może się połączyć
```powershell
# Sprawdź czy tunel działa
curl -I https://your-tunnel-url.loca.lt/health

# Sprawdź czy rate limiting nie blokuje
# ZAP robi dużo requestów szybko
```

### Problem: Zbyt dużo false positives
```
1. Sprawdź Context configuration
2. Exclude problematic URLs
3. Adjust scan policy (Lower attack strength)
4. Review authentication configuration
```

### Problem: Scan trwa za długo
```
1. Reduce scope (exclude upload/streaming endpoints)
2. Lower attack strength to Low
3. Exclude static resources
4. Use Quick Start instead of Full Scan
```

### Problem: Rate limiting blokuje scan
```powershell
# Tymczasowo zwiększ limity w proxy-server.js:
const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  500, // Increased from 100 to 500 for ZAP
  'Too many requests...'
);
```

---

## 🏆 Success Criteria

### Grade A Security (85-95 points):
- ✅ No High/Critical vulnerabilities
- ✅ Proper security headers
- ✅ Strong authentication
- ✅ Effective input validation
- ✅ Secure session management

### OWASP Top 10 2025 Compliance:
- ✅ A01: Broken Access Control → JWT + RBAC
- ✅ A02: Cryptographic Failures → Strong encryption  
- ✅ A03: Injection → Prisma ORM + validation
- ✅ A04: Insecure Design → Security by design
- ✅ A05: Security Misconfiguration → Proper headers
- ✅ A06: Vulnerable Components → Updated deps
- ✅ A07: Authentication Failures → Strong auth
- ✅ A08: Data Integrity → Secure uploads
- ✅ A09: Logging Failures → Security logging
- ✅ A10: SSRF → URL validation

---

## 📈 Post-ZAP Actions

### 1. Review Report:
```
- Document all findings
- Classify real issues vs false positives  
- Prioritize fixes by risk level
- Plan remediation timeline
```

### 2. Fix Issues:
```
- Update security headers if needed
- Strengthen input validation
- Review authentication flows
- Update dependencies
```

### 3. Re-test:
```
- Run security-test.ps1 again
- Targeted ZAP scans on fixed areas
- Full regression test
```

### 4. Document:
```
- Update security documentation
- Share results with team
- Schedule regular security scans
- Maintain security baseline
```

---

## ✅ FINAL CHECKLIST

Przed uruchomieniem ZAP upewnij się że:

- [ ] Aplikacja działa stabilnie przez tunel
- [ ] Wszystkie security headers są aktywne
- [ ] Rate limiting działa prawidłowo
- [ ] CORS jest skonfigurowany
- [ ] Authentication endpointy chronione
- [ ] Input validation aktywna
- [ ] Security logging włączone
- [ ] Backup baz danych zrobiony
- [ ] ZAP skonfigurowany poprawnie
- [ ] Context i scope ustawione

**Twoja aplikacja Streamply jest gotowa na professional security audit! 🔒✨**
