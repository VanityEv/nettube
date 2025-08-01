// Test script to add sample security events to MongoDB
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
const dbName = 'streamply_logs';
const collectionName = 'security_events';

async function addTestSecurityEvents() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Clear existing test events
    await collection.deleteMany({ test: true });
    
    const now = new Date();
    const testEvents = [
      {
        type: 'login_success',
        severity: 'info',
        message: 'User successfully logged in',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        metadata: { username: 'test_user', ip: '192.168.1.100' },
        test: true
      },
      {
        type: 'video_deleted',
        severity: 'info',
        message: 'Video successfully deleted',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        metadata: { videoId: 'test_video_123', title: 'Test Movie' },
        test: true
      },
      {
        type: 'watermark_violation',
        severity: 'critical',
        message: 'Watermark tampering detected',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        metadata: { videoId: 'test_video_456', userId: 'suspicious_user' },
        test: true
      },
      {
        type: 'streaming_violation',
        severity: 'warning',
        message: 'Concurrent streaming limit exceeded',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        metadata: { userId: 'user_123', deviceCount: 5 },
        test: true
      },
      {
        type: 'login_failed',
        severity: 'warning',
        message: 'Failed login attempt',
        timestamp: new Date(now.getTime() - 75 * 60 * 1000), // 1.25 hours ago
        metadata: { username: 'attacker', ip: '192.168.1.999' },
        test: true
      },
      {
        type: 'auth_failure',
        severity: 'warning',
        message: 'Authentication failed - invalid token',
        timestamp: new Date(now.getTime() - 90 * 60 * 1000), // 1.5 hours ago
        metadata: { ip: '10.0.0.1', endpoint: '/admin/security' },
        test: true
      },
      {
        type: 'video_processing_success',
        severity: 'info',
        message: 'Video processing completed successfully',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: { videoId: 'processed_video_789', duration: '01:45:30' },
        test: true
      },
      {
        type: 'suspicious_query',
        severity: 'warning',
        message: 'Suspicious SQL injection attempt detected',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        metadata: { ip: '192.168.1.666', query: 'SELECT * FROM users WHERE id=1 OR 1=1' },
        test: true
      }
    ];
    
    const result = await collection.insertMany(testEvents);
    console.log(`✅ Inserted ${result.insertedCount} test security events`);
    
    // Verify the data
    const count = await collection.countDocuments();
    console.log(`📊 Total security events in database: ${count}`);
    
    const recentEvents = await collection.find().sort({ timestamp: -1 }).limit(5).toArray();
    console.log('📝 Recent events:');
    recentEvents.forEach(event => {
      console.log(`  - ${event.type} (${event.severity}) - ${event.message}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding test events:', error);
  } finally {
    await client.close();
  }
}

addTestSecurityEvents();
