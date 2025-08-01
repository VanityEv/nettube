import { useState, useEffect, useCallback } from 'react';

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

  // Get the backend URL from environment or use localhost
  const getBaseUrl = () => {
    //process.env.REACT_APP_BACKEND_URL ||
    return  'http://localhost:3001';
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
        console.log('Current user:', payload);
        if (payload.account_type !== 3) {
          throw new Error(`Access denied - Admin privileges required. Current account type: ${payload.account_type} (need type 3)`);
        }
      } catch (tokenError) {
        console.warn('Could not decode token:', tokenError);
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Fetching security data with token:', token?.substring(0, 20) + '...');

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
      const summaryResponse = await fetch(`${baseUrl}/admin/security/summary?${queryParams}`, {
        headers
      });

      console.log('Summary response status:', summaryResponse.status);
      
      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text();
        console.log('Summary error response:', errorText);
        if (summaryResponse.status === 401) {
          throw new Error('Authentication failed - Please log in again');
        }
        if (summaryResponse.status === 403) {
          throw new Error('Access denied - Admin privileges required (account_type: 3)');
        }
        throw new Error(`Summary API error: ${summaryResponse.status} ${summaryResponse.statusText} - ${errorText}`);
      }

      const summaryResult = await summaryResponse.json();
      console.log('Summary result:', summaryResult);
      // Backend returns {result: 'SUCCESS', data: summary}
      setSummary(summaryResult.data || summaryResult);

      // Fetch events
      const eventsResponse = await fetch(`${baseUrl}/admin/security/events?${queryParams}`, {
        headers
      });

      if (!eventsResponse.ok) {
        throw new Error(`Events API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
      }

      const eventsResult = await eventsResponse.json();
      // Backend returns {result: 'SUCCESS', events: [...], total: n, ...}
      setEvents(eventsResult.events || eventsResult.data?.events || []);

      // Fetch alerts (critical and warning events from last 24h)
      const alertsResponse = await fetch(`${baseUrl}/admin/security/alerts`, {
        headers
      });

      if (!alertsResponse.ok) {
        throw new Error(`Alerts API error: ${alertsResponse.status} ${alertsResponse.statusText}`);
      }

      const alertsResult = await alertsResponse.json();
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
