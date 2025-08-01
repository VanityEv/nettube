#!/bin/bash

# Streamply Ngrok Deployment Script
echo "🚀 Streamply Ngrok Deployment Starting..."
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running on Windows (WSL) or Linux
if grep -qi microsoft /proc/version; then
    echo -e "${YELLOW}Running on Windows WSL${NC}"
    IS_WSL=true
else
    echo -e "${YELLOW}Running on Linux${NC}"
    IS_WSL=false
fi

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi
echo -e "${GREEN}✅ PostgreSQL found${NC}"

# Check MongoDB
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB not found. Installing...${NC}"
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
fi
echo -e "${GREEN}✅ MongoDB found${NC}"

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx not found. Installing...${NC}"
    sudo apt install -y nginx
fi
echo -e "${GREEN}✅ Nginx found${NC}"

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not found. Installing...${NC}"
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
    
    echo -e "${YELLOW}Please get your authtoken from https://ngrok.com and run:${NC}"
    echo "ngrok config add-authtoken YOUR_TOKEN"
    read -p "Press Enter when you've configured ngrok authtoken..."
fi
echo -e "${GREEN}✅ ngrok found${NC}"

# Step 2: Setup databases
echo -e "${BLUE}📋 Step 2: Setting up databases...${NC}"

# Start PostgreSQL
echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create PostgreSQL database
echo "Creating PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE streamply_prod;" 2>/dev/null || echo "Database streamply_prod already exists"
sudo -u postgres psql -c "CREATE USER streamply WITH ENCRYPTED PASSWORD 'streamply_secure_2025';" 2>/dev/null || echo "User streamply already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE streamply_prod TO streamply;" 2>/dev/null

# Start MongoDB
echo "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Create MongoDB collection
echo "Creating MongoDB collections..."
mongosh --eval "use streamply_security; db.createCollection('security_events');" 2>/dev/null || echo "MongoDB collection setup complete"

echo -e "${GREEN}✅ Databases configured${NC}"

# Step 3: Configure backend
echo -e "${BLUE}📋 Step 3: Configuring backend...${NC}"

cd streamply-backend

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://streamply:streamply_secure_2025@localhost:5432/streamply_prod"
MONGODB_URI="mongodb://localhost:27017/streamply_security"

# JWT Security
JWT_SECRET="super-secure-jwt-secret-key-for-production-streamply-2025-64-chars"

# Backblaze B2 (update with your credentials)
BACKBLAZE_APPLICATION_KEY_ID="your_key_id_here"
BACKBLAZE_APPLICATION_KEY="your_key_here"
BACKBLAZE_BUCKET_NAME="streamply-bucket-prod"

# Email (SendGrid - update with your credentials)
SENDGRID_API_KEY="your_sendgrid_key_here"
FROM_EMAIL="noreply@yourdomain.com"

# Stripe (update with your credentials)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Production settings
NODE_ENV="production"
PORT=3001

# Frontend URL (Vercel)
FRONTEND_URL="https://your-streamply-app.vercel.app"
EOF

echo -e "${YELLOW}⚠️  Please update the following in streamply-backend/.env:${NC}"
echo "  - BACKBLAZE_APPLICATION_KEY_ID"
echo "  - BACKBLAZE_APPLICATION_KEY"
echo "  - SENDGRID_API_KEY"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - FRONTEND_URL (your Vercel domain)"
echo ""
read -p "Press Enter when you've updated the .env file..."

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Setup database
echo "Setting up database schema..."
npx prisma generate
npx prisma migrate deploy

echo -e "${GREEN}✅ Backend configured${NC}"
cd ..

# Step 4: Configure Nginx
echo -e "${BLUE}📋 Step 4: Configuring Nginx proxy...${NC}"

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/streamply-local << 'EOF'
upstream streamply_backend {
    server localhost:3001;
    keepalive 32;
}

upstream streamply_frontend {
    server your-streamply-app.vercel.app:443;
    keepalive 32;
}

