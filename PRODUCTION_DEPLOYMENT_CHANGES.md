# 🚀 PRODUCTION DEPLOYMENT CHANGES REQUIRED

## ✅ CHANGES NEEDED FOR HEROKU + VERCEL DEPLOYMENT

### **1. Frontend Changes (Vercel)**

#### **Update Frontend Environment Variables**
Create `.env.production.local` for Vercel deployment:

```bash
# =============================================================================
# VERCEL PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================

# DISABLE PROXY MODE for direct Heroku backend connection
REACT_APP_USE_PROXY=false

# BACKEND API (Replace with your actual Heroku app URL)
REACT_APP_BACKEND_URL=https://your-streamply-backend.herokuapp.com
REACT_APP_API_URL=https://your-streamply-backend.herokuapp.com

# STRIPE CONFIGURATION (Use your live keys for production)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key

# ENVIRONMENT
REACT_APP_NODE_ENV=production

# SECURITY & ANTI-PIRACY
REACT_APP_ENABLE_ANTI_PIRACY=true
REACT_APP_WATERMARK_ENABLED=true
REACT_APP_ENABLE_DEVICE_FINGERPRINTING=true

# VIDEO PLAYER SETTINGS
REACT_APP_DEFAULT_VIDEO_QUALITY=720p
REACT_APP_ENABLE_AUTO_QUALITY=true
REACT_APP_ENABLE_HLS=true

# BUILD OPTIMIZATION
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false

# ANALYTICS (Optional - Add your actual IDs)
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
REACT_APP_SENTRY_DSN=your_actual_sentry_dsn_here

# DEBUG (disable in production)
REACT_APP_DEBUG=false
```

### **2. Backend Changes (Heroku)**

#### **Heroku Config Vars (Set via CLI or Dashboard)**
```bash
# REQUIRED: Set these in your Heroku app config
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secure-256-bit-jwt-secret-key
heroku config:set BCRYPT_ROUNDS=12

# STRIPE (Use your actual live keys)
heroku config:set STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# EMAIL
heroku config:set SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
heroku config:set FROM_EMAIL=noreply@yourdomain.com

# BACKBLAZE B2 (Use your actual production credentials)
heroku config:set B2_APPLICATION_KEY_ID=your_actual_b2_key_id
heroku config:set B2_APPLICATION_KEY=your_actual_b2_application_key
heroku config:set B2_BUCKET_NAME=streamply-videos-prod
heroku config:set B2_BUCKET_ID=your_actual_bucket_id

# FRONTEND (Replace with your actual Vercel URL)
heroku config:set FRONTEND_URL=https://your-streamply-app.vercel.app
heroku config:set CORS_ORIGIN=https://your-streamply-app.vercel.app

# DATABASE - Will be automatically set by Heroku PostgreSQL addon
# DATABASE_URL=postgres://... (automatically managed)
```

### **3. Backend Code Changes**

#### **Update CORS Configuration**
The backend needs to allow your Vercel domain. Update `streamply-backend/services/video/VideoRouter.js`:

```javascript
// CORS whitelist - ADD YOUR VERCEL DOMAIN
const allowedOrigins = [
  'https://your-streamply-app.vercel.app',  // Your actual Vercel URL
  'https://your-admin-panel.vercel.app',   // If you have an admin panel
  'http://localhost:3000',                 // For local development
];
```

#### **Update User Router CORS**
Update `streamply-backend/services/user/UserRouter.js` and `streamply-backend/services/review/ReviewRouter.js` similarly.

### **4. Database Setup**

#### **Heroku PostgreSQL Addon**
```bash
# Add PostgreSQL addon to your Heroku app
heroku addons:create heroku-postgresql:essential-0

# Get database URL (automatically set as DATABASE_URL)
heroku config:get DATABASE_URL
```

#### **Run Database Migrations**
```bash
# Connect to Heroku PostgreSQL and run your schema
heroku pg:psql < streamply-backend/streamply-postgres.sql
```

### **5. MongoDB Setup (for Security Logging)**

#### **MongoDB Atlas Setup**
1. Create MongoDB Atlas cluster (free tier available)
2. Get connection string
3. Set Heroku config:
```bash
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamply_logs
```

### **6. Redis Setup (for Sessions/Caching)**

#### **Heroku Redis Addon**
```bash
# Add Redis addon
heroku addons:create heroku-redis:mini

# Redis URL will be automatically set as REDIS_URL
```

### **7. Build and Deployment Scripts**

#### **Frontend Package.json Scripts**
Ensure your `streamply-frontend/package.json` has:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "npm run build"
  }
}
```

#### **Backend Package.json Scripts**
Ensure your `streamply-backend/package.json` has:
```json
{
  "scripts": {
    "start": "node index.js",
    "heroku-postbuild": "npm run build"
  }
}
```

### **8. Security Updates for Production**

#### **Environment-Specific Features**
Update your backend to disable development features:
- Disable B2 development mode
- Enable production logging
- Use production database connections
- Enable all security middleware

### **9. Deployment Commands**

#### **Deploy Backend to Heroku**
```bash
# Navigate to backend directory
cd streamply-backend

# Initialize git if not already done
git init
heroku create your-streamply-backend

# Add buildpack for FFmpeg
heroku buildpacks:add --index 1 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git

# Set config vars (see section 2 above)
# Deploy
git add .
git commit -m "Production deployment"
git push heroku main
```

#### **Deploy Frontend to Vercel**
```bash
# Navigate to frontend directory
cd streamply-frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
# Follow prompts and link to your project
```

### **10. DNS and Domain Setup**

#### **Custom Domains (Optional)**
```bash
# Heroku custom domain
heroku domains:add api.yourdomain.com

# Vercel custom domain
vercel domains add yourdomain.com
```

## ⚠️ **CRITICAL CHANGES SUMMARY**

1. **Frontend**: Disable proxy mode (`REACT_APP_USE_PROXY=false`)
2. **Frontend**: Set correct Heroku backend URL
3. **Backend**: Update CORS to allow Vercel domain
4. **Backend**: Set all production environment variables
5. **Database**: Set up Heroku PostgreSQL, MongoDB Atlas, Redis
6. **Security**: Use production API keys (Stripe, SendGrid, B2)
7. **Build**: Add FFmpeg buildpack to Heroku
8. **Monitoring**: Configure production logging and error tracking

## 🔧 **NEXT STEPS**

1. Set up production accounts (Stripe, SendGrid, B2, MongoDB Atlas)
2. Update all placeholder URLs with actual deployment URLs
3. Test the deployment thoroughly
4. Set up monitoring and logging
5. Configure custom domains if needed

**Status**: Ready for production deployment with these changes applied!
