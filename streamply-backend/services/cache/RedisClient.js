import Redis from 'ioredis';

// Redis configuration for Railway - PUBLIC URL ONLY
const redisConfig = {
  // Force public connection - no railway.internal
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
    if (times > 20) {
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

// Use ONLY public URL - no railway.internal
if (process.env.REDIS_PUBLIC_URL) {
  try {
    const publicUrl = new URL(process.env.REDIS_PUBLIC_URL);
    redisConfig.host = publicUrl.hostname;
    redisConfig.port = parseInt(publicUrl.port) || 6379;
    redisConfig.password = publicUrl.password;
    redisConfig.username = publicUrl.username || 'default';
    console.log(`🔧 Redis config from REDIS_PUBLIC_URL: ${publicUrl.hostname}:${publicUrl.port}`);
  } catch (error) {
    console.error('❌ Failed to parse REDIS_PUBLIC_URL:', error.message);
    throw new Error('REDIS_PUBLIC_URL is required and must be valid');
  }
} else {
  console.error('❌ REDIS_PUBLIC_URL environment variable is required');
  throw new Error('REDIS_PUBLIC_URL environment variable is required');
}

// Create Redis client with public URL only
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
  console.log('🔄 Redis: Connecting to public URL...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Connected and ready via public URL');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error.message);
});

redis.on('close', () => {
  console.log('🔌 Redis: Connection closed');
});

redis.on('reconnecting', (time) => {
  console.log(`🔄 Redis: Reconnecting in ${time}ms...`);
});

redis.on('end', () => {
  console.log('🔚 Redis: Connection ended');
});

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

// Export Redis client wrapper
const redisWrapper = {
  get client() {
    return redis;
  },
  
  // Status properties
  get status() {
    return redis.status;
  },
  
  // Event handling
  on(event, handler) {
    return redis.on(event, handler);
  },
  
  once(event, handler) {
    return redis.once(event, handler);
  },
  
  // Core Redis methods
  async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.warn('⚠️  Redis GET failed:', error.message);
      return null;
    }
  },
  
  async set(key, value, mode, duration) {
    try {
      if (mode === 'EX') {
        return await redis.setex(key, duration, value);
      }
      return await redis.set(key, value);
    } catch (error) {
      console.warn('⚠️  Redis SET failed:', error.message);
      return null;
    }
  },
  
  async setex(key, seconds, value) {
    try {
      return await redis.setex(key, seconds, value);
    } catch (error) {
      console.warn('⚠️  Redis SETEX failed:', error.message);
      return null;
    }
  },
  
  async del(key) {
    try {
      return await redis.del(key);
    } catch (error) {
      console.warn('⚠️  Redis DEL failed:', error.message);
      return 0;
    }
  },
  
  async keys(pattern) {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.warn('⚠️  Redis KEYS failed:', error.message);
      return [];
    }
  },
  
  async info() {
    try {
      return await redis.info();
    } catch (error) {
      console.warn('⚠️  Redis INFO failed:', error.message);
      return 'Redis info unavailable';
    }
  },
  
  async ping() {
    try {
      return await redis.ping();
    } catch (error) {
      console.warn('⚠️  Redis PING failed:', error.message);
      return null;
    }
  },
  
  async flushall() {
    try {
      return await redis.flushall();
    } catch (error) {
      console.warn('⚠️  Redis FLUSHALL failed:', error.message);
      return null;
    }
  }
};

export default redisWrapper;
export { healthCheck, shutdown, redisWrapper, redis };