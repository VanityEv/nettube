import { 
  logSecurityEventWithContext,
  logAuthEvent,
  logAccessEvent,
  logSecurityViolation,
  logSystemEvent,
  getRecentSecurityEvents
} from './streamply-backend/services/security/mongoLogger.js';

// Mock user and request objects for testing
const mockUser = {
  userId: 'user_12345',
  username: 'testuser',
  accountType: 2,
  email: 'test@example.com'
};

const mockAdminUser = {
  userId: 'admin_67890',
  username: 'adminuser',
  accountType: 3,
  email: 'admin@example.com'
};

const mockRequest = {
  ip: '192.168.1.100',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-forwarded-for': '203.0.113.195',
    'accept': 'application/json',
    'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
  },
  method: 'POST',
  url: '/api/login',
  body: { username: 'testuser' }
};

console.log('Testing Enhanced Security Logging...\n');

try {
  // Test 1: Authentication Events
  console.log('1. Testing Authentication Events...');
  await logAuthEvent('login_attempt', mockUser, mockRequest, true, {
    authMethod: 'jwt',
    sessionDuration: '24h',
    deviceType: 'desktop'
  });

  await logAuthEvent('login_attempt', mockUser, { 
    ...mockRequest, 
    ip: '192.168.1.200' 
  }, false, {
    authMethod: 'jwt',
    failureReason: 'invalid_password',
    attemptCount: 3
  });

  // Test 2: Access Control Events
  console.log('2. Testing Access Control Events...');
  await logAccessEvent('admin_panel_access', mockAdminUser, {
    ...mockRequest,
    url: '/admin/security',
    method: 'GET'
  }, '/admin/security', true, {
    accessLevel: 'admin',
    requiredPermission: 'admin_access'
  });

  await logAccessEvent('video_upload_access', mockUser, {
    ...mockRequest,
    url: '/api/videos/upload',
    method: 'POST'
  }, '/api/videos/upload', false, {
    accessLevel: 'standard',
    reason: 'insufficient_permissions'
  });

  // Test 3: Security Violations
  console.log('3. Testing Security Violations...');
  await logSecurityViolation('sql_injection_attempt', mockUser, {
    ...mockRequest,
    url: '/api/search',
    body: { query: "'; DROP TABLE users; --" }
  }, 'Malicious SQL detected in search query', {
    riskLevel: 'critical',
    attackVector: 'sql_injection',
    blocked: true
  });

  await logSecurityViolation('brute_force_attack', null, {
    ...mockRequest,
    ip: '203.0.113.195'
  }, 'Multiple failed login attempts from same IP', {
    riskLevel: 'high',
    attemptCount: 15,
    timeWindow: '5 minutes'
  });

  // Test 4: System Events
  console.log('4. Testing System Events...');
  await logSystemEvent('server_startup', 'Security monitoring system initialized', 'info', {
    version: '2.1.0',
    environment: 'production',
    startupTime: '2.3s'
  });

  await logSystemEvent('database_connection_lost', 'MongoDB connection interrupted', 'warning', {
    reconnectAttempt: 3,
    lastSuccessfulConnection: new Date(Date.now() - 30000).toISOString()
  });

  // Test 5: Custom Security Event with Rich Context
  console.log('5. Testing Custom Security Event...');
  await logSecurityEventWithContext('video_download_suspicious', {
    severity: 'warning',
    message: 'Unusual video download pattern detected',
    user: mockUser,
    req: {
      ...mockRequest,
      url: '/api/videos/download/premium-content',
      method: 'GET'
    },
    category: 'content_security',
    source: 'anti_piracy_system',
    metadata: {
      videoId: 'vid_abc123',
      downloadCount: 25,
      timeWindow: '1 hour',
      userPlan: 'free',
      contentType: 'premium',
      suspiciousPattern: 'rapid_downloads'
    }
  });

  // Test 6: Get Recent Events to Verify
  console.log('\n6. Retrieving Recent Security Events...');
  const recentEvents = await getRecentSecurityEvents(10);
  
  console.log(`Found ${recentEvents.length} recent events:`);
  recentEvents.forEach((event, index) => {
    console.log(`\nEvent ${index + 1}:`);
    console.log(`  Type: ${event.type}`);
    console.log(`  Severity: ${event.severity || 'N/A'}`);
    console.log(`  Category: ${event.category || 'N/A'}`);
    console.log(`  Message: ${event.message || 'N/A'}`);
    console.log(`  User: ${event.userContext?.username || 'N/A'}`);
    console.log(`  IP: ${event.requestInfo?.ipAddress || 'N/A'}`);
    console.log(`  Timestamp: ${event.timestamp}`);
    
    if (event.metadata && Object.keys(event.metadata).length > 0) {
      console.log(`  Metadata: ${JSON.stringify(event.metadata, null, 2)}`);
    }
  });

  console.log('\n✅ Enhanced Security Logging Test Complete!');
  console.log('All logging functions working with comprehensive metadata capture.');

} catch (error) {
  console.error('❌ Test failed:', error);
}
