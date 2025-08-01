// Debug B2 URL generation
import { generateB2SignedUrl } from './services/video/b2Helpers.js';

// Set development mode to avoid credential issues for now
process.env.NODE_ENV = 'development';

async function debugB2Url() {
  try {
    console.log('🔍 Debugging B2 URL generation...');
    
    const testFileName = 'thumbnails/test-image.jpg';
    const signedUrl = await generateB2SignedUrl(testFileName, 3600);
    
    console.log('Generated URL:', signedUrl);
    console.log('URL parts:');
    const url = new URL(signedUrl);
    console.log('- Protocol:', url.protocol);
    console.log('- Hostname:', url.hostname);
    console.log('- Pathname:', url.pathname);
    console.log('- Search params:', url.searchParams.toString());
    
  } catch (error) {
    console.error('Error debugging B2 URL:', error);
  }
}

debugB2Url();
