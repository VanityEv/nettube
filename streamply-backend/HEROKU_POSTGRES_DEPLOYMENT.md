# 🚀 Deploy PostgreSQL Database to Heroku - StreamPly Guide

## Overview
You'll migrate your local `streamply_dev` database to Heroku Postgres, which provides a managed PostgreSQL service.

## Prerequisites
- ✅ Heroku CLI installed
- ✅ Heroku account created
- ✅ Local PostgreSQL database working
- ✅ Your StreamPly app ready for deployment

## Step 1: Install Heroku CLI (if not installed)

### Windows:
```powershell
# Download from: https://devcenter.heroku.com/articles/heroku-cli
# Or use Chocolatey:
choco install heroku-cli
```

### Verify Installation:
```bash
heroku --version
heroku login
```

## Step 2: Create Heroku App & Add PostgreSQL

```bash
# Navigate to your backend directory
cd streamply-backend

# Create Heroku app (replace 'your-app-name' with your desired name)
heroku create streamply-backend-prod

# Add PostgreSQL addon (free tier)
heroku addons:create heroku-postgresql:mini --app streamply-backend-prod

# Check addon status
heroku addons --app streamply-backend-prod
```

## Step 3: Get Database Connection Info

```bash
# Get database URL
heroku config:get DATABASE_URL --app streamply-backend-prod

# Get detailed connection info
heroku pg:info --app streamply-backend-prod

# Access database credentials
heroku pg:credentials:url --app streamply-backend-prod
```

## Step 4: Export Your Local Database

### Method A: Using pg_dump (Recommended)
```bash
# Export your local database to SQL file
pg_dump -U streamply_user -h localhost -d streamply_dev --no-owner --no-privileges > streamply_backup.sql

# Alternative: Include data
pg_dump -U streamply_user -h localhost -d streamply_dev --data-only --no-owner --no-privileges > streamply_data.sql
```

### Method B: Using Prisma (Schema only)
```bash
# Generate SQL from Prisma schema
npx prisma migrate dev --create-only --name initial_deploy
npx prisma db push
```

## Step 5: Import to Heroku Database

### Method A: Direct restore
```bash
# Get Heroku database URL
heroku config:get DATABASE_URL --app streamply-backend-prod

# Import to Heroku (replace DATABASE_URL with actual URL)
psql "YOUR_HEROKU_DATABASE_URL" < streamply_backup.sql
```

### Method B: Using Heroku CLI
```bash
# Reset Heroku database (if needed)
heroku pg:reset --app streamply-backend-prod --confirm streamply-backend-prod

# Import backup
heroku pg:psql --app streamply-backend-prod < streamply_backup.sql
```

### Method C: Using Prisma Migration
```bash
# Set Heroku database URL temporarily
export DATABASE_URL="YOUR_HEROKU_DATABASE_URL"

# Run Prisma migrations
npx prisma migrate deploy

# Seed data (if you have seed scripts)
npx prisma db seed
```

## Step 6: Update Environment Variables

```bash
# Set production environment variables
heroku config:set NODE_ENV=production --app streamply-backend-prod
heroku config:set JWT_SECRET="8d0897b0cdf001d20843e82cd50fe34400f554668d7a58d64179fc0a7c6f5315bcba557fe133caa5952b708a436cf4b5971717df90774fad89f4204188182acd" --app streamply-backend-prod

# Email configuration (use SendGrid for production)
heroku config:set SENDGRID_API_KEY="SG.your-actual-api-key" --app streamply-backend-prod
heroku config:set SENDGRID_FROM_EMAIL="noreply@streamply.com" --app streamply-backend-prod
heroku config:set SENDGRID_FROM_NAME="StreamPly" --app streamply-backend-prod

# Stripe configuration
heroku config:set STRIPE_SECRET_KEY="sk_live_your_live_key" --app streamply-backend-prod
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key" --app streamply-backend-prod
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" --app streamply-backend-prod

# B2 Storage configuration
heroku config:set B2_APPLICATION_KEY_ID="00314d6eb331d1b0000000001" --app streamply-backend-prod
heroku config:set B2_APPLICATION_KEY="K003pDl+XIgBMNnoSP6anP3hvwGDkUM" --app streamply-backend-prod
heroku config:set B2_BUCKET_NAME="streamply-bucket-prod" --app streamply-backend-prod
heroku config:set B2_BUCKET_ID="61e4fd069e9b5323918d011b"  --app streamply-backend-prod
heroku config:set B2_DOWNLOAD_URL="https://f000.backblazeb2.com" --app streamply-backend-prod

# Frontend URL (update after deploying frontend)
heroku config:set FRONTEND_URL="https://your-vercel-app.vercel.app" --app streamply-backend-prod
heroku config:set CORS_ORIGIN="https://your-vercel-app.vercel.app" --app streamply-backend-prod

# Check all config vars
heroku config --app streamply-backend-prod
```

