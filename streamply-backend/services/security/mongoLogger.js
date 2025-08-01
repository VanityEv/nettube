// services/security/mongoLogger.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'streamply_logs';
const collectionName = 'security_events';

let client, collection;
let mongoAvailable = true;

export async function connectLogger() {
  if (!mongoAvailable) {
    console.warn('MongoDB not available, skipping security logging');
    return false;
  }

  if (!client) {
    try {
      client = new MongoClient(uri, { useUnifiedTopology: true });
      await client.connect();
      collection = client.db(dbName).collection(collectionName);
      console.log('✅ MongoDB connected for security logging');
      return true;
    } catch (error) {
      console.warn('⚠️  MongoDB not available for security logging:', error.message);
      mongoAvailable = false;
      return false;
    }
  }
  return true;
}

export async function logSecurityEvent(event) {
  try {
    const connected = await connectLogger();
    if (connected && collection) {
      // Create a sanitized event object to avoid circular references and sensitive data
      const sanitizedEvent = {
        ...event,
        timestamp: new Date(),
        // Ensure we have severity (default to 'info' if not provided)
        severity: event.severity || 'info',
        // Remove the req object to avoid circular references
        req: undefined,
        // Enhanced metadata structure
        metadata: {
          ...event.metadata,
          // Server information
          serverTimestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          // Request information (if available) - extract only safe properties
          ...(event.req && {
            ip: event.req.ip || event.req.connection?.remoteAddress || 'unknown',
            userAgent: event.req.get?.('User-Agent') || event.req.headers?.['user-agent'] || 'unknown',
            method: event.req.method || 'unknown',
            url: event.req.originalUrl || event.req.url || 'unknown',
            // Sanitize request body - exclude sensitive fields
            ...(event.req.body && {
              requestBodyKeys: Object.keys(event.req.body).filter(key => 
                !['password', 'confirmPassword', 'token', 'secret', 'key', 'hash', 'clientId', 'clientSecret'].includes(key)
              ),
              hasPassword: !!event.req.body.password,
              hasToken: !!event.req.body.token
            }),
            headers: {
              host: event.req.get?.('Host') || event.req.headers?.host,
              referer: event.req.get?.('Referer') || event.req.headers?.referer,
              'content-type': event.req.get?.('Content-Type') || event.req.headers?.['content-type'],
              // Never log authorization headers
              authorization: event.req.headers?.authorization ? '[REDACTED]' : undefined
            }
          }),
          // User information (if available) - sanitize sensitive fields
          ...(event.user && {
            userId: event.user._id || event.user.id || event.user.userId,
            username: event.user.username || event.user.email,
            accountType: event.user.accountType || event.user.account_type,
            sessionId: event.user.sessionId,
            // Never log password hashes, tokens, or other sensitive user data
            ...(event.user.password && { hasPassword: true }),
            ...(event.user.token && { hasToken: true })
          }),
          // Additional context
          ...(event.context && event.context)
        }
      };
      
      await collection.insertOne(sanitizedEvent);
    } else {
      // Fallback to console logging in development with sanitized data
      console.log('Security Event:', { 
        ...event, 
        req: event.req ? { method: event.req.method, url: event.req.originalUrl } : undefined,
        user: event.user ? { 
          userId: event.user._id || event.user.id, 
          username: event.user.username,
          accountType: event.user.accountType 
        } : undefined,
        timestamp: new Date() 
      });
    }
  } catch (error) {
    console.warn('Failed to log security event:', error.message);
    // Fallback to console logging with sanitized data
    console.log('Security Event (fallback):', { 
      ...event, 
      req: event.req ? { method: event.req.method, url: event.req.originalUrl } : undefined,
      user: event.user ? { 
        userId: event.user._id || event.user.id, 
        username: event.user.username 
      } : undefined,
      timestamp: new Date() 
    });
  }
}

export async function getRecentSecurityEvents(limit = 100) {
  try {
    const connected = await connectLogger();
    if (connected && collection) {
      return await collection.find().sort({ timestamp: -1 }).limit(limit).toArray();
    } else {
      return [];
    }
  } catch (error) {
    console.warn('Failed to get security events:', error.message);
    return [];
  }
}

// Enhanced logging function with structured data
export async function logSecurityEventWithContext(type, options = {}) {
  const {
    severity = 'info',
    message = '',
    user = null,
    req = null,
    metadata = {},
    category = null,
    source = 'system'
  } = options;

  await logSecurityEvent({
    type,
    severity,
    message,
    category,
    source,
    user,
    req,
    metadata,
    context: {
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version
    }
  });
}

// Specific logging functions for common events
export async function logAuthEvent(type, user, req, success = true, additionalData = {}) {
  await logSecurityEventWithContext(type, {
    severity: success ? 'info' : 'warning',
    message: `Authentication ${success ? 'successful' : 'failed'}: ${type}`,
    user,
    req,
    category: 'authentication',
    source: 'auth_system',
    metadata: {
      success,
      authMethod: additionalData.authMethod || 'jwt',
      ...additionalData
    }
  });
}

export async function logAccessEvent(type, user, req, resource, allowed = true, additionalData = {}) {
  await logSecurityEventWithContext(type, {
    severity: allowed ? 'info' : 'warning',
    message: `Access ${allowed ? 'granted' : 'denied'} to ${resource}`,
    user,
    req,
    category: 'access_control',
    source: 'authorization_system',
    metadata: {
      resource,
      allowed,
      accessLevel: additionalData.accessLevel || 'standard',
      ...additionalData
    }
  });
}

export async function logSecurityViolation(type, user, req, violationDetails, additionalData = {}) {
  await logSecurityEventWithContext(type, {
    severity: 'critical',
    message: `Security violation detected: ${violationDetails}`,
    user,
    req,
    category: 'security_violation',
    source: 'security_monitor',
    metadata: {
      violationType: type,
      details: violationDetails,
      riskLevel: additionalData.riskLevel || 'high',
      ...additionalData
    }
  });
}

export async function logSystemEvent(type, message, severity = 'info', additionalData = {}) {
  await logSecurityEventWithContext(type, {
    severity,
    message,
    category: 'system',
    source: 'system',
    metadata: {
      systemEvent: true,
      ...additionalData
    }
  });
}