server {
    listen 80;
    server_name localhost;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=streaming:10m rate=50r/m;
    
    # Logging
    access_log /var/log/nginx/streamply-local.access.log;
    error_log /var/log/nginx/streamply-local.error.log;
    
    # API Backend Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://streamply_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Fingerprint" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Device-Fingerprint" always;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Video streaming endpoints
    location ~ ^/api/videos/video/(hls|stream) {
        limit_req zone=streaming burst=10 nodelay;
        
        proxy_pass http://streamply_backend$request_uri;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Authorization" always;
    }
    
    # Frontend proxy
    location / {
        proxy_pass https://streamply_frontend;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_set_header Host your-streamply-app.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "Streamply healthy via ngrok\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/streamply-local /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration valid${NC}"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    exit 1
fi

# Step 5: Create startup scripts
echo -e "${BLUE}📋 Step 5: Creating startup scripts...${NC}"

# Start script
cat > start-streamply.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Streamply with ngrok..."

# Check databases
echo "Checking databases..."
sudo systemctl status postgresql | grep "active (running)" || (echo "Starting PostgreSQL..." && sudo systemctl start postgresql)
sudo systemctl status mongod | grep "active (running)" || (echo "Starting MongoDB..." && sudo systemctl start mongod)

# Start backend
echo "Starting backend..."
cd streamply-backend
NODE_ENV=production npm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID" > ../streamply.pid

# Wait for backend
sleep 5

# Check nginx
sudo systemctl status nginx | grep "active (running)" || sudo systemctl start nginx

# Start ngrok
echo "Starting ngrok..."
ngrok http 80 --log=stdout &
NGROK_PID=$!
echo "Ngrok PID: $NGROK_PID" >> ../streamply.pid

echo ""
echo "✅ Streamply started!"
echo "Backend: http://localhost:3001"
echo "Proxy: http://localhost:80"
echo "Ngrok dashboard: http://localhost:4040"
echo ""
echo "📋 Next steps:"
echo "1. Open http://localhost:4040 to get your ngrok URL"
echo "2. Update VITE_API_URL in Vercel to: https://YOUR_NGROK_URL.ngrok.io/api"
echo "3. Update CORS origins in backend if needed"
echo ""
echo "To stop: ./stop-streamply.sh"

# Keep script running
wait
EOF

# Stop script
cat > stop-streamply.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Streamply..."

if [ -f streamply.pid ]; then
    while read pid; do
        if [[ $pid =~ ^[0-9]+$ ]]; then
            echo "Killing process $pid"
            kill $pid 2>/dev/null || echo "Process $pid already stopped"
        fi
    done < streamply.pid
    rm streamply.pid
fi

# Cleanup any remaining processes
pkill -f ngrok
pkill -f "node.*index.js"

echo "✅ Streamply stopped!"
EOF

# Make scripts executable
chmod +x start-streamply.sh stop-streamply.sh

echo -e "${GREEN}✅ Startup scripts created${NC}"

# Step 6: Final instructions
echo ""
echo -e "${GREEN}🎉 Streamply Ngrok Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📝 What's configured:${NC}"
echo "  ✅ PostgreSQL database (local)"
echo "  ✅ MongoDB database (local)"
echo "  ✅ Backend with production config"
echo "  ✅ Nginx proxy with CORS"
echo "  ✅ Startup/stop scripts"
echo ""
echo -e "${BLUE}🚀 To start Streamply:${NC}"
echo "  ./start-streamply.sh"
echo ""
echo -e "${BLUE}🛑 To stop Streamply:${NC}"
echo "  ./stop-streamply.sh"
echo ""
echo -e "${BLUE}📊 URLs after start:${NC}"
echo "  Backend direct: http://localhost:3001"
echo "  Nginx proxy: http://localhost:80"
echo "  Ngrok dashboard: http://localhost:4040"
echo "  Your ngrok URL: https://RANDOM.ngrok.io (check dashboard)"
echo ""
echo -e "${BLUE}⚠️  Don't forget to:${NC}"
echo "  1. Update .env file with your API keys"
echo "  2. Update Vercel VITE_API_URL to your ngrok URL"
echo "  3. Update CORS origins if needed"
echo ""
echo -e "${YELLOW}Ready to start? Run: ./start-streamply.sh${NC}"
