import React from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { FilterList } from '@mui/icons-material';

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
  trends?: {
    hourly: Array<{ hour: string; count: number; severity: string }>;
    daily: Array<{ date: string; count: number; severity: string }>;
  };
}

interface SecurityFiltersType {
  timeRange: string;
  severity: string;
  category: string;
  eventType: string;
}

interface SecurityFiltersProps {
  filters: SecurityFiltersType;
  onFilterChange: (filters: Partial<SecurityFiltersType>) => void;
  summary: SecuritySummary | null;
}

export const SecurityFilters: React.FC<SecurityFiltersProps> = ({ filters, onFilterChange, summary }) => {
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.severity) count++;
    if (filters.category) count++;
    if (filters.eventType) count++;
    return count;
  };

  const clearFilter = (filterKey: string) => {
    onFilterChange({ [filterKey]: '' });
  };

  const clearAllFilters = () => {
    onFilterChange({
      severity: '',
      category: '',
      eventType: '',
    });
  };

  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList sx={{ color: 'primary.main' }} />
            <Typography variant="h6" color="white">
              Filters & Time Range
            </Typography>
          </Box>

          {getActiveFiltersCount() > 0 && (
            <Chip
              label={`Clear All (${getActiveFiltersCount()})`}
              onClick={clearAllFilters}
              size="small"
              sx={{
                bgcolor: '#334155',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Time Range */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: 'white' }}>Time Range</InputLabel>
            <Select
              value={filters.timeRange}
              label="Time Range"
              onChange={e => onFilterChange({ timeRange: e.target.value })}
              sx={{
                bgcolor: '#0f172a',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Severity Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: 'white' }}>Severity Level</InputLabel>
            <Select
              value={filters.severity}
              label="Severity Level"
              onChange={e => onFilterChange({ severity: e.target.value })}
              sx={{
                bgcolor: '#0f172a',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              <MenuItem value="">All Severities</MenuItem>
              <MenuItem value="critical">Critical ({summary?.severityBreakdown?.critical || 0})</MenuItem>
              <MenuItem value="warning">Warning ({summary?.severityBreakdown?.warning || 0})</MenuItem>
              <MenuItem value="info">Info ({summary?.severityBreakdown?.info || 0})</MenuItem>
              <MenuItem value="debug">Debug ({summary?.severityBreakdown?.debug || 0})</MenuItem>
            </Select>
          </FormControl>

          {/* Category Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: 'white' }}>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={e => onFilterChange({ category: e.target.value })}
              sx={{
                bgcolor: '#0f172a',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {summary?.categoryBreakdown &&
                Object.entries(summary.categoryBreakdown).map(([category, count]) => (
                  <MenuItem key={category} value={category}>
                    {category} ({count})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Event Type Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: 'white' }}>Event Type</InputLabel>
            <Select
              value={filters.eventType}
              label="Event Type"
              onChange={e => onFilterChange({ eventType: e.target.value })}
              sx={{
                bgcolor: '#0f172a',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              <MenuItem value="">All Event Types</MenuItem>
              <MenuItem value="authentication">Authentication</MenuItem>
              <MenuItem value="authorization">Authorization</MenuItem>
              <MenuItem value="data_access">Data Access</MenuItem>
              <MenuItem value="video_upload">Video Upload</MenuItem>
              <MenuItem value="video_deletion">Video Deletion</MenuItem>
              <MenuItem value="security_incident">Security Incident</MenuItem>
              <MenuItem value="system_error">System Error</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="gray.400" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.severity && (
                <Chip
                  label={`Severity: ${filters.severity}`}
                  onDelete={() => clearFilter('severity')}
                  size="small"
                  sx={{ bgcolor: '#374151', color: 'white' }}
                />
              )}
              {filters.category && (
                <Chip
                  label={`Category: ${filters.category}`}
                  onDelete={() => clearFilter('category')}
                  size="small"
                  sx={{ bgcolor: '#374151', color: 'white' }}
                />
              )}
              {filters.eventType && (
                <Chip
                  label={`Type: ${filters.eventType}`}
                  onDelete={() => clearFilter('eventType')}
                  size="small"
                  sx={{ bgcolor: '#374151', color: 'white' }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
