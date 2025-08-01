import React from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { TrendingUp } from '@mui/icons-material';

interface TrendItem {
  date?: string;
  hour?: string;
  severity: string;
  count: number;
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

interface SecurityChartsSectionProps {
  summary: SecuritySummary | null;
  loading: boolean;
  timeRange: string;
}

export const SecurityChartsSection: React.FC<SecurityChartsSectionProps> = ({ summary, loading, timeRange }) => {
  if (loading) {
    return (
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  // Prepare data for charts
  const severityData = [
    { name: 'Critical', value: summary.severityBreakdown.critical, color: '#dc2626' },
    { name: 'Warning', value: summary.severityBreakdown.warning, color: '#d97706' },
    { name: 'Info', value: summary.severityBreakdown.info, color: '#2563eb' },
    { name: 'Debug', value: summary.severityBreakdown.debug, color: '#6b7280' },
  ].filter(item => item.value > 0);

  const categoryData = Object.entries(summary.categoryBreakdown || {}).map(([name, value]) => ({
    name,
    value,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }));

  // Prepare trend data
  const trendData = timeRange === '24h' ? summary.trends?.hourly || [] : summary.trends?.daily || [];

  // Group trend data by time period and aggregate by severity
  const trendChartData = (trendData as TrendItem[])
    .reduce((acc: any[], item: TrendItem) => {
      const timeKey = timeRange === '24h' ? item.hour || item.date : item.date || item.hour;
      const existing = acc.find(d => d.time === timeKey);

      if (existing) {
        existing[item.severity] = (existing[item.severity] || 0) + item.count;
        existing.total = (existing.total || 0) + item.count;
      } else {
        acc.push({
          time: timeKey,
          [item.severity]: item.count,
          total: item.count,
        });
      }

      return acc;
    }, [])
    .slice(-24); // Show last 24 periods

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            p: 2,
            borderRadius: 1,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }} gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: 'white' }}>
              <span style={{ color: entry.color, fontWeight: 'bold' }}>●</span> {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TrendingUp sx={{ color: 'primary.main' }} />
        <Typography variant="h5" color="white" fontWeight="bold">
          Security Analytics
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {/* Severity Breakdown Pie Chart */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', height: '400px', flex: '1 1 400px' }}>
          <CardContent>
            <Typography variant="h6" color="white" gutterBottom>
              Events by Severity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ outline: 'none' }}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  contentStyle={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  wrapperStyle={{ outline: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Bar Chart */}
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', height: '400px', flex: '1 1 400px' }}>
          <CardContent>
            <Typography variant="h6" color="white" gutterBottom>
              Events by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryData}
                style={{
                  outline: 'none',
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: 'white', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: 'white', fontSize: 12 }} />
                <Tooltip
                  content={<CustomTooltip />}
                  contentStyle={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#3b82f6" style={{ outline: 'none' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Trend Line Chart */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', height: '400px' }}>
        <CardContent>
          <Typography variant="h6" color="white" gutterBottom>
            Security Events Trend ({timeRange === '24h' ? 'Hourly' : 'Daily'})
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: 'white', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: 'white', fontSize: 12 }} />
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend />
              <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} name="Critical" />
              <Line type="monotone" dataKey="warning" stroke="#d97706" strokeWidth={2} name="Warning" />
              <Line type="monotone" dataKey="info" stroke="#2563eb" strokeWidth={2} name="Info" />
              <Line type="monotone" dataKey="debug" stroke="#6b7280" strokeWidth={2} name="Debug" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
