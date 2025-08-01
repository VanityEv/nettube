# =============================================================================
# HEROKU CONFIG VARS SETUP
# Run these commands after creating your Heroku app
# =============================================================================

# Replace 'your-app-name' with your actual Heroku app name
$APP_NAME = "your-app-name"

# CORE SETTINGS
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set BCRYPT_ROUNDS=12 --app $APP_NAME

# SECURITY (Generate a strong JWT secret)
heroku config:set JWT_SECRET="your-super-secure-256-bit-jwt-secret-key" --app $APP_NAME

# STRIPE (Replace with your actual live keys)
heroku config:set STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key" --app $APP_NAME
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key" --app $APP_NAME
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" --app $APP_NAME

# EMAIL (SendGrid)
heroku config:set SENDGRID_API_KEY="SG.your_sendgrid_api_key" --app $APP_NAME
heroku config:set FROM_EMAIL="noreply@yourdomain.com" --app $APP_NAME

# BACKBLAZE B2 (Replace with your actual production credentials)
heroku config:set B2_APPLICATION_KEY_ID="your_actual_b2_key_id" --app $APP_NAME
heroku config:set B2_APPLICATION_KEY="your_actual_b2_application_key" --app $APP_NAME
heroku config:set B2_BUCKET_NAME="streamply-videos-prod" --app $APP_NAME
heroku config:set B2_BUCKET_ID="your_actual_b2_bucket_id" --app $APP_NAME

# FRONTEND URL (Replace with your Vercel domain)
heroku config:set FRONTEND_URL="https://your-vercel-app.vercel.app" --app $APP_NAME
heroku config:set CORS_ORIGIN="https://your-vercel-app.vercel.app" --app $APP_NAME

# MONGODB (MongoDB Atlas connection string)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/streamply_logs" --app $APP_NAME

# DATABASE_URL and REDIS_URL will be automatically set by Heroku addons
