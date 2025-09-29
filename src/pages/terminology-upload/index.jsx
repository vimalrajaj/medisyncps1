import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import FileUploadZone from './components/FileUploadZone';
import ValidationPreview from './components/ValidationPreview';
import ProcessingStatus from './components/ProcessingStatus';
import RecentUploads from './components/RecentUploads';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const TerminologyUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [processingData, setProcessingData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setValidationData(null);
    setProcessingData(null);
  };

  const handleValidate = (data) => {
    setIsValidating(true);
    
    // Simulate validation process
    setTimeout(() => {
      setValidationData(data);
      setIsValidating(false);
    }, 2000);
  };

  const handleProcessImport = () => {
    setIsProcessing(true);
    
    // Simulate processing
    const mockProcessingData = {
      status: 'processing',
      message: 'Importing terminology data...',
      startTime: new Date()?.toLocaleTimeString('en-IN'),
      progress: 0,
      processedRows: 0,
      totalRows: validationData?.totalRows || 1247,
      steps: [
        { name: 'File Validation', status: 'completed', description: 'CSV format and structure verified', duration: '15s' },
        { name: 'Data Mapping', status: 'completed', description: 'Column mapping to FHIR properties', duration: '8s' },
        { name: 'FHIR Resource Generation', status: 'processing', description: 'Creating CodeSystem resources' },
        { name: 'Database Import', status: 'pending', description: 'Importing to terminology database' },
        { name: 'Index Update', status: 'pending', description: 'Updating search indices' }
      ]
    };

    setProcessingData(mockProcessingData);

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        
        // Complete processing
        setTimeout(() => {
          setProcessingData({
            ...mockProcessingData,
            status: 'completed',
            message: 'Import completed successfully',
            progress: 100,
            processedRows: mockProcessingData?.totalRows,
            steps: mockProcessingData?.steps?.map(step => ({ ...step, status: 'completed' })),
            results: {
              imported: 1198,
              updated: 37,
              skipped: 12,
              total: 1247
            }
          });
          setIsProcessing(false);
        }, 1000);
      } else {
        setProcessingData(prev => ({
          ...prev,
          progress: Math.round(progress),
          processedRows: Math.round((progress / 100) * prev?.totalRows)
        }));
      }
    }, 500);
  };

  const handleDownloadReport = () => {
    const reportContent = `AYUSH Terminology Upload Report
Generated: ${new Date()?.toLocaleString('en-IN')}

File: ${selectedFile?.name}
Status: ${processingData?.status}
Total Rows: ${processingData?.totalRows}
Imported: ${processingData?.results?.imported}
Updated: ${processingData?.results?.updated}
Skipped: ${processingData?.results?.skipped}

Processing Time: ${processingData?.duration || 'N/A'}
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminology_upload_report_${new Date()?.toISOString()?.split('T')?.[0]}.txt`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  const handleViewAuditTrail = () => {
    // Navigate to audit trail or show modal
    console.log('View audit trail for upload:', selectedFile?.name);
  };

  const handleViewUploadDetails = (upload) => {
    console.log('View details for upload:', upload?.fileName);
  };

  const tabs = [
    { id: 'upload', label: 'Upload & Process', icon: 'Upload' },
    { id: 'history', label: 'Upload History', icon: 'History' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full px-4 lg:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Upload" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Terminology Upload</h1>
                <p className="text-text-secondary">Import and validate AYUSH terminology data</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Total Uploads</p>
                    <p className="text-2xl font-bold text-text-primary">1,247</p>
                  </div>
                  <Icon name="FileText" size={24} className="text-primary" />
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Success Rate</p>
                    <p className="text-2xl font-bold text-success">96.2%</p>
                  </div>
                  <Icon name="CheckCircle" size={24} className="text-success" />
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Processing</p>
                    <p className="text-2xl font-bold text-primary">3</p>
                  </div>
                  <Icon name="Loader" size={24} className="text-primary" />
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Last Sync</p>
                    <p className="text-2xl font-bold text-text-primary">2h ago</p>
                  </div>
                  <Icon name="RefreshCw" size={24} className="text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm clinical-transition ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* File Upload Section */}
                <div className="space-y-6">
                  <FileUploadZone
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                    selectedFile={selectedFile}
                  />
                  
                  {processingData && (
                    <ProcessingStatus
                      processingData={processingData}
                      onDownloadReport={handleDownloadReport}
                      onViewAuditTrail={handleViewAuditTrail}
                    />
                  )}
                </div>

                {/* Validation Section */}
                <div>
                  <ValidationPreview
                    file={selectedFile}
                    validationData={validationData}
                    onValidate={handleValidate}
                    onProcessImport={handleProcessImport}
                    isValidating={isValidating}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>

              {/* WHO ICD-11 Sync Status */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">WHO ICD-11 Synchronization</h3>
                    <p className="text-text-secondary">Automated daily updates from WHO International Terminologies</p>
                  </div>
                  <Button variant="outline" iconName="RefreshCw" iconPosition="left">
                    Sync Now
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="CheckCircle" size={16} className="text-success" />
                      <span className="font-medium text-success">Last Sync Successful</span>
                    </div>
                    <p className="text-sm text-text-secondary">Today at 06:00 IST</p>
                    <p className="text-sm text-text-secondary">Updated 1,247 codes</p>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="Clock" size={16} className="text-primary" />
                      <span className="font-medium text-primary">Next Sync Scheduled</span>
                    </div>
                    <p className="text-sm text-text-secondary">Tomorrow at 06:00 IST</p>
                    <p className="text-sm text-text-secondary">Automatic daily sync</p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="Database" size={16} className="text-text-secondary" />
                      <span className="font-medium text-text-primary">Total ICD-11 Codes</span>
                    </div>
                    <p className="text-sm text-text-secondary">55,000+ active codes</p>
                    <p className="text-sm text-text-secondary">Version 2024-01</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <RecentUploads onViewDetails={handleViewUploadDetails} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminologyUpload;