# 🐘 PostgreSQL Migration Guide for Streamply

## Overview
This guide will help you migrate from MariaDB/MySQL to PostgreSQL with enhanced security and performance.

## 📋 Prerequisites

### 1. Install PostgreSQL
```powershell
# Install PostgreSQL using winget (Windows)
winget install PostgreSQL.PostgreSQL

# Or download from https://www.postgresql.org/download/windows/
```

### 2. Create Database and User
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE streamply;

-- Create dedicated user
CREATE USER streamply_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE streamply TO streamply_user;

-- Connect to the streamply database
\c streamply

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO streamply_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO streamply_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO streamply_user;
```

## 🔧 Environment Configuration

### 1. Create Environment File
Create `.env` in `streamply-backend/`:

```env
# Database Configuration
DATABASE_URL="postgresql://streamply_user:your_secure_password@localhost:5432/streamply"
PG_CONNECTION_STRING="postgresql://streamply_user:your_secure_password@localhost:5432/streamply"
PG_SSL=false

# Security Configuration
JWT_SECRET="your-super-secure-256-bit-secret-key-here"
SECRET="your-super-secure-256-bit-secret-key-here"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Email Configuration (SendGrid)
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
SENDGRID_USER="apikey"
SENDGRID_PASS="SG.your_sendgrid_api_key"

# Backblaze B2 Configuration
B2_KEY_ID="your_backblaze_key_id"
B2_APPLICATION_KEY="your_backblaze_application_key"
B2_BUCKET_NAME="your_bucket_name"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# MongoDB for Logging
MONGO_URI="mongodb://localhost:27017/streamply_logs"

# Development
NODE_ENV="development"
```

## 🗃️ Database Schema Migration

### 1. Updated PostgreSQL Schema
The schema includes security enhancements and proper indexing:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with enhanced security
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    password TEXT NOT NULL, -- bcrypt hashed
    birthdate DATE NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    email VARCHAR(100) UNIQUE NOT NULL,
    register_token VARCHAR(255),
    account_type INTEGER DEFAULT 1, -- 1=user, 2=moderator, 3=admin
    register_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('film', 'series')),
    seasons INTEGER DEFAULT 0,
    genre VARCHAR(50) NOT NULL,
    production_year INTEGER,
    production_country VARCHAR(100),
    director VARCHAR(100),
    tags TEXT,
    descr TEXT,
    thumbnail TEXT,
    alt VARCHAR(255),
    video_length DECIMAL(10,2) DEFAULT 0,
    grade DECIMAL(3,1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    link TEXT,
    blocked_reviews BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    comment TEXT NOT NULL,
    grade DECIMAL(3,1),
    comment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    show_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- User likes table
CREATE TABLE user_likes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

-- User watching progress table
CREATE TABLE user_watching (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season INTEGER,
    episode INTEGER,
    time_watched DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, user_id)
);

-- Series episodes table
CREATE TABLE series_episodes (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    episode_name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, season, episode)
);

-- Subscriptions table for payment management
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'none' CHECK (status IN ('active', 'cancelled', 'expired', 'none')),
    provider_id VARCHAR(255), -- Stripe subscription ID
    plan_type VARCHAR(50),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_confirmed ON users(confirmed);
CREATE INDEX idx_videos_title ON videos(title);
CREATE INDEX idx_videos_type ON videos(type);
CREATE INDEX idx_videos_genre ON videos(genre);
CREATE INDEX idx_videos_views ON videos(views);
CREATE INDEX idx_reviews_show_id ON reviews(show_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_user_likes_video_id ON user_likes(video_id);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_watching_show_id ON user_watching(show_id);
CREATE INDEX idx_user_watching_user_id ON user_watching(user_id);
CREATE INDEX idx_series_episodes_show_id ON series_episodes(show_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_watching_updated_at BEFORE UPDATE ON user_watching FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔄 Migration Steps

### 1. Install Dependencies
```powershell
cd streamply-backend
npm install prisma @prisma/client pg
npm install --save-dev @types/pg
```

### 2. Configure Prisma
```powershell
# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or use migrations for production
npx prisma migrate dev --name init
```

### 3. Data Migration (if you have existing data)
You'll need to export data from your current database and import it to PostgreSQL.

## 🧪 Testing the Migration

### 1. Test Database Connection
```powershell
# Test PostgreSQL connection
npx prisma studio
```

### 2. Verify Schema
```sql
-- Connect to your database
psql -U streamply_user -d streamply

-- List all tables
\dt

-- Check table structure
\d users
\d videos
\d reviews
```

## 🚀 Production Considerations

### 1. Database Optimization
```sql
-- Analyze tables for better query planning
ANALYZE;

-- Update statistics
VACUUM ANALYZE;
```

### 2. Connection Pooling
Consider using PgBouncer for production:
```bash
# Install PgBouncer
# Configure connection pooling
```

### 3. Backup Strategy
```bash
# Create backup
pg_dump -U streamply_user streamply > streamply_backup.sql

# Restore backup
psql -U streamply_user streamply < streamply_backup.sql
```

## 🔒 Security Enhancements

### 1. Database Security
```sql
-- Revoke public schema access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO streamply_user;

-- Set row level security (if needed)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 2. Connection Security
- Use SSL in production
- Implement connection limits
- Regular security updates

## 📊 Performance Monitoring

### 1. Query Performance
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

### 2. Monitor Slow Queries
```sql
-- Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Common Issues:
1. **Connection refused**: Check PostgreSQL service is running
2. **Authentication failed**: Verify username/password in connection string
3. **Permission denied**: Ensure user has proper privileges
4. **Schema sync issues**: Run `npx prisma db push` again

### Debug Commands:
```powershell
# Check PostgreSQL service status
Get-Service postgresql*

# Test connection
psql -U streamply_user -d streamply -c "SELECT version();"

# Check Prisma schema
npx prisma validate
```

Remember to update your environment variables and test all functionality after migration!
