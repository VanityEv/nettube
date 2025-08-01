import { useState, useEffect, useCallback } from 'react';
import { getCookie } from 'typescript-cookie';

interface SecurityEvent {
  _id: string;
  timestamp: Date;
  type: string;
  message?: string;
  severity?: 'critical' | 'warning' | 'info' | 'debug';
  category?: string;
  source?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    endpoint?: string;
    [key: string]: any;
  };
}

interface SecurityAlert {
  _id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  isNew: boolean;
  metadata?: any;
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
  trends: {
    hourly: Array<{ hour: string; count: number; severity: string }>;
    daily: Array<{ date: string; count: number; severity: string }>;
  };
}

interface SecurityFilters {
  timeRange: string;
  severity: string;
  category: string;
  eventType: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const useSecurityData = (filters: SecurityFilters, refreshTrigger: number = 0) => {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getCookie('userToken');
      const accountType = getCookie('userAccountType');

      console.log('Security data fetch - Token exists:', !!token);
      console.log('Security data fetch - Account Type:', accountType);

      if (!token) {
        throw new Error('Authentication required - Please log in');
      }

      if (accountType !== '3') {
        throw new Error(`Admin privileges required - Current account type: ${accountType} (need type 3)`);
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Use absolute URL for backend
      const baseUrl = 'http://localhost:3001';

      // Fetch summary
      const summaryParams = new URLSearchParams({
        timeRange: filters.timeRange
      });
      const summaryResponse = await fetch(`${baseUrl}/admin/security/summary?${summaryParams}`, { headers });
      
      console.log('Summary response status:', summaryResponse.status);
      
      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text();
        console.log('Summary error:', errorText);
        throw new Error(`Failed to fetch security summary: ${summaryResponse.status} ${errorText}`);
      }
      
      const summaryResult = await summaryResponse.json();
      console.log('Summary result:', summaryResult);
      setSummary(summaryResult.data || summaryResult);

      // Fetch events
      const eventsParams = new URLSearchParams({
        timeRange: filters.timeRange,
        page: (filters.page || 1).toString(),
        limit: (filters.limit || 50).toString()
      });
      
      if (filters.severity) eventsParams.append('severity', filters.severity);
      if (filters.category) eventsParams.append('category', filters.category);
      if (filters.eventType) eventsParams.append('eventType', filters.eventType);
      if (filters.search) eventsParams.append('search', filters.search);

      const eventsResponse = await fetch(`${baseUrl}/admin/security/events?${eventsParams}`, { headers });
      
      console.log('Events response status:', eventsResponse.status);
      
      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.log('Events error:', errorText);
        throw new Error(`Failed to fetch security events: ${eventsResponse.status} ${errorText}`);
      }
      
      const eventsResult = await eventsResponse.json();
      console.log('Events result:', eventsResult);
      setEvents(eventsResult.events || eventsResult.data?.events || []);

      // Fetch alerts
      const alertsResponse = await fetch(`${baseUrl}/admin/security/alerts`, { headers });
      
      console.log('Alerts response status:', alertsResponse.status);
      
      if (!alertsResponse.ok) {
        const errorText = await alertsResponse.text();
        console.log('Alerts error:', errorText);
        throw new Error(`Failed to fetch security alerts: ${alertsResponse.status} ${errorText}`);
      }
      
      const alertsResult = await alertsResponse.json();
      console.log('Alerts result:', alertsResult);
      setAlerts(alertsResult.data || alertsResult.alerts || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  return {
    summary,
    events,
    alerts,
    loading,
    error,
    refetch
  };
};
