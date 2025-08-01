# 🎬 STREAMPLY VIDEO PROCESSING WORKFLOW
# Complete HLS Transcoding + Backblaze B2 Upload Pipeline

## 📋 Current Workflow (YOUR SYSTEM ALREADY DOES THIS!)

### 1. 📤 FRONTEND UPLOAD
```
User uploads video (MKV/MP4) → VideoRouter.js receives file
↓
VideoRouter stores to temp disk storage (./temp-uploads/)
↓ 
Calls processMovieUpload() with file path
```

### 2. 🔄 FFmpeg HLS TRANSCODING 
```
processMovieUpload() → creates temp directory
↓
FFmpeg transcodes MP4/MKV → Multiple quality HLS streams:
- 720p (2500k bitrate) → playlist.m3u8 + segment_000.ts files
- 480p (1000k bitrate) → playlist.m3u8 + segment_000.ts files  
- 360p (500k bitrate) → playlist.m3u8 + segment_000.ts files
↓
Master playlist.m3u8 created (points to quality variants)
```

### 3. ☁️ BACKBLAZE B2 UPLOAD
```
All HLS files uploaded to B2:
- movies/{title}-{uuid}/playlist.m3u8 (master playlist)
- movies/{title}-{uuid}/720p.m3u8
- movies/{title}-{uuid}/720p/segment_000.ts
- movies/{title}-{uuid}/720p/segment_001.ts
- movies/{title}-{uuid}/480p.m3u8  
- movies/{title}-{uuid}/480p/segment_000.ts
- thumbnails/{title}-{uuid}.jpg
↓
Original MP4 file DELETED from temp storage ✅
```

### 4. 🔒 SECURE PLAYBACK
```
Frontend requests video → /api/videos/video/stream/:id
↓
Backend generates signed B2 URLs (4-hour expiry)
↓
Frontend receives secure HLS manifest URL
↓
Video player requests .m3u8 → then sequential .ts segments
↓
All requests go through B2 signed URLs (piracy protection)
```

## 🎯 SECURITY FEATURES ALREADY IMPLEMENTED

✅ **Anti-Piracy**: Device fingerprinting, concurrent stream limits, watermarking
✅ **Signed URLs**: All B2 files use signed URLs with expiration
✅ **Rate Limiting**: Upload/streaming endpoints are rate limited  
✅ **Input Validation**: File type/size validation
✅ **Logging**: All video operations logged for security monitoring

## 🔧 TECHNICAL DETAILS

### FFmpeg Command (from ffmpegUtils.js):
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -preset fast -crf 23 \
  -hls_time 10 -hls_playlist_type vod \
  -b:v 2500k -s 1280x720 \
  -hls_segment_filename segment_%03d.ts \
  720p.m3u8
```

### B2 Upload Structure:
```
streamply-bucket-prod/
├── movies/
│   └── {kebab-title}-{uuid}/
│       ├── playlist.m3u8 (master)
│       ├── 720p.m3u8
│       ├── 720p/segment_000.ts
│       ├── 720p/segment_001.ts
│       ├── 480p.m3u8
│       └── 480p/segment_000.ts
├── thumbnails/
│   └── {title}-{uuid}.jpg
└── avatars/
    └── {username}_{timestamp}.jpg
```

## ✨ YOUR SYSTEM IS PRODUCTION-READY!

The workflow you described is EXACTLY what your system already does:
1. ✅ Frontend form upload (MKV/MP4)
2. ✅ FFmpeg transcoding to HLS (m3u8 + ts files)  
3. ✅ HLS files uploaded to Backblaze B2
4. ✅ Source MP4 discarded after processing
5. ✅ Secure signed URL streaming
6. ✅ Anti-piracy protection

## 🚀 READY TO TEST

Just run: `npm start` and upload a video through your admin panel!