## Step 7: Prepare Your App for Deployment

### Create Procfile
```bash
# In your streamply-backend directory
echo "web: node index.js" > Procfile
```

### Update package.json
```json
{
  "scripts": {
    "start": "node index.js",
    "build": "echo 'No build step needed'",
    "postinstall": "npx prisma generate"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Create .slugignore (optional)
```bash
# Create .slugignore to exclude unnecessary files
cat > .slugignore << EOF
*.md
.git/
test/
docs/
*.test.js
.env.example
EOF
```

## Step 8: Deploy to Heroku

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit for Heroku deployment"

# Add Heroku remote
heroku git:remote -a streamply-backend-prod

# Deploy
git push heroku main

# Check deployment status
heroku logs --tail --app streamply-backend-prod
```

## Step 9: Run Database Migrations & Setup

```bash
# Run Prisma migrations on Heroku
heroku run npx prisma migrate deploy --app streamply-backend-prod

# Generate Prisma client
heroku run npx prisma generate --app streamply-backend-prod

# Apply our video statistics triggers
heroku pg:psql --app streamply-backend-prod < simple-video-triggers.sql

# Verify database structure
heroku pg:psql --app streamply-backend-prod --command "\dt"
```

## Step 10: Test Your Deployment

```bash
# Check app status
heroku ps --app streamply-backend-prod

# Open app in browser
heroku open --app streamply-backend-prod

# Check logs
heroku logs --tail --app streamply-backend-prod

# Test database connection
heroku run node -e "
import('./services/prisma.js').then(async (prisma) => {
  const count = await prisma.default.video.count();
  console.log('Videos in database:', count);
  process.exit(0);
});
" --app streamply-backend-prod
```

## Troubleshooting

### Common Issues:

**1. Database Connection Errors**
```bash
# Check database status
heroku pg:info --app streamply-backend-prod

# Reset database if corrupted
heroku pg:reset --app streamply-backend-prod --confirm streamply-backend-prod
```

**2. Environment Variables**
```bash
# List all config vars
heroku config --app streamply-backend-prod

# Update specific variable
heroku config:set VARIABLE_NAME="new_value" --app streamply-backend-prod
```

**3. Build Failures**
```bash
# Check build logs
heroku logs --source=app --app streamply-backend-prod

# Restart app
heroku restart --app streamply-backend-prod
```

**4. Prisma Issues**
```bash
# Regenerate Prisma client
heroku run npx prisma generate --app streamply-backend-prod

# Reset and migrate
heroku run npx prisma migrate reset --force --app streamply-backend-prod
```

## Database Backup & Maintenance

### Regular Backups
```bash
# Create backup
heroku pg:backups:capture --app streamply-backend-prod

# List backups
heroku pg:backups --app streamply-backend-prod

# Download backup
heroku pg:backups:download --app streamply-backend-prod
```

### Monitoring
```bash
# Monitor database performance
heroku pg:stats --app streamply-backend-prod

# Check connection count
heroku pg:info --app streamply-backend-prod
```

## Heroku Postgres Pricing

- **Mini Plan**: Free (10,000 rows, 1GB storage)
- **Basic Plan**: $9/month (10M rows, 20GB storage)
- **Standard Plans**: $50-$400/month (higher limits)

## Security Best Practices

1. **Use environment variables** for all secrets
2. **Enable SSL** (Heroku Postgres includes SSL by default)
3. **Regular backups** (automated with paid plans)
4. **Monitor access logs**
5. **Use connection pooling** for high traffic

Your StreamPly database will be production-ready on Heroku! 🚀
