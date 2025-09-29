import React from 'react';
import Icon from '../../../components/AppIcon';

const ClientStatsCard = ({ title, value, change, changeType, icon, color = 'primary' }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-success text-success-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <Icon 
                name={changeType === 'positive' ? 'TrendingUp' : changeType === 'negative' ? 'TrendingDown' : 'Minus'} 
                size={16} 
                className={getChangeColor()} 
              />
              <span className={`text-sm ml-1 ${getChangeColor()}`}>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses()}`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
    </div>
  );
};

export default ClientStatsCard;