import { getSubscription } from '../services/user/subscription.js';
import jwt from 'jsonwebtoken';
import { logSecurityEvent } from '../services/security/mongoLogger.js';

const { SECRET = 'secret' } = process.env;

/**
 * Middleware to verify user has active subscription for video content access
 */
export const verifySubscription = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        result: 'ERROR', 
        message: 'Authentication required',
        requiresSubscription: true 
      });
    }

    const decoded = jwt.verify(token, SECRET);
    const username = decoded.username;
    
    // Check subscription status
    const subscription = getSubscription(username);
    
    // Allow access for admins and moderators
    if (decoded.account_type === 2 || decoded.account_type === 3) {
      return next();
    }
    
    // Check if user has active subscription
    if (!subscription || subscription.status !== 'active') {
      // Log unauthorized access attempt
      logSecurityEvent({
        type: 'unauthorized_content_access',
        username: username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({ 
        result: 'ERROR', 
        message: 'Active subscription required for video access',
        requiresSubscription: true,
        subscriptionStatus: subscription?.status || 'none'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    logSecurityEvent({
      type: 'subscription_verification_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(401).json({ 
      result: 'ERROR', 
      message: 'Invalid token',
      requiresSubscription: true 
    });
  }
};

/**
 * Helper function to check subscription status
 */
export const hasActiveSubscription = (username) => {
  const subscription = getSubscription(username);
  return subscription && subscription.status === 'active';
};
