import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfirmationModal = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'AlertTriangle'
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'destructive':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-success';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg clinical-shadow max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${getIconColor()}`}>
              <Icon name={icon} size={20} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          </div>
          
          <p className="text-text-secondary mb-6 leading-relaxed">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;