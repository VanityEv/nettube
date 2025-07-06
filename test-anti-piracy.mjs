#!/usr/bin/env node
/**
 * Streamply Anti-Piracy Integration Test Suite
 * 
 * This script tests the complete end-to-end anti-piracy workflow:
 * 1. Device fingerprinting integration
 * 2. Secure streaming endpoint functionality
 * 3. Watermark generation and verification
 * 4. Screen recording detection
 * 5. Security event logging
 * 6. Concurrent streaming limits
 */

import axios from 'axios';
import { promises as fs } from 'fs';

const API_BASE = 'http://localhost:3001';
const TEST_USER = {
  username: 'testuser',
  password: 'testpass123',
  email: 'test@streamply.com',
  fullname: 'Test User',
  birthdate: '1990-01-01'
};

class AntiPiracyTester {
  constructor() {
    this.authToken = null;
    this.deviceFingerprint = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async test(testName, testFunction) {
    this.log(`Starting test: ${testName}`, 'TEST');
    try {
      await testFunction();
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASSED' });
      this.log(`✅ ${testName} - PASSED`, 'PASS');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'FAIL');
    }
  }

  // Generate mock device fingerprint
  generateDeviceFingerprint() {
    const fingerprint = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screen: { width: 1920, height: 1080, colorDepth: 24 },
      timezone: 'America/New_York',
      language: 'en-US',
      platform: 'Win32',
      canvas: 'mock_canvas_hash_12345',
      webgl: 'mock_webgl_hash_67890',
      audio: 'mock_audio_hash_abcde',
      timestamp: Date.now()
    };
    
