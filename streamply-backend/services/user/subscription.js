// SECURITY: Prisma-based subscription management system
// Integrated with Stripe for secure payment processing

import prisma from '../prisma.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export async function setSubscription(username, status, providerId) {
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
    
    return { success: true };
  } catch (error) {
    console.error('Subscription update error:', error);
    return { error: error.message };
  }
}

export async function getSubscription(username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      include: { 
        subscription: true 
      }
    });
    
    if (!user || !user.subscription) {
      return { status: 'none' };
    }
    
    return user.subscription;
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return { status: 'none' };
  }
}

/**
 * Create a Stripe Checkout session for subscription
 */
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