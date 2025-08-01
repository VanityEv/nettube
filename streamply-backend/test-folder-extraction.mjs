#!/usr/bin/env node

/**
 * Test the video folder extraction logic
 */

console.log('=== VIDEO FOLDER EXTRACTION TEST ===');

function extractVideoIdFromUrl(url) {
  if (!url) return null;
  
  try {
    // Extract the full folder name from B2 URL structure
    // Expected format: .../movies/title-uuid/playlist.m3u8
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Look for the folder pattern: title-uuid (should be second to last part before playlist.m3u8)
    if (pathParts.length >= 2) {
      // Find the part that contains the video folder (title-uuid)
      const folderPart = pathParts[pathParts.length - 2]; // Part before playlist.m3u8
      if (folderPart && folderPart.includes('-') && folderPart.length > 10) {
        return folderPart;
      }
    }
    
    console.error('Could not extract folder from URL parts:', pathParts);
    return null;
  } catch (error) {
    console.error('Error extracting video ID from URL:', error);
    return null;
  }
}

// Test with real URLs
const testUrls = [
  'https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/white-noise-6142481b-dda2-4965-8b5c-88b778f84b23/playlist.m3u8',
  'https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/drumming-8c206299-3158-478a-a90e-e607fcd54906/playlist.m3u8',
  // Simulated Family Guy URL based on the folder structure you provided
  'https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/family-guy-936de1a6-ecd6-4f1b-9274-d8f0e35356c2/playlist.m3u8'
];

testUrls.forEach(url => {
  console.log('\\n---');
  console.log('Testing URL:', url);
  const extracted = extractVideoIdFromUrl(url);
  console.log('Extracted folder:', extracted);
  
  if (extracted) {
    const b2Folder = `movies/${extracted}`;
    console.log('Constructed B2 path:', b2Folder);
  }
});
