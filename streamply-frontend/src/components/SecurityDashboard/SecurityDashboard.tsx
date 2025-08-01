import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Alert, IconButton, Tooltip } from '@mui/material';
import { Security, Warning, Error, Refresh, TrendingUp, Shield } from '@mui/icons-material';
import { useSecurityData } from '../../hooks/useSecurityData';
import { SecurityAlerts } from './SecurityAlerts';
import { SecurityChartsSection } from './SecurityChartsSection';
import { SecurityFilters } from './SecurityFilters';
import { SecurityEventsTable } from './SecurityEventsTable';

interface SecurityFiltersType {
  timeRange: string;
  severity: string;
  category: string;
  eventType: string;
}

export const SecurityDashboard = () => {
  const [filters, setFilters] = useState<SecurityFiltersType>({
    timeRange: '24h',
    severity: '',
    category: '',
    eventType: '',
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { summary, events, alerts, loading, error, refetch } = useSecurityData(filters, refreshTrigger);

  const handleFilterChange = (newFilters: Partial<SecurityFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load security data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#0b1426' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Shield sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" color="white" fontWeight="bold">
            Security Monitoring Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="white">
            Last updated: {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleTimeString() : 'Never'}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', flex: '1 1 250px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Security sx={{ color: 'primary.main', fontSize: 40 }} />
              <Box>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {summary?.totalEvents || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Total Events ({filters.timeRange})
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', flex: '1 1 250px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Error sx={{ color: '#dc2626', fontSize: 40 }} />
              <Box>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {summary?.severityBreakdown?.critical || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Critical Events
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', flex: '1 1 250px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Warning sx={{ color: '#d97706', fontSize: 40 }} />
              <Box>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {summary?.severityBreakdown?.warning || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Warning Events
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', flex: '1 1 250px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp sx={{ color: '#10b981', fontSize: 40 }} />
              <Box>
                <Typography variant="h4" color="white" fontWeight="bold">
                  {alerts?.filter((alert: any) => alert.isNew).length || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  New Alerts
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Alerts Section */}
      <SecurityAlerts alerts={alerts} loading={loading} />

      {/* Charts Section */}
      <SecurityChartsSection summary={summary} loading={loading} timeRange={filters.timeRange} />

      {/* Filters */}
      <SecurityFilters filters={filters} onFilterChange={handleFilterChange} summary={summary} />

      {/* Events Table */}
      <SecurityEventsTable events={events} loading={loading} filters={filters} onFilterChange={handleFilterChange} />
    </Box>
  );
};
