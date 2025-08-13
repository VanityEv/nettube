import { useState, useEffect, useCallback } from 'react';
import { api } from '../../constants';
import { HttpClient } from '../../utils/httpClient';

interface SecurityEvent {
  _id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: any;
  userId?: string;
  ip?: string;
}

interface SecuritySummary {
  totalEvents: number;
  severityBreakdown: {
    critical: number;
    warning: number;
    info: number;
    debug: number;
  };
  categoryBreakdown: {
    [key: string]: number;
  };
  timeRange: string;
  lastUpdated: Date;
  hourlyTimeline?: Array<{ _id: string; count: number; critical: number; warning: number; info: number }>;
  topEventTypes?: Array<{ _id: string; count: number }>;
  trends?: {
    hourly: Array<{ hour: string; count: number; severity: string }>;
    daily: Array<{ date: string; count: number; severity: string }>;
  };
}

interface SecurityFilters {
  timeRange: '1h' | '24h' | '7d' | '30d';
  severity: string[];
  category: string[];
  eventType: string[];
  searchTerm: string;
}

interface UseSecurityDataReturn {
  summary: SecuritySummary | null;
  events: SecurityEvent[];
  alerts: SecurityEvent[];
  loading: boolean;
  error: string | null;
  fetchSecurityData: () => Promise<void>;
  refreshData: () => void;
}

export const useSecurityData = (
  filters: SecurityFilters,
  page: number = 1,
  pageSize: number = 10
): UseSecurityDataReturn => {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the backend URL from configured API
  const getBaseUrl = () => {
    return api; // unified with simplified constants (always '/api' or explicit REACT_APP_API_URL)
  };

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = getBaseUrl();
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required - Please log in as an admin user');
      }

      // Decode token to check user info (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.account_type !== 3) {
          throw new Error(`Access denied - Admin privileges required. Current account type: ${payload.account_type} (need type 3)`);
        }
      } catch (tokenError) {
        console.warn('Could not decode token:', tokenError);
      }


      // Build query params for filtering
      const queryParams = new URLSearchParams({
        timeRange: filters.timeRange,
        page: page.toString(),
        limit: pageSize.toString()
      });

      if (filters.severity.length > 0) {
        queryParams.append('severity', filters.severity.join(','));
      }
      if (filters.category.length > 0) {
        queryParams.append('category', filters.category.join(','));
      }
      if (filters.eventType.length > 0) {
        queryParams.append('eventType', filters.eventType.join(','));
      }
      if (filters.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }

      // Fetch summary data
      const summaryResult = await HttpClient.get(`${baseUrl}/admin/security/summary?${queryParams}`);
      // Backend returns {result: 'SUCCESS', data: summary}
      setSummary(summaryResult.data || summaryResult);

      // Fetch events
      const eventsResult = await HttpClient.get(`${baseUrl}/admin/security/events?${queryParams}`);
      // Backend returns {result: 'SUCCESS', events: [...], total: n, ...}
      setEvents(eventsResult.events || eventsResult.data?.events || []);

      // Fetch alerts (critical and warning events from last 24h)
      const alertsResult = await HttpClient.get(`${baseUrl}/admin/security/alerts`);
      // Backend returns {result: 'SUCCESS', data: [...]}
      setAlerts(alertsResult.data || alertsResult.alerts || []);

    } catch (err) {
      console.error('Failed to fetch security data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security data');
      
      // Set fallback data for development
      setSummary({
        totalEvents: 0,
        severityBreakdown: { critical: 0, warning: 0, info: 0, debug: 0 },
        categoryBreakdown: {},
        timeRange: filters.timeRange,
        lastUpdated: new Date(),
        trends: { hourly: [], daily: [] }
      });
      setEvents([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  const refreshData = useCallback(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSecurityData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  return {
    summary,
    events,
    alerts,
    loading,
    error,
    fetchSecurityData,
    refreshData
  };
};

export type { SecurityEvent, SecuritySummary, SecurityFilters };
