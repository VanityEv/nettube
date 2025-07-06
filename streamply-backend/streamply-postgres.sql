-- PostgreSQL migration script for Streamply
-- This script creates the new schema and migrates data from MariaDB-compatible exports

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  fullname VARCHAR(100),
  password_hash TEXT NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  birthdate DATE,
  confirmed BOOLEAN DEFAULT FALSE,
  register_token VARCHAR(100),
  register_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  account_type INT DEFAULT 1,
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VIDEOS TABLE
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  genre VARCHAR(50),
  production_year INT,
  production_country VARCHAR(50),
  director VARCHAR(100),
  tags TEXT,
  descr TEXT,
  thumbnail TEXT,
  grade NUMERIC(3,1),
  reviews_count INT DEFAULT 0,
  views INT DEFAULT 0,
  link TEXT,
  blocked_reviews BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS TABLE
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id),
  comment TEXT,
  grade NUMERIC(3,1),
  comment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER_LIKES TABLE
CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id)
);

-- SERIES_EPISODES TABLE
CREATE TABLE series_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES videos(id),
  season INT,
  episode INT,
  episode_name VARCHAR(255),
  description TEXT
);

-- Indexes for performance
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_video_title ON videos(title);
CREATE INDEX idx_review_video_id ON reviews(video_id);

-- Add more constraints and indexes as needed for your queries.

-- Data migration from MariaDB should be done with ETL scripts or tools (e.g., pgloader, custom Node.js scripts).
