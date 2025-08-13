import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Get JWT_SECRET from environment, fail if not present
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate a access token (1 hour)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      account_type: user.account_type,
      tokenType: 'access',
      jti: crypto.randomUUID()
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h'
    }
  );
};

/**
 * Generate a long-lived refresh token (30 days) and store it in database
 */
export const generateRefreshToken = async (user, deviceInfo = {}) => {
  const jti = crypto.randomUUID();
  const tokenPayload = {
    sub: user.id,
    username: user.username,
    tokenType: 'refresh',
    jti
  };
  
  const refreshToken = jwt.sign(
    tokenPayload,
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '30d'
    }
  );
  
  // Hash the token for storage
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  
  // Store in database
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      jti,
      device_fingerprint: deviceInfo.fingerprint || null,
      user_agent: deviceInfo.userAgent || null,
      ip_address: deviceInfo.ipAddress || null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });
  
  return { refreshToken, jti };
};

/**
 * Verify and rotate a refresh token
 */
export const rotateRefreshToken = async (refreshToken, deviceInfo = {}) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: ['HS256'] });
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Find the token in database
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        user_id: decoded.sub,
        jti: decoded.jti,
        revoked_at: null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            account_type: true
          }
        }
      }
    });
    
    if (storedTokens.length === 0) {
      throw new Error('Refresh token not found or revoked');
    }
    
    const storedToken = storedTokens[0];
    
    // Check if token has expired
    if (storedToken.expires_at < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked_at: new Date() }
      });
      throw new Error('Refresh token expired');
    }
    
    // Verify the token hash matches
    const isValidToken = await bcrypt.compare(refreshToken, storedToken.token_hash);
    if (!isValidToken) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new tokens
    const user = storedToken.user;
    const newAccessToken = generateAccessToken(user);
    const { refreshToken: newRefreshToken, jti: newJti } = await generateRefreshToken(user, deviceInfo);
    
    // Revoke the old refresh token and mark replacement
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revoked_at: new Date(),
        replaced_by: newJti
      }
    });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        accountType: user.account_type
      }
    };
  } catch (error) {
    throw new Error(`Token rotation failed: ${error.message}`);
  }
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: ['HS256'] });
    
    await prisma.refreshToken.updateMany({
      where: {
        user_id: decoded.sub,
        jti: decoded.jti,
        revoked_at: null
      },
      data: {
        revoked_at: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.warn('Failed to revoke refresh token:', error.message);
    return false;
  }
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllRefreshTokens = async (userId) => {
  try {
    await prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked_at: null
      },
      data: {
        revoked_at: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.warn('Failed to revoke all refresh tokens:', error.message);
    return false;
  }
};

/**
 * Clean up expired refresh tokens (should be run periodically)
 */
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { revoked_at: { not: null, lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Revoked more than 7 days ago
        ]
      }
    });
    
    console.log(`Cleaned up ${result.count} expired/old refresh tokens`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }
};
