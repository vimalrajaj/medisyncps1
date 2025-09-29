import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const ValidationPreview = ({ file, validationData, onValidate, onProcessImport, isValidating, isProcessing }) => {
  const [columnMappings, setColumnMappings] = useState({
    code: '',
    display: '',
    definition: '',
    system: '',
    parent_code: '',
    status: ''
  });

  const requiredFields = [
    { key: 'code', label: 'Code', required: true },
    { key: 'display', label: 'Display Name', required: true },
    { key: 'definition', label: 'Definition', required: true },
    { key: 'system', label: 'System URI', required: true },
    { key: 'parent_code', label: 'Parent Code', required: false },
    { key: 'status', label: 'Status', required: false }
  ];

  const mockCsvHeaders = [
    { value: 'code', label: 'code' },
    { value: 'display', label: 'display' },
    { value: 'definition', label: 'definition' },
    { value: 'system', label: 'system' },
    { value: 'parent_code', label: 'parent_code' },
    { value: 'status', label: 'status' },
    { value: 'properties', label: 'properties' }
  ];

  const handleMappingChange = (field, value) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValidate = () => {
    const mockValidationData = {
      totalRows: 1247,
      validRows: 1198,
      errorRows: 49,
      duplicates: 12,
      completeness: 96.1,
      errors: [
        {
          row: 15,
          field: 'code',
          message: 'Code already exists in system',
          value: 'AYUSH001'
        },
        {
          row: 23,
          field: 'definition',
          message: 'Definition exceeds maximum length',
          value: 'Very long definition text...'
        },
        {
          row: 45,
          field: 'system',
          message: 'Invalid system URI format',
          value: 'invalid-uri'
        }
      ],
      warnings: [
        {
          row: 67,
          field: 'parent_code',
          message: 'Parent code not found in existing terminology',
          value: 'PARENT001'
        }
      ]
    };
    
    onValidate(mockValidationData);
  };

  if (!file) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="FileText" size={32} className="text-muted-foreground" />
          </div>
          <p className="text-text-secondary">Select a CSV file to begin validation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Column Mapping & Validation</h2>
        <p className="text-text-secondary">Map CSV columns to FHIR CodeSystem properties</p>
      </div>
      <div className="space-y-4 mb-6">
        {requiredFields?.map((field) => (
          <div key={field?.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-text-primary">{field?.label}</span>
              {field?.required && (
                <span className="text-destructive text-sm">*</span>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Select
                placeholder={`Select column for ${field?.label}`}
                options={mockCsvHeaders}
                value={columnMappings?.[field?.key]}
                onChange={(value) => handleMappingChange(field?.key, value)}
                disabled={isValidating || isProcessing}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button
          variant="default"
          iconName="CheckCircle"
          iconPosition="left"
          onClick={handleValidate}
          loading={isValidating}
          disabled={isProcessing || !columnMappings?.code || !columnMappings?.display}
          className="flex-1"
        >
          {isValidating ? 'Validating...' : 'Validate Mapping'}
        </Button>
        
        {validationData && (
          <Button
            variant="success"
            iconName="Upload"
            iconPosition="left"
            onClick={onProcessImport}
            loading={isProcessing}
            disabled={isValidating || validationData?.errorRows > 0}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : 'Process Import'}
          </Button>
        )}
      </div>
      {validationData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-text-primary">{validationData?.totalRows}</div>
              <div className="text-sm text-text-secondary">Total Rows</div>
            </div>
            
            <div className="bg-success/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">{validationData?.validRows}</div>
              <div className="text-sm text-text-secondary">Valid Rows</div>
            </div>
            
            <div className="bg-destructive/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{validationData?.errorRows}</div>
              <div className="text-sm text-text-secondary">Error Rows</div>
            </div>
            
            <div className="bg-warning/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-warning">{validationData?.completeness}%</div>
              <div className="text-sm text-text-secondary">Completeness</div>
            </div>
          </div>

          {validationData?.errors?.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-medium text-destructive mb-3 flex items-center">
                <Icon name="AlertCircle" size={16} className="mr-2" />
                Validation Errors ({validationData?.errors?.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validationData?.errors?.slice(0, 5)?.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">Row {error?.row}:</span> {error?.message}
                    {error?.value && (
                      <span className="text-text-secondary ml-2">({error?.value})</span>
                    )}
                  </div>
                ))}
                {validationData?.errors?.length > 5 && (
                  <div className="text-sm text-text-secondary">
                    +{validationData?.errors?.length - 5} more errors...
                  </div>
                )}
              </div>
            </div>
          )}

          {validationData?.warnings && validationData?.warnings?.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <h3 className="font-medium text-warning mb-3 flex items-center">
                <Icon name="AlertTriangle" size={16} className="mr-2" />
                Warnings ({validationData?.warnings?.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {validationData?.warnings?.slice(0, 3)?.map((warning, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">Row {warning?.row}:</span> {warning?.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationPreview;