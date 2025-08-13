/**
 * Enhanced Advanced Attack Detection System
 * Distinguishes between attack attempts (warning) and successful attacks (critical)
 * Provides detailed payload information and smart alerting
 */

import { logSecurityEvent } from '../services/security/mongoLogger.js';
import { getRealClientIP } from '../helpers/ipDetection.js';
import { logger } from '../helpers/logLevel.js';

// Rate limiting for attack logging to prevent spam
const attackLogLimiter = new Map();
const ATTACK_LOG_WINDOW = 60 * 1000; // 1 minute
const MAX_LOGS_PER_WINDOW = 5; // Max 5 attack logs per IP per minute

/**
 * SQL Injection patterns - Enhanced with ZAP patterns
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
function canLogAttack(ip, severity = 'warning') {
  const now = Date.now();
  const key = `${ip}_${severity}`;
  const ipLogs = attackLogLimiter.get(key) || { count: 0, window: now };
  
  // Reset window if expired
  if (now - ipLogs.window > ATTACK_LOG_WINDOW) {
    ipLogs.count = 0;
    ipLogs.window = now;
  }
  
  // Critical logs have higher limit
  const maxLogs = severity === 'critical' ? MAX_LOGS_PER_WINDOW * 2 : MAX_LOGS_PER_WINDOW;
  
  if (ipLogs.count >= maxLogs) {
    return false; // Rate limited
  }
  
  ipLogs.count++;
  attackLogLimiter.set(key, ipLogs);
  return true;
}

/**
 * Analyze text for attack patterns with detailed payload extraction
 */
function analyzeForAttacks(text, source = 'unknown') {
  if (!text || typeof text !== 'string') return { clean: true };
  
  const detectedAttacks = [];
  
  // SQL Injection detection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedAttacks.push({
        type: 'sql_injection',
        pattern: pattern.toString(),
        payload: match[0],
        fullMatch: match.input ? match.input.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20) : match[0],
        source
      });
    }
  }
  
  // XSS detection
  for (const pattern of XSS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedAttacks.push({
        type: 'xss',
        pattern: pattern.toString(),
        payload: match[0],
        fullMatch: match.input ? match.input.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20) : match[0],
        source
      });
    }
  }
  
  // NoSQL Injection detection
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedAttacks.push({
        type: 'nosql_injection',
        pattern: pattern.toString(),
        payload: match[0],
        fullMatch: match.input ? match.input.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20) : match[0],
        source
      });
    }
  }
  
  // Directory Traversal detection
  for (const pattern of DIRECTORY_TRAVERSAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedAttacks.push({
        type: 'directory_traversal',
        pattern: pattern.toString(),
        payload: match[0],
        fullMatch: match.input ? match.input.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20) : match[0],
        source
      });
    }
  }
  
  // Command Injection detection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detectedAttacks.push({
        type: 'command_injection',
        pattern: pattern.toString(),
        payload: match[0],
        fullMatch: match.input ? match.input.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20) : match[0],
        source
      });
    }
  }
  
  if (detectedAttacks.length > 0) {
    return {
      clean: false,
      attacks: detectedAttacks,
      attackTypes: [...new Set(detectedAttacks.map(a => a.type))],
      source
    };
  }
  
  return { clean: true };
}

/**
 * Enhanced Attack Detection Middleware
 * Logs attempts as warning, successful attacks as critical
 */
