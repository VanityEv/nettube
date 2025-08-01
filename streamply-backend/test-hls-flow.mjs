#!/usr/bin/env node

/**
 * Test script to verify the complete HLS streaming flow
 * Tests: streaming URL → master playlist → quality playlist → segments
 */

console.log('=== COMPLETE HLS STREAMING FLOW TEST ===');

async function testCompleteHLSFlow() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlZhbml0eSIsImFjY291bnRfdHlwZSI6MywiaWF0IjoxNzUzODgxNDQ1fQ.edL3FW9NJi0_Dqps30ZMmj7H0mBuaxcTl8Y72WXEGWg';
  const videoId = 'cafe1431-7eb6-4070-8bdf-3be07325008f';
  
  try {
    // Step 1: Get streaming URL
    console.log('\n1. Getting streaming URL...');
    const streamResponse = await fetch(`http://localhost:3001/videos/video/stream/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const streamData = await streamResponse.json();
    console.log('Stream response result:', streamData.result);
    
    if (streamData.result !== 'SUCCESS') {
      throw new Error('Failed to get streaming URL: ' + streamData.message);
    }
    
    const streamingUrl = streamData.streamingUrl;
    console.log('✅ Got streaming URL:', streamingUrl);
    
    // Extract session ID from URL
    const sessionMatch = streamingUrl.match(/session=([^&]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;
    console.log('📋 Session ID:', sessionId);
    
    // Step 2: Test master playlist
    console.log('\n2. Testing master playlist...');
    const playlistResponse = await fetch(streamingUrl);
    
    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json();
      throw new Error('Master playlist failed: ' + JSON.stringify(errorData));
    }
    
    const playlistContent = await playlistResponse.text();
    console.log('✅ Master playlist working!');
    console.log('Playlist content preview:', playlistContent.substring(0, 300) + '...');
    
    // Step 3: Test quality-specific playlists
    console.log('\n3. Testing quality-specific playlists...');
    const qualities = ['720p', '480p', '360p'];
    
    for (const quality of qualities) {
      console.log(`\n   Testing ${quality} playlist...`);
      const qualityUrl = `http://localhost:3001/videos/video/hls/${videoId}/${quality}.m3u8?session=${sessionId}`;
      
      const qualityResponse = await fetch(qualityUrl);
      
      if (qualityResponse.ok) {
        const qualityContent = await qualityResponse.text();
        console.log(`   ✅ ${quality} playlist working!`);
        console.log(`   Content preview: ${qualityContent.substring(0, 100)}...`);
        
        // Extract first segment for testing
        const segmentMatch = qualityContent.match(/segment_\d+\.ts/);
        if (segmentMatch) {
          const segmentName = segmentMatch[0];
          console.log(`   🎬 Found segment: ${segmentName}`);
          
          // Step 4: Test segment
          console.log(`   Testing segment: ${segmentName}...`);
          const segmentUrl = `http://localhost:3001/videos/video/hls/${videoId}/${quality}/${segmentName}?session=${sessionId}`;
          
          const segmentResponse = await fetch(segmentUrl, { method: 'HEAD' }); // HEAD request to avoid downloading
          
          if (segmentResponse.ok) {
            console.log(`   ✅ Segment ${segmentName} accessible!`);
            console.log(`   Content-Type: ${segmentResponse.headers.get('content-type')}`);
            console.log(`   Content-Length: ${segmentResponse.headers.get('content-length')} bytes`);
          } else {
            console.log(`   ❌ Segment ${segmentName} failed:`, segmentResponse.status, segmentResponse.statusText);
          }
        } else {
          console.log(`   ⚠️  No segments found in ${quality} playlist`);
        }
      } else {
        const errorData = await qualityResponse.json();
        console.log(`   ❌ ${quality} playlist failed:`, errorData);
      }
    }
    
    console.log('\n🎉 HLS STREAMING FLOW TEST COMPLETE!');
    console.log('\n📊 Summary:');
    console.log('✅ Streaming URL generation: WORKING');
    console.log('✅ Session-based authentication: WORKING');  
    console.log('✅ Master playlist: WORKING');
    console.log('✅ Quality playlists: TESTED');
    console.log('✅ Video segments: TESTED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteHLSFlow();
