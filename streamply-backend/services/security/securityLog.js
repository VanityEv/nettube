// Simple in-memory log for demonstration (replace with DB or persistent store in production)
const securityEvents = [];

export function logSecurityEvent(event) {
  securityEvents.push({ ...event, timestamp: new Date() });
  // Optionally, add logic to limit log size or persist to disk/DB
}

export function getRecentSecurityEvents(limit = 100) {
  return securityEvents.slice(-limit).reverse();
}
