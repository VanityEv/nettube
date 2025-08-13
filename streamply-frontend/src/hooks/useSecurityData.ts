import { useState, useEffect, useCallback } from 'react';
import { getCookie } from 'typescript-cookie';
import { api } from '../constants';
import { HttpClient } from '../utils/httpClient';

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


      if (!token) {
        throw new Error('Authentication required - Please log in');
      }

      if (accountType !== '3') {
        throw new Error(`Admin privileges required - Current account type: ${accountType} (need type 3)`);
      }

      // Use the configured API URL
      const baseUrl = api;

      // Fetch summary
      const summaryParams = new URLSearchParams({
        timeRange: filters.timeRange
      });
      const summaryResult = await HttpClient.get(`${baseUrl}/admin/security/summary?${summaryParams}`);
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

      const eventsResult = await HttpClient.get(`${baseUrl}/admin/security/events?${eventsParams}`);
      setEvents(eventsResult.events || eventsResult.data?.events || []);

      // Fetch alerts
      const alertsResult = await HttpClient.get(`${baseUrl}/admin/security/alerts`);
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
