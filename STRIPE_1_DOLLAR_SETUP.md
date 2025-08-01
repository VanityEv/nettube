# 🎯 STRIPE $1 SUBSCRIPTION SETUP GUIDE

## 📋 Quick Setup for Testing

To set up $1 monthly subscriptions in Stripe for easy testing:

### 1. **Create Products in Stripe Dashboard**

Visit [Stripe Dashboard → Products](https://dashboard.stripe.com/products) and create:

#### **Basic Plan**
- **Product Name**: StreamPly Basic
- **Pricing Model**: Recurring
- **Price**: $1.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) ➜ Update in `SubscriptionPage.tsx`

#### **Premium Plan**
- **Product Name**: StreamPly Premium  
- **Pricing Model**: Recurring
- **Price**: $1.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) ➜ Update in `SubscriptionPage.tsx`

### 2. **Update Frontend with Real Price IDs**

Replace the placeholder price IDs in:
```
streamply-frontend/src/pages/SubscriptionPage.tsx
```

Change:
```tsx
priceId: 'price_1QZCBh2NdrzPV1EzGkVXDGmV', // Replace with actual Basic plan ID
priceId: 'price_1QZCCl2NdrzPV1EzwZpQDctJ', // Replace with actual Premium plan ID
```

### 3. **Test Payment Flow**

1. **Start your application**
2. **Navigate to `/subscription`**
3. **Click "Subscribe with Stripe"**
4. **Use test card**: `4242 4242 4242 4242`
5. **Any future date for expiry**
6. **Any 3-digit CVC**

### 4. **Verify Subscription Works**

After payment:
- ✅ User should be redirected to success page
- ✅ Webhook should update subscription in database
- ✅ User should now have access to premium videos
- ✅ Check logs for subscription verification messages

### 5. **Test Access Control**

**Without Subscription:**
```
❌ Should see: "Active subscription required for premium content"
```

**With Active Subscription:**
```
✅ Should see: "Subscription verified successfully"
✅ Video player loads normally
```

## 🔧 **SUBSCRIPTION SYSTEM NOW ENABLED**

✅ **Payment verification**: ENABLED  
✅ **Video access control**: ENABLED  
✅ **Webhook processing**: ENABLED  
✅ **Security logging**: ENABLED  

## 💡 **Testing Tips**

- **Admin/Moderator accounts** (account_type 2 or 3) bypass subscription checks
- **Regular users** (account_type 1) need active subscriptions
- **Use Stripe test mode** for safe testing
- **Check browser console** for subscription status logs

---

**🚀 Your subscription system is now fully operational!**
