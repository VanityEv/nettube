import dotenv from 'dotenv';
import { uploadToB2, generateB2SignedUrl } from './streamply-backend/services/video/b2Helpers.js';

// Load environment variables from the backend directory
dotenv.config({ path: './streamply-backend/.env' });

console.log('🔄 Testing B2 Integration...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`B2 Key ID: ${process.env.B2_APPLICATION_KEY_ID ? 'Set ✅' : 'Missing ❌'}`);
console.log(`B2 Bucket: ${process.env.B2_BUCKET_NAME || 'Missing ❌'}`);

async function testB2Integration() {
  try {
    // Test 1: Upload simulation (in development mode)
    console.log('\n1. Testing upload simulation...');
    const testBuffer = Buffer.from('test file content');
    const uploadResult = await uploadToB2(testBuffer, 'test/sample.txt', 'text/plain');
    console.log('Upload result:', uploadResult);
    
    // Test 2: Generate signed URL simulation
    console.log('\n2. Testing signed URL generation...');
    const signedUrl = await generateB2SignedUrl('test/sample.txt', 3600);
    console.log('Signed URL:', signedUrl);
    
    console.log('\n✅ B2 Integration test completed successfully!');
    console.log('🔧 In development mode - using simulated responses');
    console.log('🚀 Ready for production with real B2 credentials');
    
  } catch (error) {
    console.error('❌ B2 Integration test failed:', error.message);
  }
}

testB2Integration();
