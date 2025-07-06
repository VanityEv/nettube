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
 * @param {string} userId
 * @param {string} priceId
 * @returns {Promise<string>} sessionUrl
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

/**
 * Handle Stripe webhook events
 * @param {object} event Stripe webhook event
 */
export async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await updateSubscriptionFromStripe(subscription);
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await cancelSubscriptionFromStripe(deletedSubscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

async function updateSubscriptionFromStripe(stripeSubscription) {
  await prisma.subscription.upsert({
    where: { providerId: stripeSubscription.customer },
    update: {
      status: stripeSubscription.status === 'active' ? 'active' : 'cancelled',
      updatedAt: new Date()
    },
    create: {
      userId: parseInt(stripeSubscription.client_reference_id),
      status: stripeSubscription.status === 'active' ? 'active' : 'cancelled',
      providerId: stripeSubscription.customer,
      planType: stripeSubscription.items.data[0]?.price?.nickname || 'premium'
    }
  });
}

async function cancelSubscriptionFromStripe(stripeSubscription) {
  await prisma.subscription.updateMany({
    where: { providerId: stripeSubscription.customer },
    data: {
      status: 'cancelled',
      endDate: new Date(),
      updatedAt: new Date()
    }
  });
}
