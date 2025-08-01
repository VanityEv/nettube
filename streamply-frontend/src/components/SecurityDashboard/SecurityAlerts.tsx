import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Chip,
  CircularProgress,
} from '@mui/material';
import { NotificationsActive, ExpandMore, ExpandLess, Error, Warning, Info, Close } from '@mui/icons-material';

interface SecurityAlert {
  _id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  isNew: boolean;
  metadata?: any;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  loading: boolean;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ alerts, loading }) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error sx={{ fontSize: 20 }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 20 }} />;
      case 'info':
        return <Info sx={{ fontSize: 20 }} />;
      default:
        return <Info sx={{ fontSize: 20 }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const toggleAlertExpansion = (alertId: string) => {
    const newExpandedAlerts = new Set(expandedAlerts);
    if (expandedAlerts.has(alertId)) {
      newExpandedAlerts.delete(alertId);
    } else {
      newExpandedAlerts.add(alertId);
    }
    setExpandedAlerts(newExpandedAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(alertId);
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert._id));
  const criticalAlerts = visibleAlerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = visibleAlerts.filter(alert => alert.severity === 'warning');
  const infoAlerts = visibleAlerts.filter(alert => alert.severity === 'info');

  if (loading) {
    return (
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <NotificationsActive sx={{ color: 'primary.main' }} />
            <Typography variant="h6" color="white">
              Security Alerts
            </Typography>
          </Box>
          <Alert severity="success" sx={{ bgcolor: '#065f46', border: '1px solid #10b981' }}>
            <AlertTitle>All Clear</AlertTitle>
            No active security alerts at this time.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsActive sx={{ color: 'primary.main' }} />
            <Typography variant="h6" color="white">
              Security Alerts
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {criticalAlerts.length > 0 && (
              <Chip icon={<Error />} label={`${criticalAlerts.length} Critical`} color="error" size="small" />
            )}
            {warningAlerts.length > 0 && (
              <Chip icon={<Warning />} label={`${warningAlerts.length} Warning`} color="warning" size="small" />
            )}
            {infoAlerts.length > 0 && (
              <Chip icon={<Info />} label={`${infoAlerts.length} Info`} color="info" size="small" />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleAlerts.map(alert => (
            <Box key={alert._id}>
              <Alert
                severity={getSeverityColor(alert.severity) as any}
                sx={{
                  bgcolor:
                    alert.severity === 'critical' ? '#7f1d1d' : alert.severity === 'warning' ? '#78350f' : '#1e3a8a',
                  border: `1px solid ${
                    alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#d97706' : '#2563eb'
                  }`,
                  '& .MuiAlert-message': { width: '100%' },
                  color: 'white',
                }}
                icon={getSeverityIcon(alert.severity)}
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {alert.isNew && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontSize: '10px',
                          height: '20px',
                        }}
                      />
                    )}
                    <IconButton size="small" onClick={() => toggleAlertExpansion(alert._id)} sx={{ color: 'white' }}>
                      {expandedAlerts.has(alert._id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton size="small" onClick={() => dismissAlert(alert._id)} sx={{ color: 'white' }}>
                      <Close />
                    </IconButton>
                  </Box>
                }
              >
                <AlertTitle sx={{ fontWeight: 'bold' }}>
                  {alert.type.toUpperCase()} - {alert.severity.toUpperCase()}
                </AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {alert.message}
                </Typography>
                <Typography variant="caption" color="white">
                  {formatTimestamp(alert.timestamp)}
                </Typography>

                <Collapse in={expandedAlerts.has(alert._id)}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" sx={{ color: 'white' }} gutterBottom>
                      Alert Details
                    </Typography>
                    {alert.metadata && (
                      <Box
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.2)',
                          p: 2,
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          overflow: 'auto',
                        }}
                      >
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'white' }}>
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Alert>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
