// Generate fresh signed URL for B2 thumbnails
// This endpoint takes a B2 file path and returns a fresh signed URL

import express from 'express';
import { generateB2SignedUrl, refreshB2SignedUrl } from '../video/b2Helpers.js';

const router = express.Router();

/**
 * GET /api/thumbnails/signed/path
 * Generate a fresh signed URL for a B2 thumbnail
 * Use query parameter for file path to avoid route parsing issues
 */
router.get('/signed', async (req, res) => {
  try {
    // Extract file path from query parameter
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required as query parameter (?path=...)' });
    }
    
    // Generate fresh signed URL (valid for 1 hour)
    const signedUrl = await generateB2SignedUrl(filePath, 3600);
    
    res.json({ 
      signedUrl,
      originalPath: filePath,
      expiresIn: 3600 // 1 hour
    });
    
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

/**
 * POST /api/thumbnails/refresh
 * Refresh an expired B2 signed URL
 */
router.post('/refresh', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Generate fresh signed URL from existing URL
    const refreshedUrl = await refreshB2SignedUrl(url, 3600);
    
    res.json({ 
      originalUrl: url,
      refreshedUrl,
      expiresIn: 3600
    });
    
  } catch (error) {
    console.error('Error refreshing signed URL:', error);
    res.status(500).json({ error: 'Failed to refresh signed URL' });
  }
});

/**
 * POST /api/thumbnails/batch-signed
 * Generate fresh signed URLs for multiple B2 thumbnails
 */
router.post('/batch-signed', async (req, res) => {
  try {
    const { filePaths } = req.body;
    
    if (!Array.isArray(filePaths)) {
      return res.status(400).json({ error: 'filePaths must be an array' });
    }
    
    // Generate signed URLs for all files
    const signedUrls = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const signedUrl = await generateB2SignedUrl(filePath, 3600);
          return { filePath, signedUrl, success: true };
        } catch (error) {
          return { filePath, error: error.message, success: false };
        }
      })
    );
    
    res.json({ 
      results: signedUrls,
      expiresIn: 3600
    });
    
  } catch (error) {
    console.error('Error generating batch signed URLs:', error);
    res.status(500).json({ error: 'Failed to generate signed URLs' });
  }
});

export default router;
