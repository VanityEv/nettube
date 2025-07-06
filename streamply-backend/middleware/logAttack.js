// middleware/logAttack.js
import { logSecurityEvent } from '../services/security/mongoLogger.js';

export function logAttack(req, res, next) {
  // Log suspicious query params, rate limit triggers, etc.
  if (Object.keys(req.query).some(key => key.match(/(\$ne|\$or|\$gt|\$lt|--|;)/i))) {
    logSecurityEvent({
      type: 'suspicious_query',
      ip: req.ip,
      url: req.originalUrl,
      query: req.query,
      userAgent: req.headers['user-agent'],
    });
  }
  next();
}
