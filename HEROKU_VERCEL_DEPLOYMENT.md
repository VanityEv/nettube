# 🚀 Streamply Production Deployment Guide

## Overview
This guide will deploy your secure Streamply platform to production using:
- **Backend**: Heroku (with PostgreSQL addon)
- **Frontend**: Vercel
- **Storage**: Backblaze B2
- **Payments**: Stripe
- **Logging**: MongoDB Atlas

## 📋 Prerequisites

### 1. Required Accounts
- [Heroku](https://signup.heroku.com/) account
- [Vercel](https://vercel.com/signup) account  
- [Stripe](https://dashboard.stripe.com/register) account
- [Backblaze B2](https://www.backblaze.com/b2/sign-up.html) account
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account

### 2. Install CLIs
```powershell
# Install Heroku CLI
winget install Heroku.HerokuCLI

# Install Vercel CLI
npm install -g vercel

# Install Git (if not already installed)
winget install Git.Git
```

## 🛠️ Backend Deployment (Heroku)

### Step 1: Prepare Heroku App
```powershell
# Navigate to backend directory
cd streamply-backend

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-streamply-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0
```

### Step 2: Configure Environment Variables
```powershell
# Set all required environment variables
heroku config:set JWT_SECRET="your-super-secure-256-bit-jwt-secret"
heroku config:set BCRYPT_ROUNDS=12
heroku config:set NODE_ENV=production

# Stripe configuration
heroku config:set STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email configuration
heroku config:set SENDGRID_API_KEY="SG.your_sendgrid_api_key"
heroku config:set FROM_EMAIL="noreply@yourdomain.com"

# Storage configuration
heroku config:set B2_KEY_ID="your_b2_key_id"
heroku config:set B2_APPLICATION_KEY="your_b2_application_key"
heroku config:set B2_BUCKET_NAME="streamply-videos-prod"
heroku config:set B2_BUCKET_ID="your_bucket_id"

# Frontend URL (update after Vercel deployment)
heroku config:set FRONTEND_URL="https://your-streamply.vercel.app"
heroku config:set CORS_ORIGIN="https://your-streamply.vercel.app"

# Logging configuration
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/streamply_logs?retryWrites=true&w=majority"
```

### Step 3: Deploy to Heroku
```powershell
# Initialize git repository
git init
git add .
git commit -m "Initial secure backend deployment"

# Add Heroku remote
heroku git:remote -a your-streamply-backend

# Deploy
git push heroku main

# Run database migration
heroku run npx prisma migrate deploy

# Check logs
heroku logs --tail
```

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Environment Variables
Create `.env.production` in `streamply-frontend/`:
```env
REACT_APP_BACKEND_URL=https://your-streamply-backend.herokuapp.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_ENVIRONMENT=production
```

### Step 2: Deploy to Vercel
```powershell
# Navigate to frontend directory
cd ../streamply-frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Set production environment variables in Vercel dashboard
# Or via CLI:
vercel env add REACT_APP_BACKEND_URL production
vercel env add REACT_APP_STRIPE_PUBLISHABLE_KEY production
```

## 🔧 Post-Deployment Configuration

### 1. Update Heroku Backend with Frontend URL
```powershell
# Update CORS settings with actual Vercel URL
heroku config:set FRONTEND_URL="https://your-actual-vercel-url.vercel.app"
heroku config:set CORS_ORIGIN="https://your-actual-vercel-url.vercel.app"
```

### 2. Configure Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create new webhook endpoint: `https://your-streamply-backend.herokuapp.com/api/stripe/webhook`
3. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret and update Heroku config

### 3. Set up Backblaze B2 CORS
Configure B2 bucket CORS settings:
```json
[
  {
    "corsRuleName": "streamply-cors",
    "allowedOrigins": ["https://your-vercel-url.vercel.app"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["b2_download_file_by_id", "b2_download_file_by_name"],
    "maxAgeSeconds": 3600
  }
]
```

## 🔍 Testing & Validation

### 1. Backend Health Check
```bash
curl https://your-streamply-backend.herokuapp.com/health
```

### 2. Database Connection Test
```powershell
heroku run npx prisma db seed
```

### 3. Security Validation
- [ ] SSL certificates active (both Heroku and Vercel auto-provision)
- [ ] Environment variables properly set
- [ ] Database migrations successful
- [ ] Stripe webhooks responding
- [ ] CORS configured correctly

## 🚨 Security Checklist

### Before Going Live:
- [ ] All environment variables use production values
- [ ] JWT secret is 256+ bits and randomly generated
- [ ] Database has proper user permissions
- [ ] Stripe is in live mode with real keys
- [ ] B2 bucket permissions are restricted
- [ ] MongoDB Atlas has IP restrictions enabled
- [ ] All admin accounts use strong passwords
- [ ] Rate limiting is enabled
- [ ] Security headers are configured

### Monitoring Setup:
- [ ] Heroku metrics dashboard configured
- [ ] Error tracking (Sentry) integrated
- [ ] Performance monitoring enabled
- [ ] Security event logging active
- [ ] Backup strategy implemented

## 📊 Performance Optimization

### Heroku Optimizations:
```powershell
# Scale dynos for production
heroku ps:scale web=2

# Enable connection pooling
heroku config:set DATABASE_CONNECTION_POOL_SIZE=20
```

### Vercel Optimizations:
- Enable Edge Functions for better global performance
- Configure proper caching headers
- Optimize bundle size with code splitting

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions for Automated Deployment:
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-streamply-backend"
          heroku_email: "your-email@example.com"
          appdir: "streamply-backend"
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          working-directory: streamply-frontend
```

## 🆘 Troubleshooting

### Common Issues:

**Database Connection Errors:**
```powershell
heroku pg:info
heroku logs --source app --dyno web
```

**Build Failures:**
```powershell
heroku builds
heroku logs --source build
```

**Environment Variable Issues:**
```powershell
heroku config
heroku config:unset VARIABLE_NAME
```

## 📞 Support & Resources

- [Heroku Documentation](https://devcenter.heroku.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Stripe Integration Guide](https://stripe.com/docs/webhooks)

---

🎉 **Congratulations!** Your secure Streamply platform is now deployed to production with enterprise-grade security measures.
