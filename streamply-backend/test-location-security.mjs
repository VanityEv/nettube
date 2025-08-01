import { sendConfirmationEmail, sendNewDeviceAlert } from './services/mail/Mail.js';
import { getLocationFromIP, generateVerificationCode, getDeviceInfo } from './services/security/locationSecurity.js';
import { 
  isDeviceTrusted, 
  addTrustedDevice, 
  getUserTrustedDevices,
  generateDeviceFingerprint 
} from './services/security/trustedDeviceService.js';
import crypto from 'crypto';

console.log('=== Testing Enhanced Device Tracking System ===\n');

// Test 1: Basic confirmation email
console.log('1. Testing confirmation email...');
try {
  const result = await sendConfirmationEmail('pawelsatora@gmail.com', 'test-token-' + Date.now());
  console.log('✅ Confirmation email result:', result.success ? 'SUCCESS' : 'FAILED');
} catch (error) {
  console.log('❌ Confirmation email failed:', error.message);
}

// Test 2: Location detection
console.log('\n2. Testing location detection...');
const testLocations = ['127.0.0.1', '8.8.8.8', '1.1.1.1'];
for (const ip of testLocations) {
  const location = getLocationFromIP(ip);
  console.log(`  IP ${ip}: ${location.city}, ${location.region}, ${location.country}`);
}

// Test 3: Device info extraction
console.log('\n3. Testing device detection...');
const mockReq = {
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-device-fingerprint': 'test-fingerprint-123'
  }
};
const deviceInfo = getDeviceInfo(mockReq);
console.log('  Device Info:', deviceInfo);

// Test 4: Device fingerprint generation
console.log('\n4. Testing device fingerprint generation...');
const fingerprint = generateDeviceFingerprint(deviceInfo);
console.log('  Generated fingerprint:', fingerprint);
console.log('  Fingerprint length:', fingerprint.length);

// Test 5: Trusted device management
console.log('\n5. Testing trusted device management...');
try {
  // Get a real user from the database for testing
  const { findOneUser } = await import('./services/user/User.js');
  
  await new Promise((resolve, reject) => {
    findOneUser('Vanity', async (result) => {
      try {
        if (result && result.length > 0) {
          const testUserId = result[0].id; // Use real user ID
          const testLocation = getLocationFromIP('8.8.8.8');
          
          console.log('  Using user ID for test:', testUserId);
          
          // Test if device is initially not trusted
          const initialTrust = await isDeviceTrusted(testUserId, deviceInfo);
          console.log('  Initial device trust status:', initialTrust);
          
          // Add device as trusted
          console.log('  Adding device as trusted...');
          await addTrustedDevice(testUserId, deviceInfo, testLocation, '8.8.8.8');
          console.log('  ✅ Device added as trusted');
          
          // Check if device is now trusted
          const afterAddTrust = await isDeviceTrusted(testUserId, deviceInfo);
          console.log('  Device trust status after adding:', afterAddTrust);
          
          // Get user's trusted devices
          const trustedDevices = await getUserTrustedDevices(testUserId);
          console.log('  User trusted devices count:', trustedDevices.length);
          if (trustedDevices.length > 0) {
            console.log('  First trusted device:', {
              device_name: trustedDevices[0].device_name,
              device_type: trustedDevices[0].device_type,
              browser_name: trustedDevices[0].browser_name,
              os_name: trustedDevices[0].os_name,
              last_location: trustedDevices[0].last_location
            });
          }
          
          resolve();
        } else {
          console.log('❌ User not found for device test');
          resolve();
        }
      } catch (error) {
        console.log('❌ Trusted device management failed:', error.message);
        console.error('Full error:', error);
        resolve();
      }
    });
  });
  
} catch (error) {
  console.log('❌ Database connection failed:', error.message);
}

// Test 6: Verification code generation
// Test 6: Verification code generation
console.log('\n6. Testing verification code...');
const code = generateVerificationCode();
console.log('  Generated code:', code, '(length:', code.length, ')');

// Test 7: New device alert email
console.log('\n7. Testing new device alert email...');
try {
  const location = getLocationFromIP('8.8.8.8');
  const device = getDeviceInfo(mockReq);
  const verificationCode = generateVerificationCode();
  
  const result = await sendNewDeviceAlert('pawelsatora@gmail.com', device, location, verificationCode);
  console.log('✅ New device alert result:', result.success ? 'SUCCESS' : 'FAILED');
} catch (error) {
  console.log('❌ New device alert failed:', error.message);
}

console.log('\n=== Device Tracking Test Complete ===');

// Test 8: Database user query (previous test)
console.log('\n8. Testing database user query...');
try {
  // Import the user function to test what it returns
  const { findOneUser } = await import('./services/user/User.js');
  
  await findOneUser('Vanity', (result) => {
    if (result && result.length > 0) {
      const user = result[0];
      console.log('Database user object:');
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
      console.log('  Confirmed field:', user.confirmed);
      console.log('  Confirmed type:', typeof user.confirmed);
      console.log('  Boolean conversion:', Boolean(user.confirmed));
      console.log('  Strict boolean check:', user.confirmed === true);
      console.log('  Loose boolean check:', !!user.confirmed);
    } else {
      console.log('❌ User not found');
    }
  });
} catch (error) {
  console.log('❌ Database test failed:', error.message);
}
