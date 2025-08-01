-- Video Statistics Triggers for StreamPly Database
-- These triggers automatically update video statistics when reviews are added/removed
-- and when videos are played (views count)

-- =============================================================================
-- TRIGGER 1: Update review statistics when a review is added
-- =============================================================================

CREATE OR REPLACE FUNCTION update_video_review_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reviews_count and average grade for the video
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = NEW.video_id
        ),
        grade = (
            SELECT ROUND(AVG(grade::numeric), 1) 
            FROM reviews 
            WHERE video_id = NEW.video_id 
            AND grade IS NOT NULL
        )
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_stats_on_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_on_insert();

-- =============================================================================
-- TRIGGER 2: Update review statistics when a review is updated
-- =============================================================================

CREATE OR REPLACE FUNCTION update_video_review_stats_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reviews_count and average grade for the video
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = NEW.video_id
        ),
        grade = (
            SELECT ROUND(AVG(grade::numeric), 1) 
            FROM reviews 
            WHERE video_id = NEW.video_id 
            AND grade IS NOT NULL
        )
    WHERE id = NEW.video_id;
    
    -- If the video_id changed (unlikely but possible), update the old video too
    IF OLD.video_id != NEW.video_id THEN
        UPDATE videos 
        SET 
            reviews_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE video_id = OLD.video_id
            ),
            grade = (
                SELECT ROUND(AVG(grade::numeric), 1) 
                FROM reviews 
                WHERE video_id = OLD.video_id 
                AND grade IS NOT NULL
            )
        WHERE id = OLD.video_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_stats_on_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_on_update();

-- =============================================================================
-- TRIGGER 3: Update review statistics when a review is deleted
-- =============================================================================

CREATE OR REPLACE FUNCTION update_video_review_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reviews_count and average grade for the video
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = OLD.video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade::numeric), 1), 0) 
            FROM reviews 
            WHERE video_id = OLD.video_id 
            AND grade IS NOT NULL
        )
    WHERE id = OLD.video_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_stats_on_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_on_delete();

-- =============================================================================
-- TRIGGER 4: Update views count when a video is played
-- =============================================================================

-- First, create a video_views table to track individual view events
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    view_timestamp TIMESTAMP DEFAULT NOW(),
    session_duration INTEGER DEFAULT 0, -- in seconds
    
    -- Prevent spam views from same user/IP within short time
    UNIQUE(video_id, user_id, ip_address, view_timestamp)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_timestamp ON video_views(view_timestamp);

-- Function to safely increment view count (prevents duplicate views)
CREATE OR REPLACE FUNCTION increment_video_views(
    p_video_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    view_exists BOOLEAN := FALSE;
    time_threshold TIMESTAMP := NOW() - INTERVAL '1 hour';
BEGIN
    -- Check if this user/IP already viewed this video recently (within 1 hour)
    SELECT EXISTS(
        SELECT 1 FROM video_views 
        WHERE video_id = p_video_id 
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id) OR
            (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
        )
        AND view_timestamp > time_threshold
    ) INTO view_exists;
    
    -- Only increment if not viewed recently
    IF NOT view_exists THEN
        -- Insert the view record
        INSERT INTO video_views (video_id, user_id, ip_address, user_agent)
        VALUES (p_video_id, p_user_id, p_ip_address, p_user_agent)
        ON CONFLICT DO NOTHING;
        
        -- Update the video views count
        UPDATE videos 
        SET views = COALESCE(views, 0) + 1
        WHERE id = p_video_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MANUAL STATISTICS RECALCULATION FUNCTIONS
-- =============================================================================

-- Function to recalculate all video statistics (useful for data migration/cleanup)
CREATE OR REPLACE FUNCTION recalculate_all_video_stats()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update all video statistics
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = videos.id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade::numeric), 1), 0) 
            FROM reviews 
            WHERE video_id = videos.id 
            AND grade IS NOT NULL
        ),
        views = (
            SELECT COUNT(*) 
            FROM video_views 
            WHERE video_id = videos.id
        );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate stats for a specific video
CREATE OR REPLACE FUNCTION recalculate_video_stats(p_video_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = p_video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade::numeric), 1), 0) 
            FROM reviews 
            WHERE video_id = p_video_id 
            AND grade IS NOT NULL
        ),
        views = (
            SELECT COUNT(*) 
            FROM video_views 
            WHERE video_id = p_video_id
        )
    WHERE id = p_video_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Ensure we have proper indexes for the queries used in triggers
CREATE INDEX IF NOT EXISTS idx_reviews_video_id ON reviews(video_id);
CREATE INDEX IF NOT EXISTS idx_reviews_video_id_grade ON reviews(video_id, grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_videos_grade ON videos(grade);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views);
CREATE INDEX IF NOT EXISTS idx_videos_reviews_count ON videos(reviews_count);

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION increment_video_views IS 'Safely increment video view count, preventing spam views from same user/IP within 1 hour';
COMMENT ON FUNCTION recalculate_all_video_stats IS 'Recalculate statistics for all videos (reviews_count, grade, views)';
COMMENT ON FUNCTION recalculate_video_stats IS 'Recalculate statistics for a specific video';
COMMENT ON TABLE video_views IS 'Tracks individual video view events with spam prevention';

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

/*
-- To increment views when a video is played:
SELECT increment_video_views(
    'video-uuid-here'::UUID, 
    'user-uuid-here'::UUID, 
    '192.168.1.1'::INET, 
    'Mozilla/5.0...'
);

-- To recalculate all statistics:
SELECT recalculate_all_video_stats();

-- To recalculate stats for one video:
SELECT recalculate_video_stats('video-uuid-here'::UUID);
*/
