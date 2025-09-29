import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemHealthPanel = () => {
  const healthMetrics = [
    {
      id: 'api-status',
      label: 'API Status',
      value: 'Operational',
      status: 'healthy',
      icon: 'CheckCircle',
      description: 'All systems operational'
    },
    {
      id: 'response-time',
      label: 'Avg Response Time',
      value: '145ms',
      status: 'healthy',
      icon: 'Clock',
      description: 'Last 24 hours'
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: '99.9%',
      status: 'healthy',
      icon: 'Activity',
      description: 'Last 30 days'
    },
    {
      id: 'rate-limit',
      label: 'Rate Limit',
      value: '1000/hour',
      status: 'warning',
      icon: 'Zap',
      description: 'Current limit'
    }
  ];

  const recentIncidents = [
    {
      id: 1,
      title: 'Scheduled Maintenance',
      description: 'Database optimization and performance improvements',
      status: 'scheduled',
      date: '2025-09-28',
      time: '02:00 - 04:00 IST',
      impact: 'Low'
    },
    {
      id: 2,
      title: 'ICD-11 Sync Completed',
      description: 'Successfully synchronized with WHO ICD-11 terminology updates',
      status: 'resolved',
      date: '2025-09-26',
      time: '14:30 IST',
      impact: 'None'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      case 'scheduled': return 'Calendar';
      case 'resolved': return 'CheckCircle';
      default: return 'Info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Metrics */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-primary">System Health</h3>
          <p className="text-sm text-text-secondary mt-1">Real-time API status and performance metrics</p>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthMetrics?.map((metric) => (
              <div key={metric?.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className={`p-2 rounded-lg ${getStatusColor(metric?.status)}`}>
                  <Icon name={metric?.icon} size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{metric?.label}</span>
                    <span className="text-lg font-semibold text-text-primary">{metric?.value}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{metric?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Incidents */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">System Status</h3>
              <p className="text-sm text-text-secondary mt-1">Recent incidents and maintenance updates</p>
            </div>
            <a 
              href="#" 
              className="text-sm text-primary hover:text-primary/80 clinical-transition"
            >
              View All
            </a>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {recentIncidents?.map((incident) => (
              <div key={incident?.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                <div className={`p-1.5 rounded-full ${getStatusColor(incident?.status)}`}>
                  <Icon name={getStatusIcon(incident?.status)} size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">{incident?.title}</h4>
                      <p className="text-sm text-text-secondary mt-1">{incident?.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-text-secondary">
                        <span>{incident?.date}</span>
                        <span>{incident?.time}</span>
                        <span className={`px-2 py-0.5 rounded ${
                          incident?.impact === 'None' ? 'bg-green-100 text-green-700' :
                          incident?.impact === 'Low'? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {incident?.impact} Impact
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* API Endpoints Status */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-primary">Endpoint Status</h3>
          <p className="text-sm text-text-secondary mt-1">Individual API endpoint health</p>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {[
              { endpoint: '/api/v1/terminology/search', status: 'healthy', responseTime: '120ms' },
              { endpoint: '/api/v1/fhir/conceptmap', status: 'healthy', responseTime: '95ms' },
              { endpoint: '/api/v1/mapping/validate', status: 'healthy', responseTime: '180ms' },
              { endpoint: '/api/v1/auth/token', status: 'warning', responseTime: '250ms' }
            ]?.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    endpoint?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="font-mono text-sm text-text-primary">{endpoint?.endpoint}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-text-secondary">{endpoint?.responseTime}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(endpoint?.status)}`}>
                    {endpoint?.status === 'healthy' ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPanel;