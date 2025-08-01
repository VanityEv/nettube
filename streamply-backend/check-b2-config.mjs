import dotenv from 'dotenv';
dotenv.config();

console.log('🔄 Testing B2 Integration...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`B2 Key ID: ${process.env.B2_APPLICATION_KEY_ID ? 'Set ✅' : 'Missing ❌'}`);
console.log(`B2 Bucket: ${process.env.B2_BUCKET_NAME || 'Missing ❌'}`);

// Simple test without importing B2 helpers (to avoid module issues)
async function testB2Config() {
  console.log('\n📋 B2 Configuration Check:');
  console.log(`- Application Key ID: ${process.env.B2_APPLICATION_KEY_ID || 'NOT SET'}`);
  console.log(`- Application Key: ${process.env.B2_APPLICATION_KEY ? '[HIDDEN]' : 'NOT SET'}`);
  console.log(`- Bucket Name: ${process.env.B2_BUCKET_NAME || 'NOT SET'}`);
  console.log(`- Bucket ID: ${process.env.B2_BUCKET_ID || 'NOT SET'}`);
  console.log(`- Download URL: ${process.env.B2_DOWNLOAD_URL || 'NOT SET'}`);
  
  if (process.env.B2_APPLICATION_KEY_ID && process.env.B2_APPLICATION_KEY && 
      process.env.B2_BUCKET_NAME && process.env.B2_BUCKET_ID) {
    console.log('\n✅ All B2 credentials are configured!');
    console.log('🚀 Ready to test video/avatar uploads!');
  } else {
    console.log('\n❌ Some B2 credentials are missing');
  }
}

testB2Config();
