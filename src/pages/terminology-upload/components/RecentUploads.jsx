import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentUploads = ({ onViewDetails }) => {
  const [selectedUpload, setSelectedUpload] = useState(null);

  const recentUploads = [
    {
      id: 'upload_001',
      fileName: 'ayush_terminology_batch_1.csv',
      uploadDate: '2025-09-27T10:30:00Z',
      status: 'completed',
      totalRows: 1247,
      importedRows: 1198,
      errorRows: 49,
      uploadedBy: 'Dr. Rajesh Kumar',
      fileSize: '156 KB',
      processingTime: '2m 34s',
      systemUpdated: 'NAMASTE CodeSystem'
    },
    {
      id: 'upload_002',
      fileName: 'icd11_mapping_update.csv',
      uploadDate: '2025-09-26T14:15:00Z',
      status: 'completed',
      totalRows: 892,
      importedRows: 892,
      errorRows: 0,
      uploadedBy: 'Dr. Priya Sharma',
      fileSize: '98 KB',
      processingTime: '1m 45s',
      systemUpdated: 'ICD-11 Mapping'
    },
    {
      id: 'upload_003',
      fileName: 'siddha_terminology.csv',
      uploadDate: '2025-09-26T09:20:00Z',
      status: 'failed',
      totalRows: 567,
      importedRows: 234,
      errorRows: 333,
      uploadedBy: 'Dr. Meera Nair',
      fileSize: '67 KB',
      processingTime: '45s',
      systemUpdated: 'Siddha CodeSystem',
      errorMessage: 'Multiple validation errors in code format'
    },
    {
      id: 'upload_004',
      fileName: 'unani_diagnosis_codes.csv',
      uploadDate: '2025-09-25T16:45:00Z',
      status: 'processing',
      totalRows: 1456,
      importedRows: 892,
      errorRows: 12,
      uploadedBy: 'Dr. Ahmed Hassan',
      fileSize: '189 KB',
      processingTime: 'In progress',
      systemUpdated: 'Unani CodeSystem'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-success text-success-foreground', icon: 'CheckCircle' },
      failed: { color: 'bg-destructive text-destructive-foreground', icon: 'XCircle' },
      processing: { color: 'bg-primary text-primary-foreground', icon: 'Loader' },
      pending: { color: 'bg-warning text-warning-foreground', icon: 'Clock' }
    };
    
    const config = statusConfig?.[status] || statusConfig?.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        <Icon name={config?.icon} size={12} className={`mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (upload) => {
    setSelectedUpload(upload);
    if (onViewDetails) {
      onViewDetails(upload);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Recent Uploads</h2>
        <p className="text-text-secondary">Track and manage terminology upload history</p>
      </div>
      <div className="space-y-4">
        {recentUploads?.map((upload) => (
          <div
            key={upload?.id}
            className={`border border-border rounded-lg p-4 clinical-transition hover:border-primary/30 ${
              selectedUpload?.id === upload?.id ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <Icon name="FileText" size={20} className="text-text-secondary" />
                  <div>
                    <h3 className="font-medium text-text-primary">{upload?.fileName}</h3>
                    <p className="text-sm text-text-secondary">
                      Uploaded by {upload?.uploadedBy} • {formatDate(upload?.uploadDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  {getStatusBadge(upload?.status)}
                  <span className="text-text-secondary">{upload?.fileSize}</span>
                  <span className="text-text-secondary">{upload?.processingTime}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-text-primary">{upload?.totalRows}</div>
                    <div className="text-xs text-text-secondary">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-success">{upload?.importedRows}</div>
                    <div className="text-xs text-text-secondary">Imported</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-destructive">{upload?.errorRows}</div>
                    <div className="text-xs text-text-secondary">Errors</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Eye"
                    onClick={() => handleViewDetails(upload)}
                  >
                    Details
                  </Button>
                  
                  {upload?.status === 'failed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="RefreshCw"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {upload?.errorMessage && (
              <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-2" />
                  {upload?.errorMessage}
                </p>
              </div>
            )}

            {upload?.status === 'processing' && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Processing Progress</span>
                  <span className="font-medium text-text-primary">
                    {Math.round((upload?.importedRows / upload?.totalRows) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full clinical-transition"
                    style={{ width: `${(upload?.importedRows / upload?.totalRows) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-text-secondary">
            Showing {recentUploads?.length} recent uploads
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" iconName="Download">
              Export History
            </Button>
            <Button variant="ghost" size="sm" iconName="Archive">
              View Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentUploads;