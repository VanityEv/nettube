-- Simple Video Statistics Triggers for StreamPly
-- Works with existing videos table structure

-- Function to update review statistics when reviews are inserted
CREATE OR REPLACE FUNCTION update_video_review_stats_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = NEW.video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
            FROM reviews 
            WHERE video_id = NEW.video_id AND grade IS NOT NULL
        )
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update review statistics when reviews are updated
CREATE OR REPLACE FUNCTION update_video_review_stats_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the grade changed or video_id changed
    IF OLD.grade IS DISTINCT FROM NEW.grade OR OLD.video_id IS DISTINCT FROM NEW.video_id THEN
        -- Update old video if video_id changed
        IF OLD.video_id IS DISTINCT FROM NEW.video_id THEN
            UPDATE videos 
            SET 
                reviews_count = (
                    SELECT COUNT(*) 
                    FROM reviews 
                    WHERE video_id = OLD.video_id
                ),
                grade = (
                    SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
                    FROM reviews 
                    WHERE video_id = OLD.video_id AND grade IS NOT NULL
                )
            WHERE id = OLD.video_id;
        END IF;
        
        -- Update new video
        UPDATE videos 
        SET 
            reviews_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE video_id = NEW.video_id
            ),
            grade = (
                SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
                FROM reviews 
                WHERE video_id = NEW.video_id AND grade IS NOT NULL
            )
        WHERE id = NEW.video_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update review statistics when reviews are deleted
CREATE OR REPLACE FUNCTION update_video_review_stats_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = OLD.video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
            FROM reviews 
            WHERE video_id = OLD.video_id AND grade IS NOT NULL
        )
    WHERE id = OLD.video_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to increment video views with spam prevention
CREATE OR REPLACE FUNCTION increment_video_views(
    p_video_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_view_exists BOOLEAN := FALSE;
    time_threshold TIMESTAMP;
BEGIN
    -- Set time threshold to 1 hour ago
    time_threshold := NOW() - INTERVAL '1 hour';
    
    -- Check for recent views from same user/IP to prevent spam
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM user_video_views 
            WHERE video_id = p_video_id 
            AND user_id = p_user_id 
            AND viewed_at > time_threshold
        ) INTO recent_view_exists;
    ELSIF p_ip_address IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM user_video_views 
            WHERE video_id = p_video_id 
            AND ip_address = p_ip_address 
            AND viewed_at > time_threshold
        ) INTO recent_view_exists;
    END IF;
    
    -- Only increment if no recent view found
    IF NOT recent_view_exists THEN
        -- Increment the view count
        UPDATE videos 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = p_video_id;
        
        -- Log the view (if table exists)
        BEGIN
            INSERT INTO user_video_views (video_id, user_id, ip_address, viewed_at)
            VALUES (p_video_id, p_user_id, p_ip_address, NOW());
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if table doesn't exist, just increment the counter
            NULL;
        END;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all video statistics
CREATE OR REPLACE FUNCTION recalculate_all_video_stats()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE videos 
    SET 
        reviews_count = COALESCE(review_counts.count, 0),
        grade = COALESCE(review_grades.avg_grade, 0.00)
    FROM (
        SELECT video_id, COUNT(*) as count
        FROM reviews 
        GROUP BY video_id
    ) review_counts
    LEFT JOIN (
        SELECT video_id, ROUND(AVG(grade), 2) as avg_grade
        FROM reviews 
        WHERE grade IS NOT NULL
        GROUP BY video_id
    ) review_grades ON review_counts.video_id = review_grades.video_id
    WHERE videos.id = review_counts.video_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_video_stats_on_review_insert ON reviews;
CREATE TRIGGER update_video_stats_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_insert();

DROP TRIGGER IF EXISTS update_video_stats_on_review_update ON reviews;
CREATE TRIGGER update_video_stats_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_update();

DROP TRIGGER IF EXISTS update_video_stats_on_review_delete ON reviews;
CREATE TRIGGER update_video_stats_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_video_review_stats_delete();

-- Optional: Create user_video_views table for spam prevention (only if you want detailed view tracking)
CREATE TABLE IF NOT EXISTS user_video_views (
    id SERIAL PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient spam prevention queries
CREATE INDEX IF NOT EXISTS idx_user_video_views_spam_prevention 
ON user_video_views (video_id, user_id, viewed_at);

CREATE INDEX IF NOT EXISTS idx_user_video_views_ip_spam_prevention 
ON user_video_views (video_id, ip_address, viewed_at);

-- Initial statistics calculation
SELECT recalculate_all_video_stats() as videos_updated;
