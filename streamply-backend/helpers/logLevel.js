/**
 * Log Level Configuration
 * Controls which logs are displayed based on environment
 */

const LOG_LEVELS = {
  NONE: 0,       // No logs
  SECURITY: 1,   // Only security events
  ERROR: 2,      // Security + errors
  WARNING: 3,    // Security + errors + warnings
  INFO: 4,       // Security + errors + warnings + info
  DEBUG: 5       // All logs including debug
};

// Get current log level from environment or default to SECURITY for production
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  
  // In production, only security events by default
  if (process.env.NODE_ENV === 'production') {
    return LOG_LEVELS[envLevel] || LOG_LEVELS.SECURITY;
  }
  
  // In development, show more logs by default
  return LOG_LEVELS[envLevel] || LOG_LEVELS.WARNING;
};

const currentLogLevel = getCurrentLogLevel();

// Logging functions that respect log levels
const logger = {
  security: (message, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.SECURITY) {
      if (data) {
        console.log(`🚨 [SECURITY] ${message}`, data);
      } else {
        console.log(`🚨 [SECURITY] ${message}`);
      }
    }
  },
  
  error: (message, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      if (data) {
        console.error(`❌ [ERROR] ${message}`, data);
      } else {
        console.error(`❌ [ERROR] ${message}`);
      }
    }
  },
  
  warning: (message, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.WARNING) {
      if (data) {
        console.warn(`⚠️ [WARNING] ${message}`, data);
      } else {
        console.warn(`⚠️ [WARNING] ${message}`);
      }
    }
  },
  
  info: (message, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      if (data) {
        console.log(`ℹ️ [INFO] ${message}`, data);
      } else {
        console.log(`ℹ️ [INFO] ${message}`);
      }
    }
  },
  
  debug: (message, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      if (data) {
        console.log(`🔍 [DEBUG] ${message}`, data);
      } else {
        console.log(`🔍 [DEBUG] ${message}`);
      }
    }
  },
  
  // Silent functions that don't log anything (for spam reduction)
  silent: () => {},
  
  // Check if specific log level is enabled
  isEnabled: (level) => {
    return currentLogLevel >= LOG_LEVELS[level.toUpperCase()];
  }
};

export {
  LOG_LEVELS,
  logger,
  currentLogLevel
};
