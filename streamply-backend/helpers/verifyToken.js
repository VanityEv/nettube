import * as dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

// Prefer JWT_SECRET; fall back to legacy SECRET for compatibility (no default 'secret')
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET;

if (!JWT_SECRET) {
  console.warn('[verifyToken] Missing JWT secret. Set JWT_SECRET in environment.');
}

export const verifyToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');
  if (!tokenHeader) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Missing token' });
  }

  try {
    const token = tokenHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Invalid token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Enforce access token type when present (backward compatible with legacy tokens without tokenType)
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Invalid token type' });
    }

    // Attach user details; prefer standard claims if present
    req.user = {
      id: decoded.sub || decoded.userId || decoded.id, // new tokens should use `sub`
      username: decoded.username,
      accountType: decoded.account_type,
      jti: decoded.jti,
      tokenType: decoded.tokenType || 'access',
    };

    // Minimal validation — ensure we at least have a username or id
    if (!req.user.username && !req.user.id) {
      return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Invalid token payload' });
    }

    next();
  } catch (error) {
    // Do not leak specifics; keep log minimal
    console.warn('[verifyToken] JWT verification failed:', error.name);
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Invalid token' });
  }
};

export const verifyUser = (req, res, next) => {
  const { accountType } = req.user || {};
  if (!accountType) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized' });
  }
  next();
};

export const verifyUsername = (req, res, next) => {
  const usernameFromToken = req.user?.username;
  const usernameFromBody = req.body?.username;
  if (!usernameFromToken || usernameFromToken !== usernameFromBody) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized' });
  }
  next();
};

export const verifyModerator = (req, res, next) => {
  const { accountType } = req.user || {};
  const allowedAccountTypes = [2, 3];
  if (!allowedAccountTypes.includes(accountType)) {
    return res.status(403).json({
      result: 'ERROR',
      message: 'Forbidden - User does not have the required role (moderator)',
    });
  }
  next();
};

export const verifyAdmin = (req, res, next) => {
  const { accountType } = req.user || {};
  if (accountType !== 3) {
    return res.status(403).json({ result: 'ERROR', message: 'Forbidden - Not an admin' });
  }
  next();
};
