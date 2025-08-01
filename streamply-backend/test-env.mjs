import * as dotenv from 'dotenv';
dotenv.config();

console.log('=== ENVIRONMENT VARIABLE TEST ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('B2_APPLICATION_KEY_ID:', process.env.B2_APPLICATION_KEY_ID);
console.log('B2_APPLICATION_KEY:', process.env.B2_APPLICATION_KEY ? '***PRESENT***' : 'MISSING');
console.log('B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME);
console.log('B2_BUCKET_ID:', process.env.B2_BUCKET_ID);

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('isDevelopment:', isDevelopment);
