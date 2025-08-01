import { getSubscription } from '../services/user/subscription.js';
import { logSecurityEvent } from '../services/security/mongoLogger.js';

/**
 * Middleware to verify user has active subscription for video content access
 * ENABLED FOR PRODUCTION - ENFORCING SUBSCRIPTION CHECKS
 * 
 * NOTE: This middleware should run AFTER verifyToken middleware to ensure req.user is populated
 */
export const verifySubscription = async (req, res, next) => {
  try {
    // Ensure this runs after verifyToken middleware
    if (!req.user) {
      return res.status(401).json({ 
        result: 'ERROR', 
        message: 'Authentication required - verifyToken middleware must run first',
        requiresSubscription: true 
      });
    }

    // Allow access for admins and moderators (account_type 2 or 3)
    if (req.user.accountType === 2 || req.user.accountType === 3) {
      console.log('✅ ADMIN/MODERATOR ACCESS - User:', req.user.username);
      return next();
    }

    // Check subscription status for regular users
    const subscription = await getSubscription(req.user.username);
    console.log('🔔 SUBSCRIPTION CHECK - User:', req.user.username, 'Status:', subscription?.status);
    
    if (!subscription || subscription.status !== 'active') {
      await logSecurityEvent({
        type: 'unauthorized_content_access',
        severity: 'warning',
        message: 'User attempted to access premium content without active subscription',
        metadata: { 
          username: req.user.username, 
          subscriptionStatus: subscription?.status || 'none',
          endpoint: req.path
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(403).json({ 
        result: 'ERROR', 
        message: 'Active subscription required for premium content',
        requiresSubscription: true,
        subscriptionStatus: subscription?.status || 'none'
      });
    }

    // Log successful subscription verification
    await logSecurityEvent({
      type: 'subscription_check',
      severity: 'info',
      message: 'Subscription verified successfully',
      metadata: { 
        username: req.user.username, 
        subscriptionStatus: subscription.status
      }
    });
    
    next();
  } catch (error) {
    await logSecurityEvent({
      type: 'subscription_verification_error',
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(500).json({ 
      result: 'ERROR', 
      message: 'Subscription verification failed',
      requiresSubscription: true 
    });
  }
};

/**
 * Helper function to check subscription status
 * ENABLED FOR PRODUCTION - PROPER SUBSCRIPTION CHECKING
 */
export const hasActiveSubscription = async (username) => {
  try {
    const subscription = await getSubscription(username);
    console.log('� SUBSCRIPTION STATUS CHECK - User:', username, 'Status:', subscription?.status);
    return subscription && subscription.status === 'active';
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return false;
  }
};
