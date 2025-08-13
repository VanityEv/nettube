// SECURITY: Prisma-based User service to replace vulnerable raw SQL queries
// This prevents SQL injection attacks through parameterized queries

import prisma from '../prisma.js';
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
        register_token: userData.registerToken,
        stripe_customer_id: userData.stripe_customer_id,
        confirmed: false,
        account_type: 1
      }
    });
    requestCallback(user);
  } catch (error) {
    console.error('Database error in createUser:', error);
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
        last_login: true,
        account_type: true
      },
      orderBy: {
        last_login: 'desc'
      }
    });
    requestCallback(users);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const findOneUser = async (username, requestCallback) => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });
    requestCallback(user ? [user] : []);
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const findOneUserByEmail = async (email, requestCallback) => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
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
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } }
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
    console.log('Attempting to confirm user with token:', token);
    const result = await prisma.user.updateMany({
      where: { register_token: token },
      data: { confirmed: true }
    });
    console.log('Confirmation result:', result);
    requestCallback(result);
  } catch (error) {
    console.error('Database error in confirmUser:', error);
    requestCallback({ error: error.message });
  }
};

const updateUser = async (param, value, username, requestCallback) => {
  try {
    // Validate allowed parameters to prevent injection
    const allowedParams = ['fullname', 'birthdate', 'email', 'avatar_url'];
    if (!allowedParams.includes(param)) {
      throw new Error('Invalid parameter');
    }
    
    const updateData = { [param]: value };
    
    const result = await prisma.user.update({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
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
        user: { 
          username: {
            equals: username,
            mode: 'insensitive'
          }
        }
      },
      select: {
        video_id: true
      }
    });
    const videoIds = likes.map(like => ({ video_id: like.video_id }));
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
    
    const whereClause = param === 'username' || param === 'email' 
      ? { [param]: { equals: value, mode: 'insensitive' } }
      : { [param]: value };
    
    const count = await prisma.user.count({
      where: whereClause
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
          { user: { 
            username: {
              equals: username,
              mode: 'insensitive'
            }
          }},
          { video_id: showId }
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
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const result = await prisma.userLike.create({
      data: {
        user_id: user.id,
        video_id: showId
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
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      data: { password: password }
    });
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const updateUserLoginDate = async (username, requestCallback) => {
  try {
    // First find the user with case-insensitive search
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });
    
    if (!user) {
      requestCallback({ error: 'User not found' });
      return;
    }
    
    // Then update using the exact username
    const result = await prisma.user.update({
      where: { id: user.id },  // Use ID for update
      data: { last_login: new Date() }
    });
    
    requestCallback({ affectedRows: 1 });
  } catch (error) {
    requestCallback({ error: error.message });
  }
};

const addPasswordResetToken = async (email, token, requestCallback) => {
  try {
    const result = await prisma.user.update({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
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
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
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
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });
    
    if (!user) {
      return { status: 'none' };
    }
    
    // Check account type for subscription status
    // Assuming: 1 = free, 2 = premium, 3 = admin
    const accountTypeToSubscription = {
      1: { status: 'free', plan: 'free' },
      2: { status: 'active', plan: 'premium' },
      3: { status: 'active', plan: 'admin' }
    };
    
    return accountTypeToSubscription[user.account_type] || { status: 'none' };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { status: 'none', error: error.message };
  }
};

// STRIPE PRODUCTION INTEGRATION
export async function createStripeSession(userId, priceId) {
  try {
    console.log('Creating Stripe session with:', { userId, priceId });
    console.log('Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Frontend URL:', process.env.FRONTEND_URL);
    
    // Get user from database by ID (userId is a UUID string)
    const user = await prisma.user.findUnique({
      where: { id: userId }  // Use userId directly as string/UUID
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    let customerId = user.stripe_customer_id;
    
    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      console.log('Creating new Stripe customer for user:', userId);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          username: user.username
        }
      });
      
      customerId = customer.id;
      
      // Update user with the new Stripe customer ID
      await prisma.user.update({
        where: { id: userId },  // Use userId directly
        data: { stripe_customer_id: customerId }
      });
      
      console.log('Created Stripe customer:', customerId);
    } else {
      console.log('Using existing Stripe customer:', customerId);
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment instead of subscription
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_URL + '/payment-success',
      cancel_url: process.env.FRONTEND_URL + '/payment-cancel',
      client_reference_id: user.id,
    });
    
    console.log('Stripe session created successfully:', session.id);
    return session.url;
  } catch (error) {
    console.error('Stripe session creation failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
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
