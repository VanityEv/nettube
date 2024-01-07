import * as dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
const { SECRET = 'secret' } = process.env;

export const verifyToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');
  if (!tokenHeader) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Missing token' });
  }

  try {
    const token = tokenHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, SECRET);

    // Extract user information from the JWT payload
    req.user = {
      username: decoded.username,
      accountType: decoded.account_type,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized - Invalid token' });
  }
};

export const verifyUser = (req, res, next) => {
  const { accountType } = req.user;

  if (!accountType) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized' });
  }

  next();
};

export const verifyUsername = (req, res, next) => {
  const { username } = req.user;

  if (username !== req.body.username) {
    return res.status(401).json({ result: 'ERROR', message: 'Unauthorized' });
  }

  next();
};

export const verifyModerator = (req, res, next) => {
  const { accountType } = req.user;

  if (accountType !== 3 || accountType !== 2) {
    return res.status(403).json({ result: 'ERROR', message: 'Forbidden - Not a moderator' });
  }

  next();
};

export const verifyAdmin = (req, res, next) => {
  const { accountType } = req.user;

  if (accountType !== 3) {
    return res.status(403).json({ result: 'ERROR', message: 'Forbidden - Not an admin' });
  }

  next();
};
