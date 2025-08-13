/**
 * Debug OTP/Verification System 
 * Test endpoint to debug why verification codes are not working
 */

import { generateVerificationCode, storeVerificationCode, verifyCode } from '../services/security/locationSecurity.js';
import { generateAndSendOtp, verifyOtp } from '../services/mail/MailSendGrid.js';

export async function debugOTPSystem(req, res) {
  const testUserId = 'test-user-' + Date.now();
  
  console.log('🧪 Starting OTP System Debug Test...');
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        locationSecurityOTP: {},
        mailSendGridOTP: {}
      }
    };
    
    // Test 1: LocationSecurity OTP System (used for new devices)
    console.log('📱 Testing LocationSecurity OTP system...');
    
    const verificationCode = generateVerificationCode();
    console.log(`Generated verification code: ${verificationCode}`);
    
    await storeVerificationCode(testUserId, verificationCode);
    console.log(`Stored verification code for user: ${testUserId}`);
    
    // Test valid code
    const validTest = await verifyCode(testUserId, verificationCode);
    console.log(`Valid code test result:`, validTest);
    
    // Test invalid code
    const invalidTest = await verifyCode(testUserId, '999999');
    console.log(`Invalid code test result:`, invalidTest);
    
    results.tests.locationSecurityOTP = {
      generatedCode: verificationCode,
      validCodeTest: validTest,
      invalidCodeTest: invalidTest,
      status: validTest.valid ? 'WORKING' : 'FAILED'
    };
    
    // Test 2: MailSendGrid OTP System (used for MFA)
    console.log('📧 Testing MailSendGrid OTP system...');
    
    const testUserId2 = 'test-user-2-' + Date.now();
    const testEmail = 'test@example.com';
    
    // Generate OTP (won't actually send email in test)
    const otpResult = await generateAndSendOtp(testEmail, testUserId2);
    console.log(`OTP generation result:`, otpResult);
    
    // We can't easily test this system without knowing the generated OTP
    // as it's stored internally in MailSendGrid.js
    
    results.tests.mailSendGridOTP = {
      generationResult: otpResult,
      status: otpResult.success ? 'GENERATION_OK' : 'GENERATION_FAILED',
      note: 'Cannot test verification without access to internal OTP store'
    };
    
    // Test 3: Check if there are conflicts between systems
    const systemAnalysis = {
      bothSystemsPresent: true,
      locationSecurityUses: 'Redis + memory fallback with verifyCode()',
      mailSendGridUses: 'Internal Map with verifyOtp()',
      potentialConflicts: [
        'Different storage mechanisms',
        'Different function names', 
        'Possible async/await issues'
      ]
    };
    
    results.systemAnalysis = systemAnalysis;
    
    console.log('✅ OTP Debug Test Complete');
    res.status(200).json({
      status: 'OTP Debug Test Complete',
      results
    });
    
  } catch (error) {
    console.error('❌ OTP Debug Test Error:', error);
    res.status(500).json({
      error: 'OTP Debug Test Failed',
      message: error.message,
      stack: error.stack
    });
  }
}

export default debugOTPSystem;
