// services/security/auditLogger.js
import { logSecurityEvent as mongoLogSecurityEvent, connectLogger, getRecentSecurityEvents } from './mongoLogger.js';

// Re-export the main logging function
export const logSecurityEvent = mongoLogSecurityEvent;

// Enhanced security event logging with severity levels
export async function logSecurityEventWithSeverity(type, data, severity = 'info') {
  const event = {
    type,
    data,
    severity,
    timestamp: new Date(),
    source: 'streamply_backend'
  };
  
  await mongoLogSecurityEvent(event);
}

// Export other functions for the monitoring dashboard
export { connectLogger, getRecentSecurityEvents };
