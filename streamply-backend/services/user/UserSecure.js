// SECURITY: Prisma-based User service to replace vulnerable raw SQL queries
// This prevents SQL injection attacks through parameterized queries

import prisma from '../prisma.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// SECURE: All database operations now use Prisma ORM with parameterized queries

const createUser = async (userData, requestCallback) => {
  try {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        fullname: userData.fullname,
        password: userData.password,
        birthdate: new Date(userData.birthdate),
        email: userData.email,
        registerToken: userData.registerToken,
        confirmed: false,
        accountType: 1
      }
    });
    requestCallback(user);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const getAllUsers = async (requestCallback) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        lastLogin: true,
        accountType: true
      },
      orderBy: {
        lastLogin: 'desc'
      }
    });
    requestCallback(users);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const findOneUser = async (username, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username }
    });
    requestCallback(user ? [user] : []);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const findOneUserByEmail = async (email, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    requestCallback(user ? [user] : []);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const isUserInDB = async (username, email, requestCallback) => {
  try {
    const count = await prisma.user.count({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });
    requestCallback([{ count }]);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const confirmUser = async (token, requestCallback) => {
  try {
    const result = await prisma.user.updateMany({
      where: { registerToken: token },
      data: { confirmed: true }
    });
    requestCallback(result);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const updateUser = async (param, value, username, requestCallback) => {
  try {
    // Validate allowed parameters to prevent injection
    const allowedParams = ['fullname', 'birthdate', 'email'];
    if (!allowedParams.includes(param)) {
      throw new Error('Invalid parameter');
    }
    
    const updateData = { [param]: value };
    
    const result = await prisma.user.update({
      where: { username: username },
      data: updateData
    });
    requestCallback({ changedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const userLikes = async (username, requestCallback) => {
  try {
    const likes = await prisma.userLike.findMany({
      where: {
        user: { username: username }
      },
      select: {
        videoId: true
      }
    });
    const videoIds = likes.map(like => ({ video_id: like.videoId }));
    requestCallback(videoIds);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const checkOccurency = async (param, value, requestCallback) => {
  try {
    // Validate allowed parameters
    const allowedParams = ['username', 'email'];
    if (!allowedParams.includes(param)) {
      throw new Error('Invalid parameter');
    }
    
    const count = await prisma.user.count({
      where: { [param]: value }
    });
    requestCallback([{ exists: count }]);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const deleteLike = async (username, showId, requestCallback) => {
  try {
    const result = await prisma.userLike.deleteMany({
      where: {
        AND: [
          { user: { username: username } },
          { videoId: parseInt(showId) }
        ]
      }
    });
    requestCallback({ affectedRows: result.count });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const addLike = async (username, showId, requestCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const result = await prisma.userLike.create({
      data: {
        userId: user.id,
        videoId: parseInt(showId)
      }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const deleteUser = async (id, requestCallback) => {
  try {
    const result = await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const changePassword = async (username, password, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { username: username },
      data: { password: password }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const updateUserLoginDate = async (username, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { username: username },
      data: { lastLogin: new Date() }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const addPasswordResetToken = async (email, token, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { email: email },
      data: { resetToken: token }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const updatePassword = async (id, password, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: password }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const revokeToken = async (id, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { resetToken: null }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const promoteUser = async (id, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { accountType: 2 }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const demoteUser = async (id, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { accountType: 1 }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

// SECURE: Subscription management with Prisma
const setSubscription = async (username, status, providerId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: status,
        providerId: providerId,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        status: status,
        providerId: providerId
      }
    });
  } catch (error) {
    console.error('Error setting subscription:', error);
  }
};

const getSubscription = async (username) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      include: {
        subscriptions: true
      }
    });
    
    if (!user || !user.subscriptions) {
      return { status: 'none' };
    }
    
    return {
      status: user.subscriptions.status,
      providerId: user.subscriptions.providerId,
      updated: user.subscriptions.updatedAt
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { status: 'none' };
  }
};

// MFA (EMAIL OTP) PRODUCTION IMPLEMENTATION
const otpStore = new Map(); // In production, use Redis or DB

export async function sendOtpEmail(email, userId) {
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore.set(userId, { otp, expires });
  const transporter = nodemailer.createTransporter({
    service: 'SendGrid',
    auth: { user: process.env.SENDGRID_USER, pass: process.env.SENDGRID_PASS },
  });
  await transporter.sendMail({
    from: 'no-reply@streamply.com',
    to: email,
    subject: 'Your Streamply OTP',
    text: `Your one-time code: ${otp}`,
  });
}

export function verifyOtp(userId, code) {
  const entry = otpStore.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.expires) return false;
  if (entry.otp !== code) return false;
  otpStore.delete(userId);
  return true;
}

// STRIPE PRODUCTION INTEGRATION
export async function createStripeSession(userId, priceId) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.FRONTEND_URL + '/payment-success',
    cancel_url: process.env.FRONTEND_URL + '/payment-cancel',
    client_reference_id: userId,
  });
  return session.url;
}

export {
  createUser,
  getAllUsers,
  findOneUser,
  findOneUserByEmail,
  confirmUser,
  isUserInDB,
  updateUser,
  userLikes,
  checkOccurency,
  deleteLike,
  addLike,
  deleteUser,
  changePassword,
  updateUserLoginDate,
  addPasswordResetToken,
  updatePassword,
  revokeToken,
  promoteUser,
  demoteUser,
  setSubscription,
  getSubscription,
};
