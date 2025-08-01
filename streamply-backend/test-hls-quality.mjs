import { config } from 'dotenv';
config();

const BACKEND_URL = 'http://localhost:3001';
const VIDEO_ID = '66f6ee0a5b5fc4e86cf09f21';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlZhbml0eSIsImFjY291bnRfdHlwZSI6MywiaWF0IjoxNzUzODgxNDQ1fQ.edL3FW9NJi0_Dqps30ZMmj7H0mBuaxcTl8Y72WXEGWg';

async function testQualityPlaylists() {
    console.log('🎯 Testing HLS Quality Playlists');
    console.log('================================');
    
    try {
        // Step 1: Create streaming session
        console.log('📝 Creating streaming session...');
        const streamResponse = await fetch(`${BACKEND_URL}/videos/video/stream/${VIDEO_ID}`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!streamResponse.ok) {
            throw new Error(`Stream session failed: ${streamResponse.status} ${streamResponse.statusText}`);
        }
        
        const streamData = await streamResponse.json();
        console.log('✅ Session created:', {
            sessionId: streamData.sessionId,
            masterPlaylist: streamData.hlsUrl
        });
        
        // Step 2: Get master playlist to see available qualities
        console.log('\n📋 Fetching master playlist...');
        const masterResponse = await fetch(streamData.hlsUrl);
        
        if (!masterResponse.ok) {
            throw new Error(`Master playlist failed: ${masterResponse.status}`);
        }
        
        const masterContent = await masterResponse.text();
        console.log('📄 Master playlist content:');
        console.log(masterContent);
        
        // Extract quality URLs from master playlist
        const qualityMatches = masterContent.match(/(\d+p\.m3u8)/g);
        if (!qualityMatches || qualityMatches.length === 0) {
            console.log('⚠️  No quality playlists found in master playlist');
            return;
        }
        
        console.log('🎯 Found quality playlists:', qualityMatches);
        
        // Step 3: Test each quality playlist
        for (const qualityFile of qualityMatches) {
            const quality = qualityFile.replace('.m3u8', '');
            console.log(`\n🔍 Testing ${quality} playlist...`);
            
            const qualityUrl = `${BACKEND_URL}/videos/video/hls/${VIDEO_ID}/${qualityFile}?session=${streamData.sessionId}`;
            console.log(`📡 Quality URL: ${qualityUrl}`);
            
            const qualityResponse = await fetch(qualityUrl);
            console.log(`📊 Response status: ${qualityResponse.status} ${qualityResponse.statusText}`);
            
            if (qualityResponse.ok) {
                const qualityContent = await qualityResponse.text();
                console.log(`📄 ${quality} content preview:`, qualityContent.substring(0, 200) + '...');
                
                // Check if it's actually quality-specific content (not master playlist)
                if (qualityContent.includes('#EXT-X-STREAM-INF')) {
                    console.log(`❌ ${quality} returned master playlist content (fallback happened)`);
                } else if (qualityContent.includes('#EXTINF')) {
                    console.log(`✅ ${quality} returned proper segment playlist`);
                } else {
                    console.log(`❓ ${quality} returned unknown content type`);
                }
            } else {
                console.log(`❌ ${quality} failed: ${qualityResponse.status}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    }
}

testQualityPlaylists();
