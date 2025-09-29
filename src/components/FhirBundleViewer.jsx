import React, { useState } from 'react';
import Icon from './AppIcon.jsx';
import Button from './ui/Button';

/**
 * FhirBundleViewer - A reusable component for viewing FHIR bundle data
 * 
 * @param {Object} props
 * @param {Object} props.bundle - The FHIR bundle to display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Object} props.sessionInfo - Additional session information to display (optional)
 * @param {Array} props.diagnoses - Array of diagnoses entries to display (optional)
 */
const FhirBundleViewer = ({ bundle, isOpen, onClose, sessionInfo, diagnoses }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  if (!isOpen || !bundle) {
    return null;
  }

  // Format a date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Count resources by type in the bundle
  const getResourceCounts = () => {
    if (!bundle?.entry || !Array.isArray(bundle.entry)) return {};
    
    return bundle.entry.reduce((counts, entry) => {
      const resourceType = entry.resource?.resourceType;
      if (resourceType) {
        counts[resourceType] = (counts[resourceType] || 0) + 1;
      }
      return counts;
    }, {});
  };

  const resourceCounts = getResourceCounts();

  // Extract patient info from bundle
  const getPatientInfo = () => {
    if (!bundle?.entry || !Array.isArray(bundle.entry)) return null;
    
    const patientEntry = bundle.entry.find(
      entry => entry.resource?.resourceType === 'Patient'
    );
    
    if (!patientEntry) return null;
    
    const patient = patientEntry.resource;
    return {
      id: patient.id,
      identifier: patient.identifier?.[0]?.value || '',
      name: patient.name?.[0]?.text || patient.name?.[0]?.given?.[0] || ''
    };
  };

  const patientInfo = getPatientInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            FHIR Bundle - {bundle.resourceType}
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {bundle.type || 'unknown'} type
            </span>
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-error rounded-lg"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="bg-muted border-b border-border">
          <div className="flex">
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'summary' ? 'bg-card text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'json' ? 'bg-card text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('json')}
            >
              JSON Data
            </button>
            {diagnoses && diagnoses.length > 0 && (
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'diagnoses' ? 'bg-card text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
                onClick={() => setActiveTab('diagnoses')}
              >
                Diagnoses
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6 overflow-auto flex-1">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Bundle Info */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Bundle Information</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Bundle ID</p>
                      <p className="text-sm font-mono">{bundle.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Type</p>
                      <p className="text-sm">{bundle.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Timestamp</p>
                      <p className="text-sm">{formatDate(bundle.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Total Entries</p>
                      <p className="text-sm">{bundle.entry?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Resource Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Resource Breakdown</h4>
                <div className="bg-muted p-4 rounded-lg">
                  {Object.keys(resourceCounts).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(resourceCounts).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type}</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                            {count} {count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No resources found in bundle</p>
                  )}
                </div>
              </div>
              
              {/* Patient Info if available */}
              {patientInfo && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Patient Information</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Patient ID</p>
                        <p className="text-sm">{patientInfo.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Identifier</p>
                        <p className="text-sm">{patientInfo.identifier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Name</p>
                        <p className="text-sm">{patientInfo.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Session Info if provided */}
              {sessionInfo && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Session Information</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(sessionInfo).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs text-text-secondary mb-1">
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </p>
                          <p className="text-sm">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-secondary">Raw FHIR Bundle JSON</h4>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
                    alert('FHIR Bundle JSON copied to clipboard');
                  }}
                  className="text-xs flex items-center space-x-1 text-primary hover:underline"
                >
                  <Icon name="Clipboard" size={12} />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">{JSON.stringify(bundle, null, 2)}</pre>
              </div>
            </div>
          )}
          
          {activeTab === 'diagnoses' && diagnoses && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-4">Diagnosis Entries</h4>
              <div className="space-y-3">
                {diagnoses.map((entry, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{entry.namaste_display}</h5>
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {entry.namaste_code}
                      </span>
                    </div>
                    
                    {entry.icd11_code && (
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm text-text-secondary">
                          <span className="font-medium mr-1">ICD-11:</span>
                          {entry.icd11_display}
                        </div>
                        <span className="font-mono text-xs bg-muted border border-border px-2 py-0.5 rounded">
                          {entry.icd11_code}
                        </span>
                      </div>
                    )}
                    
                    {entry.mapping_confidence && (
                      <div className="text-xs text-text-secondary mb-2">
                        <span className="font-medium mr-1">Mapping Confidence:</span>
                        <span className="bg-muted border border-border px-2 py-0.5 rounded">
                          {entry.mapping_confidence}%
                        </span>
                      </div>
                    )}
                    
                    {entry.clinical_notes && (
                      <div className="text-xs text-text-secondary mt-2 pt-2 border-t border-border">
                        {entry.clinical_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-muted px-6 py-4 border-t border-border">
          <div className="flex justify-between">
            <div className="text-xs text-text-secondary">
              FHIR R4 Bundle ID: <span className="font-mono">{bundle.id}</span>
            </div>
            <Button variant="default" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FhirBundleViewer;