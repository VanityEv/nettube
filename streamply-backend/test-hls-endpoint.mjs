#!/usr/bin/env node

/**
 * Test script to verify HLS endpoint functionality
 */

import jwt from 'jsonwebtoken';

console.log('=== HLS ENDPOINT TEST ===');

// Test the HLS endpoint with a mock token
async function testHLSEndpoint() {
  try {
    // Create a test JWT token
    const testToken = jwt.sign(
      { 
        sub: 'test-user-id',
        username: 'test-user', 
        account_type: 3,
        tokenType: 'access',
        jti: 'test-jti'
      }, 
      process.env.JWT_SECRET,
      { 
        algorithm: 'HS256',
        expiresIn: '1h' 
      }
    );
    
    console.log('Generated test token:', testToken.substring(0, 50) + '...');
    
    // Test video ID (replace with actual video ID from database)
    const testVideoId = 'cafe1431-7eb6-4070-8bdf-3be07325008f'; // Drumming video
    
    // Test the HLS playlist endpoint
    const hlsUrl = `http://localhost:3001/videos/video/hls/${testVideoId}/playlist.m3u8?token=${encodeURIComponent(testToken)}`;
    
    console.log('\nTesting HLS endpoint:');
    console.log('URL:', hlsUrl);
    
    const response = await fetch(hlsUrl);
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse body:');
    console.log(text);
    
    if (response.status === 200) {
      console.log('\n✅ HLS endpoint is working!');
      
      // Check if URLs are properly rewritten
      if (text.includes('/video/hls/')) {
        console.log('✅ URLs are properly rewritten to use backend proxy');
      } else {
        console.log('❌ URLs are not rewritten - still pointing to B2 directly');
      }
    } else {
      console.log('\n❌ HLS endpoint failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testHLSEndpoint();
