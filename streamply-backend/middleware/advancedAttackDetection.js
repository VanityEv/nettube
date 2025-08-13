/**
 * Advanced Attack Detection System
 * Detects SQL Injection, XSS, NoSQL Injection, and other attack patterns
 * With rate-limited logging to prevent log spam
 */

import { logSecurityEvent } from '../services/security/mongoLogger.js';
import { getRealClientIP } from '../helpers/ipDetection.js';

// Rate limiting for attack logging to prevent spam
const attackLogLimiter = new Map();
const ATTACK_LOG_WINDOW = 60 * 1000; // 1 minute
const MAX_LOGS_PER_WINDOW = 5; // Max 5 attack logs per IP per minute

/**
 * SQL Injection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
  /'(\s*OR\s*|\s*AND\s*)\d+\s*=\s*\d+/i,
  /'(\s*OR\s*|\s*AND\s*)'[^']*'\s*=\s*'[^']*/i,
  /--[\s\S]*$/m,
  /\/\*[\s\S]*?\*\//,
  /;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC)/i,
  /(WAITFOR\s+DELAY|BENCHMARK|SLEEP)\s*\(/i,
  /(@@VERSION|@@SERVERNAME|USER_NAME|DB_NAME)\s*\(/i,
  /0x[0-9a-fA-F]+/,
  /(CHR|ASCII|SUBSTRING|CHARINDEX|LEN)\s*\(/i,
  // ZAP-specific patterns
  /\bASC\s+--/i,
  /\bDESC\s+--/i,
  /\bORDER\s+BY\s+\d+\s*--/i,
  /\bAND\s+1\s*=\s*1\s*--/i,
  /\bOR\s+1\s*=\s*1\s*--/i,
  /randomblob\s*\(/i,
  /UTL_INADDR\s*\./i,
  /get_host_name\s*\(/i,
  /\bcase\s+when\s+.*?then\s+.*?else\s+.*?end/i,
  /\bcase\s+randomblob\s*\(/i,
  /\bunion\s+select\s+UTL_INADDR/i,
  /from\s+dual\s+union/i,
  /\bsleep\s*\(\s*\d+\s*\)/i,
  /\'\s+or\s+0\s+in\s+\(/i
];

/**
 * XSS patterns
 */
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/i,
  /<object[\s\S]*?>[\s\S]*?<\/object>/i,
  /<embed[\s\S]*?>/i,
  /<link[\s\S]*?>/i,
  /<meta[\s\S]*?>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on\w+\s*=\s*['"]/i,
  /<img[\s\S]*?onerror\s*=[\s\S]*?>/i,
  /<svg[\s\S]*?onload\s*=[\s\S]*?>/i,
  /eval\s*\(/i,
  /alert\s*\(/i,
  /confirm\s*\(/i,
  /prompt\s*\(/i,
  /document\.(cookie|domain|location)/i,
  /window\.(location|open)/i
];

/**
 * NoSQL Injection patterns (MongoDB)
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$ne\s*:/i,
  /\$or\s*:/i,
  /\$where\s*:/i,
  /\$regex\s*:/i,
  /\$gt\s*:/i,
  /\$lt\s*:/i,
  /\$gte\s*:/i,
  /\$lte\s*:/i,
  /\$in\s*:/i,
  /\$nin\s*:/i,
  /\$exists\s*:/i,
  /\$type\s*:/i,
  /\$elemMatch\s*:/i,
  /\$all\s*:/i,
  /\$size\s*:/i,
  /\$mod\s*:/i
];

/**
 * Directory traversal patterns
 */
const DIRECTORY_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%2e%2e/gi,
  /etc\/passwd/i,
  /windows\/system32/i,
  /boot\.ini/i,
  /web\.config/i,
  /\.env/i
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /;\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig|wget|curl)/i,
  /\|\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig|wget|curl)/i,
  /&&\s*(ls|cat|pwd|whoami|id|uname|ps|netstat|ifconfig|wget|curl)/i,
  /`[^`]*`/,
  /\$\([^)]*\)/,
  /\${[^}]*}/
];

/**
 * Check if IP can log attacks (rate limiting)
 */
function canLogAttack(ip) {
  const now = Date.now();
  const ipLogs = attackLogLimiter.get(ip) || { count: 0, window: now };
  
  // Reset window if expired
  if (now - ipLogs.window > ATTACK_LOG_WINDOW) {
    ipLogs.count = 0;
    ipLogs.window = now;
  }
  
  if (ipLogs.count >= MAX_LOGS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  ipLogs.count++;
  attackLogLimiter.set(ip, ipLogs);
  return true;
}

/**
 * Analyze text for attack patterns
 */
function analyzeForAttacks(text, source = 'unknown') {
  if (!text || typeof text !== 'string') return { clean: true };
  
  const detectedAttacks = [];
  const patterns = [];
  
  // Check SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedAttacks.push('sql_injection');
      patterns.push('SQL Injection detected');
      break;
    }
  }
  
  // Check XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(text)) {
      detectedAttacks.push('xss');
      patterns.push('XSS detected');
      break;
    }
  }
  
  // Check NoSQL Injection
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedAttacks.push('nosql_injection');
      patterns.push('NoSQL Injection detected');
      break;
    }
  }
  
  // Check Directory Traversal
  for (const pattern of DIRECTORY_TRAVERSAL_PATTERNS) {
    if (pattern.test(text)) {
      detectedAttacks.push('directory_traversal');
      patterns.push('Directory Traversal detected');
      break;
    }
  }
  
  // Check Command Injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedAttacks.push('command_injection');
      patterns.push('Command Injection detected');
      break;
    }
  }
  
  return {
    clean: detectedAttacks.length === 0,
    attacks: detectedAttacks,
    patterns,
    source,
    sample: text.substring(0, 200) // First 200 chars for analysis
  };
}

/**
 * Main attack detection middleware
 */
export function detectAttacks(req, res, next) {
  const ip = getRealClientIP(req);
  const allDetections = [];
  
  // Check URL
  const urlAnalysis = analyzeForAttacks(req.originalUrl, 'url');
  if (!urlAnalysis.clean) {
    allDetections.push(urlAnalysis);
  }
  
  // Check query parameters
  const queryString = JSON.stringify(req.query);
  const queryAnalysis = analyzeForAttacks(queryString, 'query');
  if (!queryAnalysis.clean) {
    allDetections.push(queryAnalysis);
  }
  
  // Check body if present
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    const bodyAnalysis = analyzeForAttacks(bodyString, 'body');
    if (!bodyAnalysis.clean) {
      allDetections.push(bodyAnalysis);
    }
  }
  
  // Check headers for suspicious patterns
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  const headerAnalysis = analyzeForAttacks(userAgent + ' ' + referer, 'headers');
  if (!headerAnalysis.clean) {
    allDetections.push(headerAnalysis);
  }
  
  // If attacks detected and we can log (not rate limited)
  if (allDetections.length > 0 && canLogAttack(ip)) {
    const allAttackTypes = [...new Set(allDetections.flatMap(d => d.attacks))];
    const allPatterns = [...new Set(allDetections.flatMap(d => d.patterns))];
    
    // Log to MongoDB (async, don't block request)
    logSecurityEvent({
      type: 'injection_attack_detected',
      subType: allAttackTypes.join(', '),
      ip,
      url: req.originalUrl,
      method: req.method,
      attackTypes: allAttackTypes,
      patterns: allPatterns,
      detections: allDetections.map(d => ({
        source: d.source,
        attacks: d.attacks,
        sample: d.sample
      })),
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      severity: allAttackTypes.includes('sql_injection') || allAttackTypes.includes('command_injection') ? 'critical' : 'high',
      timestamp: new Date().toISOString()
    }).catch(err => {
      // Silent error - don't spam logs
      console.error('Security logging failed:', err.message);
    });
    
    // Minimal console log (only for critical attacks)
    if (allAttackTypes.includes('sql_injection') || allAttackTypes.includes('command_injection')) {
      console.warn(`🚨 CRITICAL ATTACK: ${allAttackTypes.join(', ')} from ${ip} on ${req.originalUrl}`);
    }
  }
  
  next();
}

/**
 * Lightweight CSRF error handler with minimal logging
 */
export function limitedCsrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  
  const ip = getRealClientIP(req);
  
  // Only log CSRF attacks occasionally (rate limited)
  if (canLogAttack(ip)) {
    // Log to MongoDB only
    logSecurityEvent({
      type: 'csrf_attack_attempt',
      ip,
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      referer: req.headers.referer,
      severity: 'medium',
      timestamp: new Date()
    }).catch(() => {}); // Silent error
    
    // Minimal console log
    console.warn(`🛡️  CSRF blocked: ${ip} -> ${req.path}`);
  }
  
  return res.status(403).json({
    error: 'Invalid CSRF token',
    code: 'CSRF_TOKEN_MISMATCH'
  });
}

// Eksport funkcji analyzeForAttacks
export { analyzeForAttacks };
