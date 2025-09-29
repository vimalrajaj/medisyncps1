import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemStatusWidget = () => {
  const systemStatus = {
    whoSync: {
      status: 'success',
      lastUpdate: new Date(Date.now() - 3600000), // 1 hour ago
      nextUpdate: new Date(Date.now() + 82800000), // 23 hours from now
      message: 'WHO ICD-11 database synchronized successfully'
    },
    apiHealth: {
      status: 'success',
      uptime: '99.8%',
      responseTime: '142ms',
      message: 'All API endpoints operational'
    },
    database: {
      status: 'warning',
      connections: '847/1000',
      storage: '78%',
      message: 'Database storage approaching 80% capacity'
    },
    security: {
      status: 'success',
      lastScan: new Date(Date.now() - 86400000), // 24 hours ago
      threats: 0,
      message: 'No security threats detected'
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Clock';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-text-secondary border-border';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp?.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">System Status</h3>
        </div>
        <Button variant="ghost" size="sm" iconName="RefreshCw">
          Refresh
        </Button>
      </div>
      <div className="space-y-4">
        {/* WHO ICD-11 Synchronization */}
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon name="Globe" size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">WHO ICD-11 Sync</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 border rounded-full text-xs font-medium ${getStatusBadge(systemStatus?.whoSync?.status)}`}>
              <Icon name={getStatusIcon(systemStatus?.whoSync?.status)} size={12} />
              <span className="capitalize">{systemStatus?.whoSync?.status}</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-2">{systemStatus?.whoSync?.message}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Last: {formatTimestamp(systemStatus?.whoSync?.lastUpdate)}</span>
            <span>Next: {formatTimestamp(systemStatus?.whoSync?.nextUpdate)}</span>
          </div>
        </div>

        {/* API Health */}
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon name="Server" size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">API Health</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 border rounded-full text-xs font-medium ${getStatusBadge(systemStatus?.apiHealth?.status)}`}>
              <Icon name={getStatusIcon(systemStatus?.apiHealth?.status)} size={12} />
              <span className="capitalize">{systemStatus?.apiHealth?.status}</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-2">{systemStatus?.apiHealth?.message}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Uptime: {systemStatus?.apiHealth?.uptime}</span>
            <span>Response: {systemStatus?.apiHealth?.responseTime}</span>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon name="Database" size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Database</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 border rounded-full text-xs font-medium ${getStatusBadge(systemStatus?.database?.status)}`}>
              <Icon name={getStatusIcon(systemStatus?.database?.status)} size={12} />
              <span className="capitalize">{systemStatus?.database?.status}</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-2">{systemStatus?.database?.message}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Connections: {systemStatus?.database?.connections}</span>
            <span>Storage: {systemStatus?.database?.storage}</span>
          </div>
        </div>

        {/* Security Status */}
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon name="Shield" size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Security</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 border rounded-full text-xs font-medium ${getStatusBadge(systemStatus?.security?.status)}`}>
              <Icon name={getStatusIcon(systemStatus?.security?.status)} size={12} />
              <span className="capitalize">{systemStatus?.security?.status}</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-2">{systemStatus?.security?.message}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Last Scan: {formatTimestamp(systemStatus?.security?.lastScan)}</span>
            <span>Threats: {systemStatus?.security?.threats}</span>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" fullWidth size="sm" iconName="Settings">
          System Configuration
        </Button>
      </div>
    </div>
  );
};

export default SystemStatusWidget;