import { 
  isDeviceTrusted, 
  addTrustedDevice, 
  getUserTrustedDevices,
  generateDeviceFingerprint 
} from './services/security/trustedDeviceService.js';
import { performSecurityCheck, getDeviceInfo, getLocationFromIP } from './services/security/locationSecurity.js';

console.log('=== Testing Device Fingerprinting System ===\n');

// Test device info
const mockReq = {
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-device-fingerprint': 'test-fingerprint-123'
  },
  ip: '127.0.0.1'
};

const mockUser = {
  id: '12345678-1234-1234-1234-123456789012', // UUID format
  email: 'test@example.com',
  username: 'testuser'
};

async function testDeviceTracking() {
  console.log('1. Testing device info extraction...');
  const deviceInfo = getDeviceInfo(mockReq);
  console.log('  Device info:', JSON.stringify(deviceInfo, null, 2));
  
  console.log('\n2. Testing device fingerprint generation...');
  const fingerprint = generateDeviceFingerprint(deviceInfo);
  console.log('  Generated fingerprint:', fingerprint);
  
  console.log('\n3. Testing if device is trusted (should be false)...');
  const isTrusted = await isDeviceTrusted(mockUser.id, deviceInfo);
  console.log('  Is trusted:', isTrusted);
  
  console.log('\n4. Testing security check with new device...');
  try {
    const securityCheck = await performSecurityCheck(mockReq, mockUser);
    console.log('  Security check result:', JSON.stringify(securityCheck, null, 2));
    console.log('  Requires verification:', securityCheck.requiresVerification);
    console.log('  Alert type:', securityCheck.alertType);
  } catch (error) {
    console.log('  Security check error:', error.message);
  }
  
  console.log('\n5. Testing adding device to trusted list...');
  try {
    const locationInfo = getLocationFromIP(mockReq.ip);
    const result = await addTrustedDevice(mockUser.id, deviceInfo, locationInfo, mockReq.ip);
    console.log('  Added trusted device:', result ? 'SUCCESS' : 'FAILED');
    if (result) {
      console.log('  Device ID:', result.id);
      console.log('  Device name:', result.device_name);
      console.log('  Location:', result.last_location);
    }
  } catch (error) {
    console.log('  Add trusted device error:', error.message);
  }
  
  console.log('\n6. Testing if device is now trusted...');
  const isTrustedNow = await isDeviceTrusted(mockUser.id, deviceInfo);
  console.log('  Is now trusted:', isTrustedNow);
  
  console.log('\n7. Testing security check with trusted device...');
  try {
    const securityCheck2 = await performSecurityCheck(mockReq, mockUser);
    console.log('  Security check result:', JSON.stringify(securityCheck2, null, 2));
    console.log('  Requires verification:', securityCheck2.requiresVerification);
    console.log('  Alert type:', securityCheck2.alertType);
  } catch (error) {
    console.log('  Security check error:', error.message);
  }
  
  console.log('\n8. Testing get user trusted devices...');
  try {
    const trustedDevices = await getUserTrustedDevices(mockUser.id);
    console.log('  Trusted devices count:', trustedDevices.length);
    if (trustedDevices.length > 0) {
      console.log('  First device:', JSON.stringify(trustedDevices[0], null, 2));
    }
  } catch (error) {
    console.log('  Get trusted devices error:', error.message);
  }
}

// Run the test
testDeviceTracking().then(() => {
  console.log('\n=== Device Tracking Test Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
