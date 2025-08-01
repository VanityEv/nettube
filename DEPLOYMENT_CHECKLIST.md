# 🚀 STREAMPLY PRODUCTION DEPLOYMENT CHECKLIST

## ✅ CRITICAL CHANGES FOR PRODUCTION

### **Architecture Change:**
- **Current (Docker):** Frontend → NGINX Proxy → Backend
- **Production:** Frontend (Vercel) → Backend (Heroku)

### **Key Configuration Changes:**
1. **Frontend:** `REACT_APP_USE_PROXY=false` (disables NGINX proxy)
2. **Frontend:** `REACT_APP_BACKEND_URL=https://your-app.herokuapp.com`
3. **Backend:** Update CORS to allow Vercel domain
4. **Backend:** Use production environment variables

---

## 📋 PRE-DEPLOYMENT SETUP

### 1. Set Up Production Accounts
- [ ] **Stripe** - Get live API keys (sk_live_... and pk_live_...)
- [ ] **SendGrid** - Get API key for email sending
- [ ] **Backblaze B2** - Set up production bucket for video storage
- [ ] **MongoDB Atlas** - Create database cluster (free tier available)

### 2. CLI Tools (✅ COMPLETED)
- [x] Heroku CLI installed
- [x] Vercel CLI installed

### 3. Prepare Configuration Files
- [ ] Update `heroku-setup.ps1` with your real credentials
- [ ] Update `.env.production.vercel` with your real values

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Backend to Heroku

```powershell
# Navigate to backend directory
cd streamply-backend

# Login to Heroku
heroku login

# Create Heroku app (replace with your desired name)
heroku create your-streamply-backend

# Add FFmpeg buildpack for video processing
heroku buildpacks:add --index 1 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
heroku buildpacks:add --index 2 heroku/nodejs

# Add database addons
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini

# Set environment variables (update heroku-setup.ps1 first!)
# Run your updated heroku-setup.ps1 commands

# Initialize git and deploy
git init
git add .
git commit -m "Initial Heroku deployment"
heroku git:remote -a your-streamply-backend
git push heroku main
```

### Step 2: Deploy Frontend to Vercel

```powershell
# Navigate to frontend directory
cd streamply-frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to link/create project
```

### Step 3: Configure Environment Variables

#### Heroku Config Vars
Update `heroku-setup.ps1` with your real values and run the commands.

#### Vercel Environment Variables
Go to your Vercel project dashboard → Settings → Environment Variables
Add all variables from `.env.production.vercel`

---

## 🔧 CODE CHANGES NEEDED

### ✅ Backend Updates (COMPLETED)
✅ **streamply-backend/index.js** - Added production CORS configuration  
✅ **streamply-backend/services/user/UserRouter.js** - Added CORS and security middleware  
✅ **streamply-backend/services/video/VideoRouter.js** - Already updated with CORS  
✅ **streamply-backend/services/review/ReviewRouter.js** - Added CORS and security middleware  
✅ **streamply-backend/package.json** - Removed yarn reference, npm optimized  

### ✅ Frontend Updates (COMPLETED)
✅ **streamply-frontend/src/constants.ts** - Enhanced environment detection  
✅ **streamply-frontend/vercel.json** - Vercel deployment configuration  

### Production CORS Configuration
All backend routers now use this configuration:
```javascript
const allowedOrigins = [
  'https://your-vercel-app.vercel.app',  // Your actual Vercel URL
  'https://your-admin-panel.vercel.app', // Admin panel if separate
  'http://localhost:3000',               // For development
  'http://localhost',                    // For Docker development
];
```

**⚠️ IMPORTANT:** Replace `your-vercel-app` with your actual Vercel domain!

---

## 🧪 TESTING CHECKLIST

### After Deployment
- [ ] Frontend loads at your Vercel URL
- [ ] Backend API responds at your Heroku URL
- [ ] User registration/login works
- [ ] Video upload functionality works
- [ ] Video streaming works
- [ ] Payment flow works (if implemented)

### Test URLs
- Frontend: `https://your-vercel-app.vercel.app`
- Backend: `https://your-streamply-backend.herokuapp.com`
- API Test: `https://your-streamply-backend.herokuapp.com/videos/all`

---

## 🔒 SECURITY CONSIDERATIONS

### Production API Keys
- [ ] Use Stripe **live** keys (not test keys)
- [ ] Use production B2 bucket (not development)
- [ ] Use strong JWT secret (256-bit minimum)
- [ ] Use production MongoDB database
- [ ] Use production SendGrid account

### CORS Configuration
- [ ] Only allow your actual Vercel domain
- [ ] Remove localhost from production CORS (optional)

---

## 📋 POST-DEPLOYMENT

### 1. Configure Webhooks
- [ ] **Stripe Webhook URL:** `https://your-streamply-backend.herokuapp.com/user/stripe/webhook`

### 2. Custom Domains (Optional)
```bash
# Heroku custom domain
heroku domains:add api.yourdomain.com

# Vercel custom domain  
vercel domains add yourdomain.com
```

### 3. Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor performance (Heroku metrics, Vercel analytics)
- [ ] Set up uptime monitoring

---

## 🆘 TROUBLESHOOTING

### Common Issues
1. **CORS errors** → Update backend allowedOrigins
2. **API not found** → Check REACT_APP_BACKEND_URL
3. **Build failures** → Check environment variables
4. **Database errors** → Verify DATABASE_URL and run migrations

### Useful Commands
```bash
# Check Heroku logs
heroku logs --tail -a your-app-name

# Check Heroku config
heroku config -a your-app-name

# Restart Heroku app
heroku restart -a your-app-name

# Check Vercel deployments
vercel ls
```

---

## 🎯 SUMMARY

**What Changes for Production:**
1. Frontend connects directly to Heroku (no NGINX proxy)
2. All environment variables use production values
3. CORS allows your Vercel domain
4. Database, Redis, and MongoDB are cloud-hosted

**Deployment Flow:**
1. Deploy backend to Heroku with FFmpeg buildpack
2. Deploy frontend to Vercel with production env vars
3. Test end-to-end functionality
4. Configure webhooks and monitoring

**Ready to deploy?** ✅ CLIs installed, configuration files created!

---

*Last updated: July 6, 2025*
