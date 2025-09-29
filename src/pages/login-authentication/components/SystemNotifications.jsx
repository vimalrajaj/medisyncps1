import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for Dec 30, 2024 from 2:00 AM to 4:00 AM IST.\nWHO ICD-11 synchronization will be temporarily unavailable.`,
      timestamp: '2024-12-27T10:30:00Z',
      priority: 'medium',
      dismissed: false
    },
    {
      id: 2,
      type: 'update',
      title: 'New NAMASTE Codes Available',
      message: `Latest NAMASTE terminology codes have been integrated.\nOver 500 new Ayurveda diagnostic codes now available for mapping.`,
      timestamp: '2024-12-26T14:15:00Z',
      priority: 'low',
      dismissed: false
    },
    {
      id: 3,
      type: 'security',
      title: 'Security Enhancement',
      message: `Enhanced API rate limiting now active.\nDevelopers may need to update integration patterns for optimal performance.`,
      timestamp: '2024-12-25T09:00:00Z',
      priority: 'high',
      dismissed: false
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return 'Settings';
      case 'update':
        return 'Download';
      case 'security':
        return 'Shield';
      default:
        return 'Bell';
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-primary';
      default:
        return 'text-text-secondary';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-error text-error-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => 
      prev?.map(notif => 
        notif?.id === id ? { ...notif, dismissed: true } : notif
      )
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date?.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const activeNotifications = notifications?.filter(n => !n?.dismissed);

  if (activeNotifications?.length === 0) {
    return (
      <div className="bg-card rounded-lg clinical-shadow p-4 border border-border">
        <div className="text-center py-4">
          <Icon name="CheckCircle" size={32} className="text-success mx-auto mb-2" />
          <p className="text-sm text-text-secondary">All systems operational</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary flex items-center">
          <Icon name="Bell" size={16} className="mr-2" />
          System Notifications
        </h3>
        <span className="text-xs text-text-secondary">
          {activeNotifications?.length} active
        </span>
      </div>
      <div className="space-y-2">
        {activeNotifications?.map((notification) => (
          <div 
            key={notification?.id}
            className="bg-card rounded-lg clinical-shadow p-3 border border-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2 flex-1">
                <Icon 
                  name={getNotificationIcon(notification?.type)} 
                  size={16} 
                  className={`mt-0.5 ${getNotificationColor(notification?.priority)}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-xs font-medium text-text-primary truncate">
                      {notification?.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityBadgeColor(notification?.priority)}`}>
                      {notification?.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                    {notification?.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-secondary">
                      {formatTimestamp(notification?.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => dismissNotification(notification?.id)}
                iconName="X"
                className="ml-2 opacity-60 hover:opacity-100"
              />
            </div>
          </div>
        ))}
      </div>
      {activeNotifications?.length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifications(prev => 
              prev?.map(n => ({ ...n, dismissed: true }))
            )}
            className="text-xs"
          >
            Dismiss All
          </Button>
        </div>
      )}
    </div>
  );
};

export default SystemNotifications;