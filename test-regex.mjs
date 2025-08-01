// Test the regex pattern for playlist URL rewriting

const content = `#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360
360p.m3u8`;

console.log('Original content:');
console.log(content);
console.log('\nContent lines:');
console.log(content.split('\n'));

const baseUrl = 'http://localhost:3001';
const videoId = 'cafe1431-7eb6-4070-8bdf-3be07325008f';
const sessionId = 'test-session-123';

// Test the regex
const rewritten = content.replace(
  /(\d+p\.m3u8)/g,
  `${baseUrl}/videos/video/hls/${videoId}/$1?session=${sessionId}`
);

console.log('\nRewritten content:');
console.log(rewritten);
console.log('\nWas replacement made?', content !== rewritten);
