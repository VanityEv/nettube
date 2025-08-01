import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Pagination,
  CircularProgress,
  Collapse,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material';
import { ExpandMore, ExpandLess, Search, SecurityRounded, Warning, Info, Error, Visibility } from '@mui/icons-material';

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

interface SecurityFilters {
  timeRange: string;
  severity: string;
  category: string;
  eventType: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface SecurityEventsTableProps {
  events: SecurityEvent[];
  loading: boolean;
  filters: SecurityFilters;
  onFilterChange: (filters: Partial<SecurityFilters>) => void;
}

export const SecurityEventsTable: React.FC<SecurityEventsTableProps> = ({
  events,
  loading,
  filters,
  onFilterChange,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error sx={{ fontSize: 16 }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 16 }} />;
      case 'info':
        return <Info sx={{ fontSize: 16 }} />;
      default:
        return <Visibility sx={{ fontSize: 16 }} />;
    }
  };

  const toggleRowExpansion = (eventId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(eventId)) {
      newExpandedRows.delete(eventId);
    } else {
      newExpandedRows.add(eventId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch, page: 1 });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onFilterChange({ page: value });
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategories = () => {
    const categories = Array.from(new Set(events.map(event => event.category)));
    return categories.filter(Boolean);
  };

  const getEventTypes = () => {
    const types = Array.from(new Set(events.map(event => event.type)));
    return types.filter(Boolean);
  };

  return (
    <Card
      sx={{
        bgcolor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        mb: 3,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityRounded sx={{ color: 'primary.600', fontSize: 28 }} />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              Security Events
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
            {events.length} events found
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ minWidth: 300 }}>
            <TextField
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search events..."
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontSize: '14px',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    opacity: 1,
                  },
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.600' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Severity</InputLabel>
            <Select
              value={filters.severity}
              label="Severity"
              onChange={e => onFilterChange({ severity: e.target.value, page: 1 })}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.600' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.6)' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'secondary.400',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={e => onFilterChange({ category: e.target.value, page: 1 })}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.600' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.6)' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'secondary.400',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {getCategories().map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Event Type</InputLabel>
            <Select
              value={filters.eventType}
              label="Event Type"
              onChange={e => onFilterChange({ eventType: e.target.value, page: 1 })}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.600' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.6)' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'secondary.400',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {getEventTypes().map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Events List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: 'primary.600' }} />
          </Box>
        ) : events.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              '& .MuiAlert-message': { color: 'white' },
              '& .MuiAlert-icon': { color: '#3b82f6' },
            }}
          >
            No security events found with current filters.
          </Alert>
        ) : (
          <Box>
            {events.map(event => (
              <Alert
                key={event._id}
                severity={getSeverityColor(event.severity || 'info') as any}
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  '& .MuiAlert-message': {
                    width: '100%',
                    color: 'white',
                  },
                  '& .MuiAlert-icon': {
                    color:
                      event.severity === 'critical'
                        ? '#ef4444'
                        : event.severity === 'warning'
                        ? '#f59e0b'
                        : event.severity === 'info'
                        ? '#3b82f6'
                        : '#9ca3af',
                  },
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
                icon={getSeverityIcon(event.severity || 'info')}
                action={
                  <Tooltip title={expandedRows.has(event._id) ? 'Collapse' : 'Expand details'}>
                    <IconButton
                      onClick={() => toggleRowExpansion(event._id)}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      }}
                    >
                      {expandedRows.has(event._id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Tooltip>
                }
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: 'white',
                          fontSize: '16px',
                          mb: 1,
                        }}
                      >
                        {event.type} - {(event.severity || 'unknown').toUpperCase()}
                        {event.metadata?.userId && (
                          <Chip
                            label={`User: ${event.metadata.username || event.metadata.userId}`}
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: 'rgba(59, 130, 246, 0.2)',
                              color: '#93c5fd',
                              fontSize: '12px',
                            }}
                          />
                        )}
                        {event.metadata?.ip && (
                          <Chip
                            label={`IP: ${event.metadata.ip}`}
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: '12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                            variant="outlined"
                          />
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          mb: 2,
                          fontSize: '14px',
                          lineHeight: 1.5,
                        }}
                      >
                        {event.message || 'No message available'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Category: ${event.category || 'unknown'}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '11px',
                          }}
                        />
                        <Chip
                          label={`Source: ${event.source || 'unknown'}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '11px',
                          }}
                        />
                        <Chip
                          label={formatTimestamp(event.timestamp)}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '11px',
                          }}
                        />
                        {event.metadata?.riskLevel && (
                          <Chip
                            label={`Risk: ${event.metadata.riskLevel}`}
                            size="small"
                            sx={{
                              bgcolor:
                                event.metadata.riskLevel === 'critical'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : event.metadata.riskLevel === 'high'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              color:
                                event.metadata.riskLevel === 'critical'
                                  ? '#fca5a5'
                                  : event.metadata.riskLevel === 'high'
                                  ? '#fbbf24'
                                  : 'rgba(255, 255, 255, 0.8)',
                              fontSize: '11px',
                            }}
                          />
                        )}
                        {event.metadata?.success === false && (
                          <Chip
                            label="Failed"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(239, 68, 68, 0.2)',
                              color: '#fca5a5',
                              fontSize: '11px',
                            }}
                          />
                        )}
                        {event.metadata?.blocked === true && (
                          <Chip
                            label="Blocked"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(34, 197, 94, 0.2)',
                              color: '#86efac',
                              fontSize: '11px',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Collapse in={expandedRows.has(event._id)}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                        Event Details
                      </Typography>

                      {/* User Information */}
                      {(event.metadata?.userId || event.metadata?.username) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary.600" display="block" gutterBottom>
                            User Information
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {event.metadata?.userId && (
                              <Chip
                                label={`User ID: ${event.metadata.userId}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.username && (
                              <Chip
                                label={`Username: ${event.metadata.username}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.accountType && (
                              <Chip
                                label={`Account Type: ${event.metadata.accountType}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Request Information */}
                      {(event.metadata?.ip || event.metadata?.method || event.metadata?.url) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary.600" display="block" gutterBottom>
                            Request Information
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {event.metadata?.ip && (
                              <Chip
                                label={`IP: ${event.metadata.ip}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.method && (
                              <Chip
                                label={`Method: ${event.metadata.method}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.url && (
                              <Chip
                                label={`URL: ${event.metadata.url}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                          </Box>
                          {event.metadata?.userAgent && event.metadata.userAgent !== 'unknown' && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.7)',
                              }}
                            >
                              User Agent: {event.metadata.userAgent}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Security Context */}
                      {(event.metadata?.riskLevel ||
                        event.metadata?.attackVector ||
                        event.metadata?.blocked !== undefined) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary.600" display="block" gutterBottom>
                            Security Context
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {event.metadata?.riskLevel && (
                              <Chip
                                label={`Risk: ${event.metadata.riskLevel}`}
                                size="small"
                                sx={{
                                  bgcolor:
                                    event.metadata.riskLevel === 'critical'
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : event.metadata.riskLevel === 'high'
                                      ? 'rgba(245, 158, 11, 0.2)'
                                      : 'rgba(255, 255, 255, 0.1)',
                                  color:
                                    event.metadata.riskLevel === 'critical'
                                      ? '#fca5a5'
                                      : event.metadata.riskLevel === 'high'
                                      ? '#fbbf24'
                                      : 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.attackVector && (
                              <Chip
                                label={`Attack Vector: ${event.metadata.attackVector}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#fca5a5',
                                }}
                              />
                            )}
                            {event.metadata?.blocked !== undefined && (
                              <Chip
                                label={event.metadata.blocked ? 'Blocked' : 'Not Blocked'}
                                size="small"
                                sx={{
                                  bgcolor: event.metadata.blocked
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : 'rgba(245, 158, 11, 0.2)',
                                  color: event.metadata.blocked ? '#86efac' : '#fbbf24',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* System Information */}
                      {(event.metadata?.environment || event.metadata?.processId || event.metadata?.nodeVersion) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary.600" display="block" gutterBottom>
                            System Information
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {event.metadata?.environment && (
                              <Chip
                                label={`Environment: ${event.metadata.environment}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.processId && (
                              <Chip
                                label={`PID: ${event.metadata.processId}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.nodeVersion && (
                              <Chip
                                label={`Node: ${event.metadata.nodeVersion}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Authentication Context */}
                      {(event.metadata?.success !== undefined ||
                        event.metadata?.authMethod ||
                        event.metadata?.failureReason) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="primary.600" display="block" gutterBottom>
                            Authentication Context
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {event.metadata?.success !== undefined && (
                              <Chip
                                label={event.metadata.success ? 'Success' : 'Failed'}
                                size="small"
                                sx={{
                                  bgcolor: event.metadata.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: event.metadata.success ? '#86efac' : '#fca5a5',
                                }}
                              />
                            )}
                            {event.metadata?.authMethod && (
                              <Chip
                                label={`Method: ${event.metadata.authMethod}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              />
                            )}
                            {event.metadata?.failureReason && (
                              <Chip
                                label={`Reason: ${event.metadata.failureReason}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#fca5a5',
                                }}
                              />
                            )}
                            {event.metadata?.attemptCount && (
                              <Chip
                                label={`Attempts: ${event.metadata.attemptCount}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(245, 158, 11, 0.2)',
                                  color: '#fbbf24',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Raw Metadata */}
                      {event.metadata && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            display="block"
                            gutterBottom
                          >
                            Raw Metadata (Click to expand)
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: 'rgba(0,0,0,0.3)',
                              p: 2,
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              overflow: 'auto',
                              maxHeight: '200px',
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.1)',
                              '&:hover': {
                                border: '1px solid rgba(255,255,255,0.2)',
                              },
                            }}
                            onClick={e => {
                              const pre = e.currentTarget.querySelector('pre');
                              if (pre) {
                                const selection = window.getSelection();
                                const range = document.createRange();
                                range.selectNodeContents(pre);
                                selection?.removeAllRanges();
                                selection?.addRange(range);
                              }
                            }}
                          >
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'white' }}>
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </Alert>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {events.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(events.length / (filters.limit || 50))}
              page={filters.page || 1}
              onChange={handlePageChange}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.600',
                    color: 'white',
                    borderColor: 'primary.600',
                    '&:hover': {
                      bgcolor: 'rgba(229, 20, 69, 0.8)',
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
