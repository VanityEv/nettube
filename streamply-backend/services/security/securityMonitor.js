// services/security/securityMonitor.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'streamply_logs';
const collectionName = 'security_events';

let client, collection;

// Severity levels mapping
const SEVERITY_LEVELS = {
  'critical': 4,
  'warning': 3,
  'info': 2,
  'debug': 1
};

const SEVERITY_COLORS = {
  'critical': '#dc2626', // red-600
  'warning': '#d97706',  // amber-600
  'info': '#2563eb',     // blue-600
  'debug': '#6b7280'     // gray-500
};

// Event type categorization
const EVENT_CATEGORIES = {
  // Content Management
  'video_deleted': 'content_management',
  'episode_deleted': 'content_management',
  'video_deletion_error': 'content_management',
  'episode_deletion_error': 'content_management',
  
  // Authentication (match your actual event names)
  'login_success': 'authentication',
  'login_failed': 'authentication', 
  'user_logout': 'authentication',
  
  // Access Control
  'unauthorized_content_access': 'access_control',
  'subscription_check': 'access_control',
  'subscription_verification_error': 'access_control',
  
  // Security Violations
  'watermark_violation': 'security_violation',
  'streaming_violation': 'security_violation',
  'video_piracy_attempt': 'security_violation',
  'screen_recording_detected': 'security_violation',
  'unusual_streaming_pattern': 'security_violation',
  'concurrent_limit_exceeded': 'security_violation',
  'device_sharing_detected': 'security_violation',
  
  // System Security
  'api_rate_limit_exceeded': 'system_security',
  'unauthorized_access_attempt': 'system_security',
  'auth_failure': 'system_security',
  'suspicious_query': 'system_security',
  'suspicious_body': 'system_security',
  
  // Operations
  'watermark_generated': 'operations',
  'video_processing_success': 'operations',
  'video_processing_error': 'operations',
  'episode_processing_success': 'operations',
  'episode_processing_error': 'operations',
  'movie_upload_error': 'operations',
  'episode_upload_error': 'operations',
  'streaming_error': 'operations',
  'avatar_upload_success': 'operations',
  'avatar_upload_error': 'operations',
  'avatar_fetch_error': 'operations',
  'server_start': 'operations'
};

async function connectToMongo() {
  if (!client) {
    try {
      client = new MongoClient(uri, { useUnifiedTopology: true });
      await client.connect();
      collection = client.db(dbName).collection(collectionName);
      console.log('✅ MongoDB connected for security monitoring');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      return false;
    }
  }
  return true;
}

// Get security events with filtering and pagination
export async function getSecurityEvents(options = {}) {
  try {
    const connected = await connectToMongo();
    if (!connected) return { events: [], total: 0, summary: {} };

    const {
      page = 1,
      limit = 50,
      severity = null,
      eventType = null,
      startDate = null,
      endDate = null,
      category = null
    } = options;

    // Build filter query
    const filter = {};
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (eventType) {
      filter.type = eventType;
    }
    
    if (category) {
      const categoryTypes = Object.keys(EVENT_CATEGORIES).filter(
        key => EVENT_CATEGORIES[key] === category
      );
      filter.type = { $in: categoryTypes };
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get total count
    const total = await collection.countDocuments(filter);

    // Get paginated events
    const skip = (page - 1) * limit;
    const events = await collection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get summary statistics
    const summary = await getEventsSummary();

    return {
      events: events.map(event => ({
        ...event,
        category: EVENT_CATEGORIES[event.type] || 'uncategorized',
        severityLevel: SEVERITY_LEVELS[event.severity] || 1,
        severityColor: SEVERITY_COLORS[event.severity] || '#6b7280'
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary
    };
  } catch (error) {
    console.error('Error fetching security events:', error);
    return { events: [], total: 0, summary: {} };
  }
}

// Get summary statistics for dashboard
export async function getEventsSummary(timeRange = '24h') {
  try {
    const connected = await connectToMongo();
    if (!connected) return {};

    // Calculate time filter
    const now = new Date();
    let startTime;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const timeFilter = { timestamp: { $gte: startTime } };

    // Get severity breakdown
    const severityBreakdown = await collection.aggregate([
      { $match: timeFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get category breakdown
    const categoryBreakdown = await collection.aggregate([
      { $match: timeFilter },
      {
        $addFields: {
          category: {
            $switch: {
              branches: Object.keys(EVENT_CATEGORIES).map(type => ({
                case: { $eq: ['$type', type] },
                then: EVENT_CATEGORIES[type]
              })),
              default: 'uncategorized'
            }
          }
        }
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get hourly timeline for charts
    const hourlyEvents = await collection.aggregate([
      { $match: timeFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] }
          },
          info: {
            $sum: { $cond: [{ $eq: ['$severity', 'info'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Get top event types
    const topEventTypes = await collection.aggregate([
      { $match: timeFilter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Total events count
    const totalEvents = await collection.countDocuments(timeFilter);

    return {
      totalEvents,
      severityBreakdown: severityBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      hourlyTimeline: hourlyEvents,
      topEventTypes,
      timeRange,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting events summary:', error);
    return {};
  }
}

// Get real-time security alerts (critical events)
export async function getSecurityAlerts(limit = 20) {
  try {
    const connected = await connectToMongo();
    if (!connected) return [];

    // Get recent critical events
    const alerts = await collection
      .find({ 
        severity: 'critical',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return alerts.map(alert => ({
      ...alert,
      category: EVENT_CATEGORIES[alert.type] || 'uncategorized',
      isNew: (Date.now() - alert.timestamp.getTime()) < 5 * 60 * 1000 // New if < 5 minutes old
    }));
  } catch (error) {
    console.error('Error getting security alerts:', error);
    return [];
  }
}

// Search security events
export async function searchSecurityEvents(searchQuery, options = {}) {
  try {
    const connected = await connectToMongo();
    if (!connected) return { events: [], total: 0 };

    const { page = 1, limit = 50 } = options;

    // Build text search query
    const filter = {
      $or: [
        { type: { $regex: searchQuery, $options: 'i' } },
        { 'data.videoTitle': { $regex: searchQuery, $options: 'i' } },
        { 'data.username': { $regex: searchQuery, $options: 'i' } },
        { 'data.error': { $regex: searchQuery, $options: 'i' } }
      ]
    };

    const total = await collection.countDocuments(filter);
    const skip = (page - 1) * limit;

    const events = await collection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      events: events.map(event => ({
        ...event,
        category: EVENT_CATEGORIES[event.type] || 'uncategorized',
        severityColor: SEVERITY_COLORS[event.severity] || '#6b7280'
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error searching security events:', error);
    return { events: [], total: 0 };
  }
}

export { SEVERITY_LEVELS, SEVERITY_COLORS, EVENT_CATEGORIES };
