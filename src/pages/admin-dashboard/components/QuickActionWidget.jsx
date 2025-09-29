import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionWidget = () => {
  const quickActions = [
    {
      title: 'Upload Terminology Data',
      description: 'Import CSV files with NAMASTE and ICD-11 mappings',
      icon: 'Upload',
      path: '/terminology-upload',
      color: 'bg-primary',
      textColor: 'text-primary-foreground'
    },
    {
      title: 'Generate API Keys',
      description: 'Create new client credentials for EMR integration',
      icon: 'Key',
      path: '/api-client-management',
      color: 'bg-accent',
      textColor: 'text-accent-foreground'
    },
    {
      title: 'View Audit Trail',
      description: 'Monitor system access and data modifications',
      icon: 'FileText',
      path: '/admin-dashboard',
      color: 'bg-warning',
      textColor: 'text-warning-foreground'
    },
    {
      title: 'Export Analytics Report',
      description: 'Download comprehensive usage and morbidity data',
      icon: 'Download',
      path: '/admin-dashboard',
      color: 'bg-secondary',
      textColor: 'text-secondary-foreground'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Zap" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions?.map((action, index) => (
          <Link
            key={index}
            to={action?.path}
            className="group block p-4 border border-border rounded-lg clinical-transition hover:border-primary hover:clinical-shadow-lg"
          >
            <div className="flex items-start space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 ${action?.color} rounded-lg group-hover:scale-110 clinical-transition`}>
                <Icon name={action?.icon} size={20} className={action?.textColor} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-primary group-hover:text-primary clinical-transition">
                  {action?.title}
                </h4>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {action?.description}
                </p>
              </div>
              <Icon name="ArrowRight" size={16} className="text-text-secondary group-hover:text-primary clinical-transition" />
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" fullWidth iconName="Settings" iconPosition="left">
          System Configuration
        </Button>
      </div>
    </div>
  );
};

export default QuickActionWidget;