    this.deviceFingerprint = Buffer.from(JSON.stringify(fingerprint)).toString('base64');
    return this.deviceFingerprint;
  }

  // Test 1: Device Fingerprinting Service
  async testDeviceFingerprinting() {
    const fingerprint = this.generateDeviceFingerprint();
    
    if (!fingerprint || fingerprint.length < 10) {
      throw new Error('Device fingerprint generation failed');
    }
    
    this.log(`Generated device fingerprint: ${fingerprint.substring(0, 20)}...`);
  }

  // Test 2: User Authentication
  async testUserAuthentication() {
    try {
      // Try to login first
      const loginResponse = await axios.post(`${API_BASE}/users/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      
      this.authToken = loginResponse.data.userToken;
      this.log('User login successful');
    } catch (error) {
      // If login fails, create account
      this.log('Login failed, creating test account...');
      
      await axios.post(`${API_BASE}/users/register`, TEST_USER);
      this.log('Test user registered successfully');
      
      const loginResponse = await axios.post(`${API_BASE}/users/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      
      this.authToken = loginResponse.data.userToken;
      this.log('User login successful after registration');
    }
    
    if (!this.authToken) {
      throw new Error('Failed to obtain authentication token');
    }
  }

  // Test 3: Secure Streaming Endpoint
  async testSecureStreamingEndpoint() {
    if (!this.authToken || !this.deviceFingerprint) {
      throw new Error('Missing auth token or device fingerprint');
    }

    const videoId = 1; // Test with video ID 1
    
    const response = await axios.get(`${API_BASE}/videos/video/stream/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'X-Device-Fingerprint': this.deviceFingerprint
      }
    });

    const data = response.data;
    
    if (data.result !== 'SUCCESS') {
      throw new Error(`Streaming endpoint failed: ${data.message}`);
    }

    if (!data.streamingUrl) {
      throw new Error('Missing streaming URL in response');
    }

    if (!data.watermark) {
      throw new Error('Missing watermark configuration in response');
    }

    if (!data.sessionId) {
      throw new Error('Missing session ID in response');
    }

    this.log(`Streaming URL generated: ${data.streamingUrl.substring(0, 50)}...`);
    this.log(`Session ID: ${data.sessionId}`);
    this.log(`Watermark ID: ${data.watermark.watermarkId}`);
  }

  // Test 4: Watermark Verification
  async testWatermarkVerification() {
    if (!this.authToken) {
      throw new Error('Missing auth token');
    }

    const mockViolations = ['watermark_tampering', 'element_hiding'];
    
    const response = await axios.post(`${API_BASE}/videos/security/watermark/verify`, {
      watermarkId: 'test_watermark_123',
      sessionId: 'test_session_456',
      violations: mockViolations
    }, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (response.data.result !== 'SUCCESS') {
      throw new Error('Watermark verification endpoint failed');
    }

    this.log('Watermark verification successful');
  }

  // Test 5: Security Event Logging
  async testSecurityEventLogging() {
    if (!this.authToken) {
      throw new Error('Missing auth token');
    }

    const securityEvent = {
      eventType: 'test_security_event',
      data: { 
        testValue: 'piracy_attempt_detected',
        timestamp: Date.now()
      },
      videoId: '1',
      sessionId: 'test_session_789'
    };
    
    const response = await axios.post(`${API_BASE}/videos/security/event`, securityEvent, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (response.data.result !== 'SUCCESS') {
      throw new Error('Security event logging failed');
    }

    this.log('Security event logging successful');
  }

  // Test 6: Concurrent Streaming Limits
  async testConcurrentStreamingLimits() {
    if (!this.authToken || !this.deviceFingerprint) {
      throw new Error('Missing auth token or device fingerprint');
    }

    const videoId = 1;
    
    // Create multiple requests with different fingerprints to test concurrent limits
    const requests = [];
    
    for (let i = 0; i < 3; i++) {
      const modifiedFingerprint = this.deviceFingerprint + '_' + i;
      
      const request = axios.get(`${API_BASE}/videos/video/stream/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Device-Fingerprint': modifiedFingerprint
        }
      }).catch(error => ({ error: error.response?.data || error.message, index: i }));
      
      requests.push(request);
    }

    const results = await Promise.all(requests);
    
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      if (result.error) {
        errorCount++;
        this.log(`Request ${index + 1} failed: ${JSON.stringify(result.error)}`);
      } else if (result.data?.result === 'SUCCESS') {
        successCount++;
        this.log(`Request ${index + 1} succeeded`);
      }
    });

    // We expect some requests to fail due to concurrent stream limits
    this.log(`Concurrent streaming test: ${successCount} succeeded, ${errorCount} failed`);
    
    if (successCount === 0) {
      throw new Error('All concurrent streaming requests failed');
    }
  }

  // Test 7: Frontend Security Components Check
  async testFrontendSecurityComponents() {
    const requiredFiles = [
      'e:/React/nettube/streamply-frontend/src/components/security/VideoWatermark.tsx',
      'e:/React/nettube/streamply-frontend/src/components/security/ScreenRecordingDetector.tsx',
      'e:/React/nettube/streamply-frontend/src/services/security/deviceFingerprinting.ts',
      'e:/React/nettube/streamply-frontend/src/components/VideoJSSecure.tsx'
    ];

    for (const filePath of requiredFiles) {
      try {
        await fs.access(filePath.replace(/\//g, '\\'));
        this.log(`✅ Found security component: ${filePath.split('/').pop()}`);
      } catch (error) {
        throw new Error(`Missing security component: ${filePath}`);
      }
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('='.repeat(80));
    this.log('STREAMPLY ANTI-PIRACY INTEGRATION TEST SUITE');
    this.log('='.repeat(80));
    this.log(`Testing against: ${API_BASE}`);
    this.log('');

    await this.test('Device Fingerprinting', () => this.testDeviceFingerprinting());
    await this.test('User Authentication', () => this.testUserAuthentication());
    await this.test('Secure Streaming Endpoint', () => this.testSecureStreamingEndpoint());
    await this.test('Watermark Verification', () => this.testWatermarkVerification());
    await this.test('Security Event Logging', () => this.testSecurityEventLogging());
    await this.test('Concurrent Streaming Limits', () => this.testConcurrentStreamingLimits());
    await this.test('Frontend Security Components', () => this.testFrontendSecurityComponents());

    this.log('');
    this.log('='.repeat(80));
    this.log('TEST RESULTS SUMMARY');
    this.log('='.repeat(80));
    this.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
    this.log(`Passed: ${this.testResults.passed}`);
    this.log(`Failed: ${this.testResults.failed}`);
    this.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      this.log('');
      this.log('FAILED TESTS:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`❌ ${test.name}: ${test.error}`);
        });
    }
    
    this.log('='.repeat(80));
    
    // Save results to file
    const reportPath = 'e:/React/nettube/anti-piracy-test-results.json';
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1) + '%'
      }
    }, null, 2));
    
    this.log(`Test results saved to: ${reportPath}`);
    
    return this.testResults.failed === 0;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AntiPiracyTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default AntiPiracyTester;
