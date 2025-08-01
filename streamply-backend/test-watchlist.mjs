import { addLike, deleteLike, userLikes } from './services/user/User.js';
import { getAllVideos } from './services/video/Video.js';
import { findOneUser } from './services/user/User.js';

console.log('=== Testing Watchlist Functionality ===\n');

// First get real IDs from database
console.log('Getting real user and video IDs from database...');

let testUserId, testVideoId, testUsername = 'Vanity';

try {
  // Get user ID
  await new Promise((resolve) => {
    findOneUser(testUsername, (result) => {
      if (result && result.length > 0) {
        testUserId = result[0].id;
        console.log('Found user ID:', testUserId);
      } else {
        console.log('❌ User not found');
      }
      resolve();
    });
  });

  // Get video ID
  await new Promise((resolve) => {
    getAllVideos((result) => {
      if (result && result.length > 0) {
        testVideoId = result[0].id;
        console.log('Found video ID:', testVideoId);
        console.log('Video title:', result[0].title);
      } else {
        console.log('❌ No videos found');
      }
      resolve();
    });
  });

  if (!testUserId || !testVideoId) {
    console.log('❌ Missing required IDs, aborting test');
    process.exit(1);
  }

  console.log('\n1. Testing add to watchlist...');
  await new Promise((resolve) => {
    addLike(testUsername, testVideoId, (result) => {
      if (result.error) {
        console.log('❌ Add like failed:', result.error);
      } else {
        console.log('✅ Add like success:', result);
      }
      resolve();
    });
  });

  console.log('\n2. Testing get user likes...');
  await new Promise((resolve) => {
    userLikes(testUsername, (result) => {
      if (result.error) {
        console.log('❌ Get likes failed:', result.error);
      } else {
        console.log('✅ User likes count:', result.length);
        if (result.length > 0) {
          console.log('First liked video ID:', result[0].video_id);
        }
      }
      resolve();
    });
  });

  console.log('\n3. Testing remove from watchlist...');
  await new Promise((resolve) => {
    deleteLike(testUsername, testVideoId, (result) => {
      if (result.error) {
        console.log('❌ Delete like failed:', result.error);
      } else {
        console.log('✅ Delete like success:', result);
      }
      resolve();
    });
  });

} catch (error) {
  console.log('❌ Test error:', error.message);
}

console.log('\n=== Watchlist Test Complete ===');
