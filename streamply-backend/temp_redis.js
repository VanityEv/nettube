import Redis from 'ioredis';

// Redis configuration for Railway
const redisConfig = {
  // Railway automatically provides REDIS_URL
  // Format: redis://default:password@redis.railway.internal:6379
  host: process.env.REDIS_HOST || process.env.REDISHOST || 'redis.railway.internal',
  port: process.env.REDIS_PORT || process.env.REDISPORT || 6379,
  password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD,
  username: process.env.REDIS_USER || process.env.REDISUSER || 'default',
  
  // Railway-specific optimizations
  family: 4, // Force IPv4
  keepAlive: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 500,
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: false, // Try immediate connection
  
  // Connection pool settings
  maxConnections: 10,
  minConnections: 1,
  
  // Retry strategy with more aggressive retries
  retryStrategy: (times) => {
    if (times > 50) {
      console.error('❌ Redis: Max retries exceeded, giving up');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    console.log(`🔄 Redis retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  
  // Error handling
  reconnectOnError: (err) => {
    console.warn('⚠️  Redis reconnect on error:', err.message);
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  }
};

// Parse REDIS_URL if provided (Railway format)
if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    redisConfig.host = url.hostname;
    redisConfig.port = parseInt(url.port) || 6379;
    redisConfig.password = url.password;
    redisConfig.username = url.username || 'default';
    console.log(`🔧 Redis config from REDIS_URL: ${url.hostname}:${url.port}`);
  } catch (error) {
    console.warn('⚠️  Failed to parse REDIS_URL, trying REDIS_PUBLIC_URL:', error.message);
  }
}

// Fallback to REDIS_PUBLIC_URL if REDIS_URL fails or for local development
if (process.env.REDIS_PUBLIC_URL && (!process.env.REDIS_URL || process.env.NODE_ENV === 'development')) {
  try {
    const publicUrl = new URL(process.env.REDIS_PUBLIC_URL);
    redisConfig.host = publicUrl.hostname;
    redisConfig.port = parseInt(publicUrl.port) || 6379;
    redisConfig.password = publicUrl.password;
    redisConfig.username = publicUrl.username || 'default';
    console.log(`🔧 Redis config from REDIS_PUBLIC_URL: ${publicUrl.hostname}:${publicUrl.port}`);
  } catch (publicError) {
    console.warn('⚠️  Failed to parse REDIS_PUBLIC_URL, using defaults:', publicError.message);
  }
}

// Create Redis client
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

// Connection event handlers are set up in the initialization section below

// Health check function
const healthCheck = async () => {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      console.log('💚 Redis health check: OK');
      return true;
    }
    return false;
  } catch (error) {
    console.error('💔 Redis health check failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    console.log('🔄 Redis: Graceful shutdown...');
    await redis.quit();
    console.log('✅ Redis: Shutdown complete');
  } catch (error) {
    console.error('❌ Redis shutdown error:', error.message);
    redis.disconnect();
  }
};

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export Redis client and utilities with dynamic fallback
const getRedisClient = () => redisClient || redis;

const redisWrapper = {
  get client() {
    return redisClient || redis;
  },
  
  // Proxy all Redis methods to the active client
  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.warn('⚠️  Redis GET failed, using null fallback:', error.message);
      return null;
    }
  },
  
  async set(key, value, mode, duration) {
    try {
      if (mode === 'EX') {
        return await this.client.setex(key, duration, value);
      }
      return await this.client.set(key, value);
    } catch (error) {
      console.warn('⚠️  Redis SET failed:', error.message);
      return null;
    }
  },
  
  async setex(key, seconds, value) {
    try {
      return await this.client.setex(key, seconds, value);
    } catch (error) {
      console.warn('⚠️  Redis SETEX failed:', error.message);
      return null;
    }
  },
  
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.warn('⚠️  Redis DEL failed:', error.message);
      return 0;
    }
  },
  
  async ping() {
    try {
      return await this.client.ping();
    } catch (error) {
      console.warn('⚠️  Redis PING failed:', error.message);
      return null;
    }
  },
  
  async flushall() {
    try {
      return await this.client.flushall();
    } catch (error) {
      console.warn('⚠️  Redis FLUSHALL failed:', error.message);
      return null;
    }
  }
};

// Initial connection setup with fallback strategy
let redisClient = redis;

// Add ready event handler for rate limiter initialization
redis.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
  // Reinitialize rate limiters with Redis after connection is ready
  setTimeout(async () => {
    try {
      const { reinitializeRateLimiters } = await import('./middleware/rateLimit.js');
      console.log('🔄 Reinitializing rate limiters with Redis...');
      await reinitializeRateLimiters();
      console.log('✅ Rate limiters reinitialized with Redis');
    } catch (error) {
      console.warn('⚠️ Failed to reinitialize rate limiters:', error.message);
    }
  }, 1000); // Small delay to ensure Redis is fully ready
});

export default redisWrapper;
export { healthCheck, shutdown, getRedisClient, redisWrapper };
