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
      where: { user_id: user.id },
      update: { 
        status: status, 
        stripe_customer_id: providerId, 
        updated_at: new Date() 
      },
      create: { 
        user_id: user.id, 
        status: status, 
        stripe_customer_id: providerId,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancel_at_period_end: false
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
    console.log('Processing webhook event:', event.type, 'ID:', event.id);
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle one-time payments
        const session = event.data.object;
        console.log('Checkout session completed:', session.id, 'Mode:', session.mode);
        if (session.mode === 'payment') {
          await handlePaymentSuccess(session);
        }
        break;
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
  // First find subscription by customer ID, then update by user_id
  const existingSub = await prisma.subscription.findFirst({
    where: { stripe_customer_id: stripeSubscription.customer }
  });
  
  if (existingSub) {
    await prisma.subscription.update({
      where: { user_id: existingSub.user_id },
      data: {
        status: stripeSubscription.status === 'active' ? 'active' : 'cancelled',
        updated_at: new Date()
      }
    });
  } else {
    // Create new subscription if not found
    await prisma.subscription.create({
      data: {
        user_id: stripeSubscription.client_reference_id,
        status: stripeSubscription.status === 'active' ? 'active' : 'cancelled',
        stripe_customer_id: stripeSubscription.customer,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancel_at_period_end: false
      }
    });
  }
}

async function cancelSubscriptionFromStripe(stripeSubscription) {
  await prisma.subscription.updateMany({
    where: { stripe_customer_id: stripeSubscription.customer },
    data: {
      status: 'cancelled',
      current_period_end: new Date(),
      updated_at: new Date()
    }
  });
}

async function handlePaymentSuccess(checkoutSession) {
  console.log('Processing one-time payment success:', checkoutSession.id);
  console.log('Session details:', JSON.stringify(checkoutSession, null, 2));
  
  try {
    // First try to get userId from client_reference_id (this is the user UUID)
    let userId = checkoutSession.client_reference_id;
    
    if (!userId) {
      // Fallback: Get customer details from Stripe for metadata
      const customer = await stripe.customers.retrieve(checkoutSession.customer);
      console.log('Customer metadata:', customer.metadata);
      userId = customer.metadata?.userId;
    }
    
    if (!userId) {
      console.error('No userId found in session client_reference_id or customer metadata');
      console.error('client_reference_id:', checkoutSession.client_reference_id);
      console.error('Available metadata keys:', Object.keys(customer?.metadata || {}));
      return;
    }

    console.log('Found userId:', userId);

    // Create or update subscription record for one-time payment
    const existingSubscription = await prisma.subscription.findUnique({
      where: { user_id: userId }
    });

    if (existingSubscription) {
      // Update existing subscription - one-time payment = lifetime access
      await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          status: 'active',
          updated_at: new Date(),
          current_period_end: new Date('2099-12-31T23:59:59.999Z'), // Far future date for lifetime access
          cancel_at_period_end: false
        }
      });
    } else {
      // Create new subscription for one-time payment - lifetime access
      await prisma.subscription.create({
        data: {
          status: 'active',
          stripe_customer_id: checkoutSession.customer,
          stripe_subscription_id: `payment_${checkoutSession.id}`, // Use payment session ID for one-time payments
          current_period_start: new Date(),
          current_period_end: new Date('2099-12-31T23:59:59.999Z'), // Far future date for lifetime access
          cancel_at_period_end: false,
          user: {
            connect: { id: userId }
          }
        }
      });
    }

    console.log(`Payment processed successfully for user ${userId}`);
    
  } catch (error) {
    console.error('Error processing payment success:', error);
    throw error;
  }
}