export function detectAttacks(req, res, next) {
  const ip = getRealClientIP(req);
  const method = req.method;
  const path = req.path;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referer = req.headers.referer || 'direct';
  const allDetections = [];
  
  // Check URL
  const urlAnalysis = analyzeForAttacks(req.originalUrl, 'url');
  if (!urlAnalysis.clean) {
    allDetections.push(urlAnalysis);
  }
  
  // Check query parameters
  const queryString = JSON.stringify(req.query);
  const queryAnalysis = analyzeForAttacks(queryString, 'query_params');
  if (!queryAnalysis.clean) {
    allDetections.push(queryAnalysis);
  }
  
  // Check body if present
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    const bodyAnalysis = analyzeForAttacks(bodyString, 'request_body');
    if (!bodyAnalysis.clean) {
      allDetections.push(bodyAnalysis);
    }
  }
  
  // Check headers for suspicious patterns
  const headerAnalysis = analyzeForAttacks(userAgent + ' ' + referer, 'headers');
  if (!headerAnalysis.clean) {
    allDetections.push(headerAnalysis);
  }
  
  if (allDetections.length > 0) {
    const allAttackTypes = [...new Set(allDetections.flatMap(d => d.attackTypes))];
    const allAttacks = allDetections.flatMap(d => d.attacks);
    
    // Store attack details for later analysis (for response analysis)
    req.detectedAttacks = {
      attacks: allAttacks,
      attackTypes: allAttackTypes,
      detections: allDetections,
      clientInfo: { ip, userAgent, referer, method, path },
      timestamp: new Date()
    };
    
    // Log attack attempt (WARNING level) with rate limiting
    if (canLogAttack(ip, 'warning')) {
      logSecurityEvent({
        type: 'attack_attempt',
        severity: 'warning',
        alertType: 'low_priority', // Won't trigger security alerts
        ip,
        method,
        path,
        userAgent,
        referer,
        attackTypes: allAttackTypes,
        detections: allDetections,
        payloadSamples: allAttacks.slice(0, 3).map(a => ({ 
          type: a.type, 
          payload: a.payload,
          source: a.source 
        })),
        message: `Attack patterns detected: ${allAttackTypes.join(', ')}`,
        timestamp: new Date()
      }).catch(() => {}); // Silent error
      
      // Minimal console log for attempts - log IP for security events
      logger.security(`Attack attempt from ${ip}: ${allAttackTypes.join(', ')}`);
    }
    
    // Block the request with 403
    return res.status(403).json({
      error: 'Request blocked for security reasons',
      code: 'SECURITY_VIOLATION',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

/**
 * Response Analysis Middleware
 * Checks if attack was successful based on response status
 */
export function analyzeResponse(req, res, next) {
  // Store original end function
  const originalEnd = res.end;
  const originalJson = res.json;
  
  // Override res.end to capture response
  res.end = function(chunk, encoding) {
    analyzeAttackSuccess(req, res);
    originalEnd.call(this, chunk, encoding);
  };
  
  // Override res.json to capture response
  res.json = function(obj) {
    analyzeAttackSuccess(req, res);
    originalJson.call(this, obj);
  };
  
  next();
}

/**
 * Analyze if attack was successful based on response
 */
function analyzeAttackSuccess(req, res) {
  if (!req.detectedAttacks) return;
  
  const { attacks, attackTypes, clientInfo } = req.detectedAttacks;
  const statusCode = res.statusCode;
  const ip = clientInfo.ip;
  
  // If response is NOT 4xx (forbidden/unauthorized/bad request), it might be successful
  const isSuccessfulAttack = statusCode < 400 || statusCode >= 500;
  
  if (isSuccessfulAttack && canLogAttack(ip, 'critical')) {
    logSecurityEvent({
      type: 'attack_success',
      severity: 'critical',
      alertType: 'security_alert', // Will trigger security alerts
      ip: clientInfo.ip,
      method: clientInfo.method,
      path: clientInfo.path,
      userAgent: clientInfo.userAgent,
      referer: clientInfo.referer,
      statusCode,
      attackTypes,
      payloadDetails: attacks.slice(0, 5).map(a => ({
        type: a.type,
        payload: a.payload,
        fullContext: a.fullMatch,
        source: a.source,
        pattern: a.pattern
      })),
      message: `SUCCESSFUL ATTACK DETECTED! Status: ${statusCode}, Types: ${attackTypes.join(', ')}`,
      timestamp: new Date()
    }).catch(() => {}); // Silent error
    
    // Alert console for successful attacks
    console.error(`🚨 SUCCESSFUL ATTACK: ${ip} -> ${attackTypes.join(', ')} (Status: ${statusCode})`);
  }
}

/**
 * Limited CSRF Error Handler with minimal logging
 */
export function limitedCsrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  const ip = getRealClientIP(req);
  
  // Only log CSRF violations occasionally to prevent spam
  if (canLogAttack(ip, 'warning') && Math.random() < 0.1) { // 10% chance to log
    logSecurityEvent({
      type: 'csrf_violation',
      severity: 'info',
      alertType: 'low_priority',
      ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      timestamp: new Date()
    }).catch(() => {}); // Silent error
  }
  
  return res.status(403).json({
    error: 'Invalid CSRF token',
    code: 'CSRF_TOKEN_MISMATCH'
  });
}

export { analyzeForAttacks };
