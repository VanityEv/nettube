// routes/securityRouter.js
import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../helpers/verifyToken.js';
import {
  getSecurityEvents,
  getEventsSummary,
  getSecurityAlerts,
  searchSecurityEvents
} from '../services/security/securityMonitor.js';

const router = Router();

// Middleware to ensure only admins can access security monitoring
router.use(verifyToken);
router.use(verifyAdmin);

// Get security events with filtering and pagination
router.get('/events', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      eventType,
      startDate,
      endDate,
      category
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      severity,
      eventType,
      startDate,
      endDate,
      category
    };

    const result = await getSecurityEvents(options);

    res.status(200).json({
      result: 'SUCCESS',
      data: result
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      result: 'ERROR',
      message: 'Failed to fetch security events'
    });
  }
});

// Get dashboard summary statistics
router.get('/summary', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const summary = await getEventsSummary(timeRange);

    res.status(200).json({
      result: 'SUCCESS',
      data: summary
    });
  } catch (error) {
    console.error('Error fetching security summary:', error);
    res.status(500).json({
      result: 'ERROR',
      message: 'Failed to fetch security summary'
    });
  }
});

// Get real-time security alerts
router.get('/alerts', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const alerts = await getSecurityAlerts(parseInt(limit));

    res.status(200).json({
      result: 'SUCCESS',
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      result: 'ERROR',
      message: 'Failed to fetch security alerts'
    });
  }
});

// Search security events
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery, page = 1, limit = 50 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'Search query is required'
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await searchSecurityEvents(searchQuery, options);

    res.status(200).json({
      result: 'SUCCESS',
      data: result
    });
  } catch (error) {
    console.error('Error searching security events:', error);
    res.status(500).json({
      result: 'ERROR',
      message: 'Failed to search security events'
    });
  }
});

// Get event categories and severity levels (for filters)
router.get('/metadata', async (req, res) => {
  try {
    const { EVENT_CATEGORIES, SEVERITY_LEVELS, SEVERITY_COLORS } = await import('../services/security/securityMonitor.js');
    
    res.status(200).json({
      result: 'SUCCESS',
      data: {
        categories: Object.values(EVENT_CATEGORIES).filter((value, index, self) => self.indexOf(value) === index),
        severityLevels: Object.keys(SEVERITY_LEVELS),
        severityColors: SEVERITY_COLORS,
        eventTypes: Object.keys(EVENT_CATEGORIES)
      }
    });
  } catch (error) {
    console.error('Error fetching security metadata:', error);
    res.status(500).json({
      result: 'ERROR',
      message: 'Failed to fetch security metadata'
    });
  }
});

export default router;
