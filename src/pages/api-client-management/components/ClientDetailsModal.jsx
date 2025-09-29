import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ClientDetailsModal = ({ client, onClose }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN')?.format(num);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-success text-success-foreground', label: 'Active' },
      suspended: { color: 'bg-error text-error-foreground', label: 'Suspended' },
      pending: { color: 'bg-warning text-warning-foreground', label: 'Pending' },
      expired: { color: 'bg-muted text-muted-foreground', label: 'Expired' }
    };
    
    const config = statusConfig?.[status] || statusConfig?.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg clinical-shadow max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Building2" size={20} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{client?.organizationName}</h2>
              <p className="text-sm text-text-secondary">{client?.contactEmail}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(client?.status)}
            <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Client ID:</span>
                    <span className="font-mono text-sm text-text-primary">{client?.clientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Client Type:</span>
                    <span className="font-medium text-text-primary">{client?.clientType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Registration Date:</span>
                    <span className="font-medium text-text-primary">{client?.registrationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">API Version:</span>
                    <span className="font-medium text-text-primary">{client?.apiVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">FHIR Compliance:</span>
                    <span className="font-medium text-success">R4 Certified</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Primary Contact:</span>
                    <span className="font-medium text-text-primary">{client?.primaryContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Phone:</span>
                    <span className="font-medium text-text-primary">{client?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Address:</span>
                    <span className="font-medium text-text-primary text-right max-w-xs">
                      {client?.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage & Performance */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Usage Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Daily Usage:</span>
                    <span className="font-medium text-text-primary">
                      {formatNumber(client?.dailyUsage)} requests
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Monthly Usage:</span>
                    <span className="font-medium text-text-primary">
                      {formatNumber(client?.monthlyUsage)} requests
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Requests:</span>
                    <span className="font-medium text-text-primary">
                      {formatNumber(client?.totalRequests)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Rate Limit:</span>
                    <span className="font-medium text-text-primary">
                      {formatNumber(client?.rateLimit)}/hour
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Success Rate:</span>
                    <span className="font-medium text-success">{client?.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Response Time:</span>
                    <span className="font-medium text-text-primary">{client?.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Error Rate:</span>
                    <span className="font-medium text-error">{client?.errorRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Activity:</span>
                    <span className="font-medium text-text-primary">{client?.lastActivity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Endpoints Usage */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">API Endpoints Usage</h3>
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client?.endpointUsage?.map((endpoint, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{endpoint?.name}</span>
                      <span className="text-xs text-text-secondary">{endpoint?.method}</span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {formatNumber(endpoint?.requests)} requests
                    </div>
                    <div className="w-full bg-border rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${endpoint?.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Security & Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-3">API Key Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Key Created:</span>
                    <span className="font-medium text-text-primary">{client?.keyCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Rotated:</span>
                    <span className="font-medium text-text-primary">{client?.lastKeyRotation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Expires:</span>
                    <span className="font-medium text-warning">{client?.keyExpiry}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-3">Compliance Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">FHIR R4:</span>
                    <Icon name="CheckCircle" size={16} className="text-success" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">ISO 22600:</span>
                    <Icon name="CheckCircle" size={16} className="text-success" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">ABHA Integration:</span>
                    <Icon name="CheckCircle" size={16} className="text-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-border">
            <Button
              variant="default"
              iconName="RotateCcw"
              iconPosition="left"
              className="flex-1"
            >
              Regenerate API Key
            </Button>
            <Button
              variant="outline"
              iconName="Settings"
              iconPosition="left"
              className="flex-1"
            >
              Update Rate Limits
            </Button>
            <Button
              variant="outline"
              iconName="BarChart3"
              iconPosition="left"
              className="flex-1"
            >
              View Analytics
            </Button>
            <Button
              variant="destructive"
              iconName="Pause"
              iconPosition="left"
              className="flex-1"
            >
              Suspend Client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;