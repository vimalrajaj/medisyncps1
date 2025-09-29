import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProcessingStatus = ({ processingData, onDownloadReport, onViewAuditTrail }) => {
  if (!processingData) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return { name: 'CheckCircle', color: 'text-success' };
      case 'processing':
        return { name: 'Loader', color: 'text-primary animate-spin' };
      case 'failed':
        return { name: 'XCircle', color: 'text-destructive' };
      default:
        return { name: 'Clock', color: 'text-warning' };
    }
  };

  const statusIcon = getStatusIcon(processingData?.status);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Processing Status</h2>
        <p className="text-text-secondary">Real-time import progress and results</p>
      </div>
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name={statusIcon?.name} size={24} className={statusIcon?.color} />
            <div>
              <h3 className="font-medium text-text-primary capitalize">{processingData?.status}</h3>
              <p className="text-sm text-text-secondary">{processingData?.message}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-text-secondary">Started</div>
            <div className="font-medium text-text-primary">{processingData?.startTime}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Progress</span>
            <span className="font-medium text-text-primary">{processingData?.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full clinical-transition"
              style={{ width: `${processingData?.progress}%` }}
            />
          </div>
          <div className="text-xs text-text-secondary">
            {processingData?.processedRows} of {processingData?.totalRows} rows processed
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Processing Steps</h4>
          {processingData?.steps?.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step?.status === 'completed' ? 'bg-success text-success-foreground' :
                step?.status === 'processing' ? 'bg-primary text-primary-foreground' :
                step?.status === 'failed' ? 'bg-destructive text-destructive-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {step?.status === 'completed' ? (
                  <Icon name="Check" size={12} />
                ) : step?.status === 'processing' ? (
                  <Icon name="Loader" size={12} className="animate-spin" />
                ) : step?.status === 'failed' ? (
                  <Icon name="X" size={12} />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{step?.name}</div>
                {step?.description && (
                  <div className="text-xs text-text-secondary">{step?.description}</div>
                )}
              </div>
              {step?.duration && (
                <div className="text-xs text-text-secondary">{step?.duration}</div>
              )}
            </div>
          ))}
        </div>

        {/* Results Summary */}
        {processingData?.status === 'completed' && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <h4 className="font-medium text-success mb-3 flex items-center">
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Import Completed Successfully
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-success">{processingData?.results?.imported}</div>
                <div className="text-xs text-text-secondary">Imported</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">{processingData?.results?.updated}</div>
                <div className="text-xs text-text-secondary">Updated</div>
              </div>
              <div>
                <div className="text-lg font-bold text-destructive">{processingData?.results?.skipped}</div>
                <div className="text-xs text-text-secondary">Skipped</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">{processingData?.results?.total}</div>
                <div className="text-xs text-text-secondary">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Summary */}
        {processingData?.status === 'failed' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-3 flex items-center">
              <Icon name="XCircle" size={16} className="mr-2" />
              Import Failed
            </h4>
            <p className="text-sm text-text-secondary mb-3">{processingData?.errorMessage}</p>
            <div className="text-xs text-text-secondary">
              Failed at row {processingData?.failedRow} • Duration: {processingData?.duration}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={onDownloadReport}
            className="flex-1"
          >
            Download Report
          </Button>
          
          <Button
            variant="ghost"
            iconName="FileText"
            iconPosition="left"
            onClick={onViewAuditTrail}
            className="flex-1"
          >
            View Audit Trail
          </Button>
          
          {processingData?.status === 'completed' && (
            <Button
              variant="default"
              iconName="RefreshCw"
              iconPosition="left"
              className="flex-1"
            >
              Process Another File
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;