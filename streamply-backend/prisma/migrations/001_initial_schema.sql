-- Streamply PostgreSQL Schema for Heroku Deployment
-- This file will be automatically executed by Prisma during Heroku deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types for better data integrity
CREATE TYPE account_type AS ENUM ('user', 'admin');
CREATE TYPE subscription_status AS ENUM ('none', 'active', 'cancelled', 'expired');
CREATE TYPE video_type AS ENUM ('film', 'series');

-- Users table with enhanced security
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    birthdate DATE NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    email VARCHAR(255) UNIQUE NOT NULL,
    register_token VARCHAR(255),
    account_type INTEGER DEFAULT 1,
    register_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table with metadata
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'film',
    seasons INTEGER DEFAULT 0,
    genre VARCHAR(100) NOT NULL,
    production_year INTEGER NOT NULL,
    production_country VARCHAR(100) NOT NULL,
    director VARCHAR(255) NOT NULL,
    tags TEXT,
    descr TEXT,
    thumbnail VARCHAR(500),
    alt VARCHAR(255),
    video_length DECIMAL(10,2) DEFAULT 0,
    grade DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    link VARCHAR(500),
    blocked_reviews BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table with foreign key constraints
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    comment TEXT NOT NULL,
    grade DECIMAL(3,2),
    comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    show_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- User likes table
CREATE TABLE IF NOT EXISTS user_likes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

-- User watching progress table
CREATE TABLE IF NOT EXISTS user_watching (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    season INTEGER,
    episode INTEGER,
    time_watched DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, user_id)
);

-- Series episodes table
CREATE TABLE IF NOT EXISTS series_episodes (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    episode_name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(500),
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, season, episode)
);

-- Subscriptions table for payment management
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'none',
    provider_id VARCHAR(255), -- Stripe customer ID
    plan_type VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security audit log table
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre);
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);
CREATE INDEX IF NOT EXISTS idx_videos_type ON videos(type);
CREATE INDEX IF NOT EXISTS idx_reviews_show_id ON reviews(show_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watching_user_id ON user_watching(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watching_show_id ON user_watching(show_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_series_episodes_show_season ON series_episodes(show_id, season);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_watching_updated_at 
    BEFORE UPDATE ON user_watching 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Security function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
    p_event_type VARCHAR(100),
    p_user_id INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_logs (event_type, user_id, ip_address, user_agent, details)
    VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details);
END;
$$ LANGUAGE plpgsql;
