import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NotificationCenter = () => {
  const [filter, setFilter] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'alert',
      priority: 'high',
      title: 'WHO ICD-11 Sync Failed',
      message: 'Daily synchronization with WHO ICD-11 API encountered connection timeout. Manual retry required.',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'warning',
      priority: 'medium',
      title: 'Mapping Quality Issue',
      message: 'NAMASTE code A001.2 has low confidence mapping to ICD-11. Clinical review needed.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false
    },
    {
      id: 3,
      type: 'info',
      priority: 'low',
      title: 'New API Client Registration',
      message: 'Apollo Hospitals EMR system has requested API access. Approval pending.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: true
    },
    {
      id: 4,
      type: 'success',
      priority: 'low',
      title: 'Terminology Upload Complete',
      message: 'Successfully imported 1,247 new AYUSH terminology mappings from CSV file.',
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      read: true
    },
    {
      id: 5,
      type: 'feedback',
      priority: 'medium',
      title: 'Clinical Feedback Received',
      message: 'Dr. Sharma reported accuracy issue with Panchakosha mapping. Review required.',
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      read: false
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return 'AlertTriangle';
      case 'warning': return 'AlertCircle';
      case 'info': return 'Info';
      case 'success': return 'CheckCircle';
      case 'feedback': return 'MessageSquare';
      default: return 'Bell';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (type === 'alert' || priority === 'high') return 'text-destructive';
    if (type === 'warning' || priority === 'medium') return 'text-warning';
    if (type === 'success') return 'text-success';
    return 'text-primary';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-destructive text-destructive-foreground',
      medium: 'bg-warning text-warning-foreground',
      low: 'bg-muted text-text-secondary'
    };
    return colors?.[priority] || colors?.low;
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === 'unread') return !notification?.read;
    if (filter === 'high') return notification?.priority === 'high';
    return true;
  });

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp?.toLocaleDateString('en-IN');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Bell" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
          <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
            {notifications?.filter(n => !n?.read)?.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e?.target?.value)}
            className="px-3 py-1 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="high">High Priority</option>
          </select>
          <Button variant="ghost" size="sm" iconName="Settings" />
        </div>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotifications?.map((notification) => (
          <div
            key={notification?.id}
            className={`p-4 border rounded-lg clinical-transition hover:border-primary cursor-pointer ${
              notification?.read ? 'border-border bg-background' : 'border-primary/20 bg-primary/5'
            }`}
          >
            <div className="flex items-start space-x-3">
              <Icon 
                name={getNotificationIcon(notification?.type)} 
                size={18} 
                className={getNotificationColor(notification?.type, notification?.priority)} 
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-sm font-medium ${notification?.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {notification?.title}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(notification?.priority)}`}>
                    {notification?.priority}
                  </span>
                </div>
                
                <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                  {notification?.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {formatTimestamp(notification?.timestamp)}
                  </span>
                  
                  {!notification?.read && (
                    <button className="text-xs text-primary hover:text-primary/80 clinical-transition">
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="outline" fullWidth size="sm">
          View All Notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationCenter;