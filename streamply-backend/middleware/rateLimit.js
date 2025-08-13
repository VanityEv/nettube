import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redisClient, { redis } from '../services/cache/RedisClient.js';
import { getSecureClientIP } from '../security/secureIPDetection.js';

// Rate limiter configurations
const defaultOptions = {
  duration: 900, // 15 minutes
  points: 10, // 10 requests
};

const loginOptions = {
  duration: 900,  // 15 minutes
  points: 20,     // 20 login attempts per user (per your request)
  blockDuration: 1800, // 30 minutes block
};

const signupOptions = {
  duration: 900,  // 15 minutes
  points: 10,     // 10 signups per IP
  blockDuration: 900, // 15 minutes block
};

const passwordResetOptions = {
  duration: 900,  // 15 minutes
  points: 5,      // 5 password reset attempts per IP
  blockDuration: 1800, // 30 minutes block
};

const otpOptions = {
  duration: 300,  // 5 minutes
  points: 3,      // 3 OTP attempts
  blockDuration: 900, // 15 minutes block
};

const videoApiOptions = {
  duration: 900,  // 15 minutes
  points: 100,    // 100 video API requests per IP
  blockDuration: 300, // 5 minutes block
};

const videoStreamingOptions = {
  duration: 300,  // 5 minutes
  points: 50,     // 50 streaming requests per user
  blockDuration: 600, // 10 minutes block
};

const reviewsOptions = {
  duration: 900,  // 15 minutes
  points: 20,     // 20 review requests per IP
  blockDuration: 300, // 5 minutes block
};

// Create rate limiters with Redis (fallback to memory)
let rateLimiters = {};

const createRateLimiter = async (name, options) => {
  try {
    // Wait for Redis to be ready
    if (redis.status !== 'ready') {
      await new Promise((resolve) => {
        if (redis.status === 'ready') {
          resolve();
        } else {
          redis.once('ready', resolve);
        }
      });
    }

    // Try Redis first
    rateLimiters[name] = new RateLimiterRedis({
      storeClient: redis, // Use raw Redis client, not wrapper
      keyPrefix: `rl_${name}`,
      ...options,
    });
    
    console.log(`✅ Rate limiter "${name}" created with Redis - points: ${options.points}, duration: ${options.duration}s, blockDuration: ${options.blockDuration}s`);
  } catch (error) {
    // NO MEMORY FALLBACK - just disable rate limiting if Redis fails
    console.warn(`⚠️  Redis unavailable for rate limiter "${name}", DISABLING rate limiting:`, error.message);
    rateLimiters[name] = null; // Disable instead of fallback
  }
};

// Initialize rate limiters AFTER Redis is ready
const initializeRateLimiters = async () => {
  console.log('🔧 Initializing rate limiters...');
  await createRateLimiter('default', defaultOptions);
  await createRateLimiter('login', loginOptions);
  await createRateLimiter('signup', signupOptions);
  await createRateLimiter('password_reset', passwordResetOptions);
  await createRateLimiter('otp', otpOptions);
  await createRateLimiter('video_api', videoApiOptions);
  await createRateLimiter('video_streaming', videoStreamingOptions);
  await createRateLimiter('reviews', reviewsOptions);
  console.log('✅ All rate limiters initialized');
};

// Initialize when Redis is ready
if (redis.status === 'ready') {
  initializeRateLimiters();
} else {
  redis.once('ready', initializeRateLimiters);
}

const createRateLimitMiddleware = (limiterName = 'default', keyGenerator = null) => {
  return async (req, res, next) => {
    let key; // Declare key outside try block
    try {
      const limiter = rateLimiters[limiterName];
      if (!limiter) {
        console.warn(`Rate limiter "${limiterName}" not found, skipping rate limiting`);
        return next();
      }

      if (keyGenerator && typeof keyGenerator === 'function') {
        key = keyGenerator(req);
      } else {
        // Use secure IP instead of req.ip to prevent proxy spoofing
        key = getSecureClientIP(req);
      }

      const result = await limiter.consume(key);
      
      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': result.remainingPoints || 0,
        'X-RateLimit-Reset': new Date(Date.now() + (result.msBeforeNext || 0)).toISOString(),
      });

      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      console.error(`❌ Rate limit EXCEEDED for ${limiterName}: key=${key}, retry after ${secs}s, total=${rejRes.totalHits}, remaining=${rejRes.remainingPoints}`);
      
      res.set({
        'X-RateLimit-Limit': rateLimiters[limiterName]?.points || 0,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + (rejRes.msBeforeNext || 0)).toISOString(),
        'Retry-After': secs,
      });

      console.warn(`Rate limit exceeded for ${limiterName}: ${getSecureClientIP(req)}, retry after ${secs}s`);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs,
      });
    }
  };
};

// Pre-configured middleware
const rateLimitDefault = createRateLimitMiddleware('default');

const rateLimitLogin = createRateLimitMiddleware('login', (req) => {
  // Rate limit by secure IP + email combination for login
  const email = req.body?.email || req.body?.username || 'unknown';
  const secureIP = getSecureClientIP(req);
  return `${secureIP}:${email}`;
});

const rateLimitOTP = createRateLimitMiddleware('otp', (req) => {
  // Rate limit by userId for OTP
  return req.body?.userId || req.user?.id || getSecureClientIP(req);
});

// Custom rate limiter for specific endpoints
const createCustomRateLimit = (points, duration, blockDuration = null) => {
  const options = { 
    points, 
    duration,
    ...(blockDuration && { blockDuration })
  };
  
  try {
    const limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl_custom',
      ...options,
    });
    
    return createRateLimitMiddleware('custom', null, limiter);
  } catch (error) {
    console.warn('⚠️  Creating memory-based custom rate limiter:', error.message);
    const limiter = new RateLimiterMemory({
      keyPrefix: 'rl_custom',
      ...options,
    });
    
    return async (req, res, next) => {
      try {
        const key = req.ip || 'unknown';
        await limiter.consume(key);
        next();
      } catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${secs} seconds.`,
          retryAfter: secs,
        });
      }
    };
  }
};

export {
  rateLimitDefault,
  rateLimitLogin,
  rateLimitOTP,
  createRateLimitMiddleware,
  createCustomRateLimit,
  rateLimiters, // For manual access if needed
};
