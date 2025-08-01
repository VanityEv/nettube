# Database Triggers Integration Guide

## Overview
This guide helps you integrate the automated video statistics triggers into your StreamPly database.

## Files Created
1. `database-triggers-video-stats.sql` - Complete trigger system
2. `setup-database-triggers.mjs` - Installation script  
3. Updated `VideoRouter.js` - Integrated view tracking

## Quick Setup

### 1. Apply Database Triggers
```bash
cd streamply-backend
node setup-database-triggers.mjs
```

This script will:
- ✅ Create the `video_views` table for tracking individual views
- ✅ Install triggers for automatic review statistics updates
- ✅ Install view tracking function with spam prevention  
- ✅ Test the trigger functionality
- ✅ Provide detailed feedback on installation

### 2. View Tracking Integration
The view tracking is already integrated in your `VideoRouter.js` streaming endpoint:

```javascript
// Automatically called when users start streaming
increment_video_views(videoId, userId, clientIp, userAgent)
```

**Features:**
- 🛡️ **Spam Prevention**: Only counts 1 view per user per video per hour
- 📊 **Automatic Updates**: Video view counts update automatically
- 🔄 **Bulletproof**: Streaming continues even if view tracking fails

### 3. Automatic Review Statistics
These triggers run automatically:
- ➕ **Review Added**: `reviews_count++`, recalculate average `grade`
- ✏️ **Review Updated**: Recalculate average `grade` if grade changed
- ❌ **Review Deleted**: `reviews_count--`, recalculate average `grade`

## What Happens After Installation

### Automatic Updates
Your `videos` table will automatically maintain:
```sql
-- Updated automatically by triggers
reviews_count INTEGER DEFAULT 0
grade DECIMAL(3,2) DEFAULT 0.00  
views INTEGER DEFAULT 0
```

### Manual Recalculation (if needed)
```sql
-- Recalculate all video statistics
SELECT recalculate_all_video_stats();

-- Check a specific video's stats
SELECT id, title, reviews_count, grade, views 
FROM videos 
WHERE title ILIKE '%your-video%';
```

### View Tracking Details
```sql
-- See recent view activity
SELECT v.title, vv.user_id, vv.viewed_at, vv.ip_address
FROM video_views vv
JOIN videos v ON v.id = vv.video_id
ORDER BY vv.viewed_at DESC
LIMIT 10;

-- Count views per video
SELECT v.title, COUNT(vv.id) as total_views
FROM videos v
LEFT JOIN video_views vv ON v.id = vv.video_id
GROUP BY v.id, v.title
ORDER BY total_views DESC;
```

## Performance & Monitoring

### Database Indexes
The triggers create these indexes for optimal performance:
```sql
-- For efficient view tracking
video_views_video_user_idx (video_id, user_id, viewed_at)
video_views_spam_prevention_idx (video_id, ip_address, viewed_at)

-- For efficient review statistics  
reviews_video_stats_idx (video_id, grade)
```

### Monitoring Queries
```sql
-- Check trigger performance
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
WHERE tablename IN ('videos', 'reviews', 'video_views');

-- Verify data consistency
SELECT 
  v.title,
  v.reviews_count as stored_count,
  COUNT(r.id) as actual_count,
  v.grade as stored_grade,
  ROUND(AVG(r.grade), 2) as actual_grade
FROM videos v
LEFT JOIN reviews r ON v.id = r.video_id AND r.grade IS NOT NULL
GROUP BY v.id, v.title, v.reviews_count, v.grade
HAVING v.reviews_count != COUNT(r.id) OR ABS(v.grade - COALESCE(AVG(r.grade), 0)) > 0.01;
```

## Troubleshooting

### Common Issues

**1. Permission Errors**
```sql
-- Grant necessary permissions
GRANT CREATE ON SCHEMA public TO your_user;
GRANT USAGE ON SCHEMA public TO your_user;
```

**2. Trigger Not Working**
```sql
-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name LIKE '%video_stats%';
```

**3. Manual Statistics Fix**
```sql
-- If statistics get out of sync
SELECT recalculate_all_video_stats();
```

### Rollback (if needed)
```sql
-- Remove all triggers and functions
DROP TRIGGER IF EXISTS update_video_stats_on_review_insert ON reviews;
DROP TRIGGER IF EXISTS update_video_stats_on_review_update ON reviews;  
DROP TRIGGER IF EXISTS update_video_stats_on_review_delete ON reviews;
DROP FUNCTION IF EXISTS update_video_review_stats CASCADE;
DROP FUNCTION IF EXISTS increment_video_views CASCADE;
DROP FUNCTION IF EXISTS recalculate_all_video_stats CASCADE;
DROP TABLE IF EXISTS video_views;
```

## Success Indicators

✅ **Setup Complete When:**
- All SQL statements execute without errors
- Test functions return expected results  
- View counts increment when streaming videos
- Review statistics update when reviews are added/modified

✅ **Working Correctly When:**
- Video view counts increase during streaming
- Review counts match actual review records
- Average grades calculate correctly
- No duplicate views from same user within 1 hour

## Support

If you encounter issues:
1. Check the console output from `setup-database-triggers.mjs`
2. Verify database permissions
3. Run the monitoring queries above
4. Check application logs for view tracking messages

The system is designed to be robust - even if view tracking fails, video streaming will continue normally.
