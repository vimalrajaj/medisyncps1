import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FileUploadZone = ({ onFileSelect, isProcessing, selectedFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e?.dataTransfer?.files);
    const csvFile = files?.find(file => file?.type === 'text/csv' || file?.name?.endsWith('.csv'));
    
    if (csvFile) {
      onFileSelect(csvFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const downloadTemplate = () => {
    const csvContent = `code,display,definition,system,parent_code,status
AYUSH001,"Vata Dosha Imbalance","Constitutional imbalance of Vata dosha","http://namaste.gov.in/fhir/CodeSystem/ayush-diagnosis","","active"
AYUSH002,"Pitta Dosha Excess","Excessive Pitta dosha manifestation","http://namaste.gov.in/fhir/CodeSystem/ayush-diagnosis","","active"
AYUSH003,"Kapha Dosha Stagnation","Stagnant Kapha dosha condition","http://namaste.gov.in/fhir/CodeSystem/ayush-diagnosis","","active"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminology_template.csv';
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Upload Terminology Data</h2>
        <p className="text-text-secondary">Import AYUSH terminology codes via CSV file. Ensure data follows FHIR CodeSystem standards.</p>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center clinical-transition ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : selectedFile
            ? 'border-success bg-success/5' :'border-border hover:border-primary/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            selectedFile ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Icon name={selectedFile ? "CheckCircle" : "Upload"} size={32} />
          </div>
          
          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-success">File Selected</p>
              <p className="text-text-primary font-medium">{selectedFile?.name}</p>
              <p className="text-sm text-text-secondary">
                Size: {(selectedFile?.size / 1024)?.toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-text-primary">
                {isDragOver ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
              </p>
              <p className="text-text-secondary">or click to browse files</p>
            </div>
          )}
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          
          <label htmlFor="file-upload">
            <Button
              variant={selectedFile ? "outline" : "default"}
              disabled={isProcessing}
              className="cursor-pointer"
            >
              {selectedFile ? 'Choose Different File' : 'Browse Files'}
            </Button>
          </label>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={downloadTemplate}
            className="flex-1"
          >
            Download Template
          </Button>
          
          <Button
            variant="ghost"
            iconName="FileText"
            iconPosition="left"
            className="flex-1"
          >
            View Format Guide
          </Button>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-medium text-text-primary mb-2">File Requirements:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• CSV format with UTF-8 encoding</li>
            <li>• Maximum file size: 10 MB</li>
            <li>• Required columns: code, display, definition, system</li>
            <li>• Optional columns: parent_code, status, properties</li>
            <li>• FHIR CodeSystem compliance required</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;