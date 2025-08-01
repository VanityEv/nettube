#!/bin/bash

# Streamply Quick Deployment Script
# Run this script to deploy everything in one go

set -e  # Exit on any error

echo "🚀 Streamply Production Deployment Starting..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEROKU_APP_NAME="streamply-backend-prod"
FRONTEND_DOMAIN="your-streamply-app.vercel.app"
MAIN_DOMAIN="streamply.yourdomain.com"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Backend (Heroku): $HEROKU_APP_NAME"
echo "  Frontend (Vercel): $FRONTEND_DOMAIN"
echo "  Main Domain: $MAIN_DOMAIN"
echo ""

# Step 1: Deploy Backend to Heroku
echo -e "${YELLOW}🔧 Step 1: Deploying Backend to Heroku...${NC}"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI not found. Please install it first.${NC}"
    exit 1
fi

# Login to Heroku
echo "Logging into Heroku..."
heroku auth:whoami || heroku login

# Create Heroku app if it doesn't exist
if ! heroku apps:info $HEROKU_APP_NAME &> /dev/null; then
    echo "Creating Heroku app: $HEROKU_APP_NAME"
    heroku create $HEROKU_APP_NAME
else
    echo "Heroku app $HEROKU_APP_NAME already exists"
fi

# Add PostgreSQL addon
echo "Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:mini -a $HEROKU_APP_NAME || echo "PostgreSQL addon already exists"

# Set environment variables
echo "Setting environment variables..."
heroku config:set NODE_ENV=production -a $HEROKU_APP_NAME
heroku config:set JWT_SECRET=$(openssl rand -base64 64) -a $HEROKU_APP_NAME
heroku config:set FRONTEND_URL=https://$FRONTEND_DOMAIN -a $HEROKU_APP_NAME

echo -e "${YELLOW}⚠️  Please set these environment variables manually:${NC}"
echo "  BACKBLAZE_APPLICATION_KEY_ID"
echo "  BACKBLAZE_APPLICATION_KEY"
echo "  BACKBLAZE_BUCKET_NAME"
echo "  SENDGRID_API_KEY"
echo "  STRIPE_SECRET_KEY"
echo "  STRIPE_WEBHOOK_SECRET"
echo ""
read -p "Press Enter when you've set all environment variables in Heroku dashboard..."

# Deploy to Heroku
cd streamply-backend
echo "Deploying backend..."

# Add Heroku git remote
heroku git:remote -a $HEROKU_APP_NAME || echo "Remote already exists"

# Deploy
git add .
git commit -m "Production deployment $(date)" || echo "No changes to commit"
git push heroku HEAD:main

# Run database migrations
echo "Running database migrations..."
heroku run npx prisma migrate deploy -a $HEROKU_APP_NAME
heroku run npx prisma generate -a $HEROKU_APP_NAME

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
cd ..

# Step 2: Update Frontend Environment Variables
echo -e "${YELLOW}🔧 Step 2: Updating Frontend Environment Variables...${NC}"

cd streamply-frontend

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "Setting Vercel environment variables..."
    vercel env add VITE_API_URL production || echo "VITE_API_URL already exists"
    # You'll need to enter: https://$HEROKU_APP_NAME.herokuapp.com
    
    vercel env add VITE_STRIPE_PUBLISHABLE_KEY production || echo "VITE_STRIPE_PUBLISHABLE_KEY already exists"
    # You'll need to enter your Stripe publishable key
    
    echo "Redeploying frontend..."
    vercel --prod
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Please update environment variables manually:${NC}"
    echo "  1. Go to https://vercel.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Go to Settings → Environment Variables"
    echo "  4. Add/Update:"
    echo "     - VITE_API_URL = https://$HEROKU_APP_NAME.herokuapp.com"
    echo "     - VITE_STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key"
    echo "  5. Redeploy the project"
fi

echo -e "${GREEN}✅ Frontend configuration updated!${NC}"
cd ..

# Step 3: Generate Nginx Configuration
echo -e "${YELLOW}🔧 Step 3: Generating Nginx Configuration...${NC}"

