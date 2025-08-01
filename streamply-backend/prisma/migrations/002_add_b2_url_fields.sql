-- Add B2 cloud storage URL fields to users, videos, and series_episodes tables

-- Add avatar_url to users table
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Add video_url and thumbnail_url to videos table  
ALTER TABLE videos ADD COLUMN video_url TEXT;
ALTER TABLE videos ADD COLUMN thumbnail_url TEXT;

-- Add video_url and thumbnail_url to series_episodes table
ALTER TABLE series_episodes ADD COLUMN video_url TEXT;
ALTER TABLE series_episodes ADD COLUMN thumbnail_url TEXT;
