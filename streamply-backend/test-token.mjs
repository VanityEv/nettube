import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

// Create a test token
const testPayload = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com'
};

const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log('Test token generated:');
console.log('Length:', testToken.length);
console.log('First 50 chars:', testToken.substring(0, 50));
console.log('Structure check:', testToken.split('.').length === 3 ? 'Valid JWT format' : 'Invalid JWT format');

// Test verification
try {
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('Token verification successful:', decoded.username);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

// Test URL encoding
const encoded = encodeURIComponent(testToken);
const decoded = decodeURIComponent(encoded);
console.log('URL encoding test:', testToken === decoded ? 'OK' : 'FAILED');