cat > nginx-streamply.conf << EOF
# Streamply Nginx Configuration
# Copy this to /etc/nginx/sites-available/streamply

upstream streamply_backend {
    server $HEROKU_APP_NAME.herokuapp.com:443;
    keepalive 32;
}

upstream streamply_frontend {
    server $FRONTEND_DOMAIN:443;
    keepalive 32;
}

server {
    listen 80;
    server_name $MAIN_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $MAIN_DOMAIN;
    
    # SSL Configuration (update paths after getting certificates)
    ssl_certificate /etc/letsencrypt/live/$MAIN_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$MAIN_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;
    
    # API Backend Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass https://streamply_backend/;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host $HEROKU_APP_NAME.herokuapp.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Authentication endpoints
    location ~ ^/api/(signin|signup|resetPassword) {
        limit_req zone=auth burst=3 nodelay;
        
        proxy_pass https://streamply_backend\$request_uri;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host $HEROKU_APP_NAME.herokuapp.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend
    location / {
        proxy_pass https://streamply_frontend;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host $FRONTEND_DOMAIN;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo -e "${GREEN}✅ Nginx configuration generated: nginx-streamply.conf${NC}"

# Step 4: Generate SSL setup script
echo -e "${YELLOW}🔧 Step 4: Generating SSL setup script...${NC}"

cat > setup-ssl.sh << 'EOF'
#!/bin/bash

# SSL Setup Script for Streamply
echo "Setting up SSL certificate..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
sudo certbot --nginx -d MAIN_DOMAIN_PLACEHOLDER

# Setup auto-renewal
echo "Setting up auto-renewal..."
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "SSL setup complete!"
EOF

sed -i "s/MAIN_DOMAIN_PLACEHOLDER/$MAIN_DOMAIN/g" setup-ssl.sh
chmod +x setup-ssl.sh

echo -e "${GREEN}✅ SSL setup script generated: setup-ssl.sh${NC}"

# Step 5: Generate deployment test script
echo -e "${YELLOW}🔧 Step 5: Generating test script...${NC}"

cat > test-deployment.sh << EOF
#!/bin/bash

# Test Streamply Deployment
echo "🧪 Testing Streamply Deployment..."

BACKEND_URL="https://$HEROKU_APP_NAME.herokuapp.com"
FRONTEND_URL="https://$FRONTEND_DOMAIN"
MAIN_URL="https://$MAIN_DOMAIN"

echo "Testing backend directly..."
curl -I \$BACKEND_URL/videos/all

echo "Testing frontend directly..."
curl -I \$FRONTEND_URL

echo "Testing main domain (if configured)..."
curl -I \$MAIN_URL/api/videos/all

echo "Testing CORS..."
curl -I \$BACKEND_URL/videos/test-cors

echo "✅ Deployment test complete!"
EOF

chmod +x test-deployment.sh

echo -e "${GREEN}✅ Test script generated: test-deployment.sh${NC}"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Setup your server:${NC}"
echo "   - Copy nginx-streamply.conf to /etc/nginx/sites-available/streamply"
echo "   - Run: sudo ln -s /etc/nginx/sites-available/streamply /etc/nginx/sites-enabled/"
echo "   - Run: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. ${YELLOW}Setup SSL:${NC}"
echo "   - Run: ./setup-ssl.sh"
echo ""
echo "3. ${YELLOW}Configure DNS:${NC}"
echo "   - Point $MAIN_DOMAIN to your server IP"
echo ""
echo "4. ${YELLOW}Test everything:${NC}"
echo "   - Run: ./test-deployment.sh"
echo ""
echo -e "${BLUE}📊 URLs:${NC}"
echo "  Backend: https://$HEROKU_APP_NAME.herokuapp.com"
echo "  Frontend: https://$FRONTEND_DOMAIN"
echo "  Main: https://$MAIN_DOMAIN"
echo ""
echo -e "${GREEN}🚀 Streamply is ready for production!${NC}"
