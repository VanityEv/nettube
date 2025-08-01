// Check B2 configuration status
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 B2 Configuration Status:');
console.log('===========================');
console.log(`✅ B2_APPLICATION_KEY_ID: ${process.env.B2_APPLICATION_KEY_ID ? 'SET' : 'MISSING'}`);
console.log(`${process.env.B2_APPLICATION_KEY ? '✅' : '❌'} B2_APPLICATION_KEY: ${process.env.B2_APPLICATION_KEY ? 'SET' : 'MISSING'}`);
console.log(`✅ B2_BUCKET_NAME: ${process.env.B2_BUCKET_NAME || 'MISSING'}`);
console.log(`${process.env.B2_BUCKET_ID ? '✅' : '❌'} B2_BUCKET_ID: ${process.env.B2_BUCKET_ID ? 'SET' : 'MISSING'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

console.log('\n📋 What you need to complete:');
if (!process.env.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY === 'your_actual_application_key_here') {
    console.log('❌ Get Application Key from B2 console after clicking "Create New Key"');
}
if (!process.env.B2_BUCKET_ID || process.env.B2_BUCKET_ID === 'your_actual_bucket_id_here') {
    console.log('❌ Get Bucket ID from B2 console (usually shown with the new key)');
}

if (process.env.B2_APPLICATION_KEY && process.env.B2_APPLICATION_KEY !== 'your_actual_application_key_here' &&
    process.env.B2_BUCKET_ID && process.env.B2_BUCKET_ID !== 'your_actual_bucket_id_here') {
    console.log('🎉 All B2 credentials are configured! Ready to test.');
}
