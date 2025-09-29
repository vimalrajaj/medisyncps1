import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from '../../../components/AppIcon';
import { supabase } from '../../../lib/supabase';


const RANGE_DAY_MAP = {
  '7d': 7,
  '30d': 30,
  '90d': 90
};

const AnalyticsChart = () => {
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buckets = useMemo(() => {
    const days = RANGE_DAY_MAP[timeRange] ?? 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = [];
    const map = new Map();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const entry = {
        key,
        date: key,
        apiCalls: 0,
        mappings: 0,
        users: 0
      };
      result.push(entry);
      map.set(key, entry);
    }

    return { list: result, map };
  }, [timeRange]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      const days = RANGE_DAY_MAP[timeRange] ?? 7;
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));

      const startIso = startDate.toISOString();

      try {
        const [usage, mappings, users] = await Promise.all([
          supabase
            ?.from('api_usage_logs')
            ?.select('id, created_at')
            ?.gte('created_at', startIso),
          supabase
            ?.from('terminology_mappings')
            ?.select('id, created_at')
            ?.gte('created_at', startIso),
          supabase
            ?.from('user_profiles')
            ?.select('id, created_at, is_active')
            ?.gte('created_at', startIso)
        ]);

        [usage, mappings, users].forEach(result => {
          if (result?.error) {
            throw result.error;
          }
        });

        const clonedBuckets = buckets.list.map(item => ({ ...item, users: 0 }));
        const bucketMap = new Map(clonedBuckets.map(item => [item.key, item]));

        usage?.data?.forEach(entry => {
          const key = entry.created_at?.split('T')?.[0];
          const bucket = bucketMap.get(key);
          if (bucket) bucket.apiCalls += 1;
        });

        mappings?.data?.forEach(entry => {
          const key = entry.created_at?.split('T')?.[0];
          const bucket = bucketMap.get(key);
          if (bucket) bucket.mappings += 1;
        });

        users?.data?.forEach(entry => {
          const key = entry.created_at?.split('T')?.[0];
          const bucket = bucketMap.get(key);
          if (bucket && entry.is_active) bucket.users += 1;
        });

        setData(clonedBuckets);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError(err);
        setData(buckets.list);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange, buckets]);

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const chartData = data;
  const isEmpty = !loading && chartData.every(item => item.apiCalls === 0 && item.mappings === 0 && item.users === 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">System Analytics</h3>
          <p className="text-sm text-text-secondary">API usage, terminology mappings, and user activity trends</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium clinical-transition ${
                chartType === 'line' ?'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="TrendingUp" size={16} className="inline mr-1" />
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium clinical-transition ${
                chartType === 'bar' ?'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name="BarChart3" size={16} className="inline mr-1" />
              Bar
            </button>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e?.target?.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {timeRangeOptions?.map(option => (
              <option key={option?.value} value={option?.value}>{option?.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-80 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
            <div className="flex items-center space-x-2 text-text-secondary">
              <Icon name="Loader2" size={18} className="animate-spin" />
              <span className="text-sm font-medium">Loading analytics...</span>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-error/5 rounded-lg border border-error/20">
            <div className="text-center px-6">
              <Icon name="AlertCircle" size={20} className="mx-auto mb-2 text-error" />
              <p className="text-sm text-error font-medium">Failed to load analytics data.</p>
              <p className="text-xs text-error/80">{error.message || 'Please try again later.'}</p>
            </div>
          </div>
        )}
        {isEmpty && !loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg border border-border/60">
            <div className="text-center px-6">
              <Icon name="Database" size={20} className="mx-auto mb-2 text-text-secondary" />
              <p className="text-sm text-text-secondary">No activity recorded in this period.</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(value) => new Date(value)?.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => new Date(value)?.toLocaleDateString('en-IN')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="apiCalls" 
                stroke="#1E40AF" 
                strokeWidth={2}
                name="API Calls"
                dot={{ fill: '#1E40AF', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="mappings" 
                stroke="#059669" 
                strokeWidth={2}
                name="Terminology Mappings"
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Active Users"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(value) => new Date(value)?.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => new Date(value)?.toLocaleDateString('en-IN')}
              />
              <Legend />
              <Bar dataKey="apiCalls" fill="#1E40AF" name="API Calls" />
              <Bar dataKey="mappings" fill="#059669" name="Terminology Mappings" />
              <Bar dataKey="users" fill="#F59E0B" name="Active Users" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;