import React from 'react';
import Icon from '../../../components/AppIcon';

const CodeComparisonPanel = ({ selectedTerminology, onAddToProblemList }) => {
  if (!selectedTerminology) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Icon name="Search" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Select a Diagnosis</h3>
        <p className="text-text-secondary">
          Search and select a terminology from the search results to view dual-coding comparison
        </p>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 80) return 'text-warning';
    return 'text-error';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 90) return 'bg-success/10 border-success/20';
    if (confidence >= 80) return 'bg-warning/10 border-warning/20';
    return 'bg-error/10 border-error/20';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 80) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Dual-Coding Comparison</h3>
          <div className="flex items-center space-x-2">
            <Icon name="GitCompare" size={20} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">FHIR R4 Compliant</span>
          </div>
        </div>
      </div>
      {/* Split Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* NAMASTE Code Panel */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <h4 className="font-semibold text-text-primary">NAMASTE Code</h4>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceBg(selectedTerminology?.confidence)} ${getConfidenceColor(selectedTerminology?.confidence)}`}>
              {selectedTerminology?.confidence}% - {getConfidenceLabel(selectedTerminology?.confidence)}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Code</label>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                <span className="font-mono text-lg font-semibold text-primary">{selectedTerminology?.code}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Display Name</label>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                <span className="font-medium text-text-primary">{selectedTerminology?.display}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Description</label>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                <p className="text-sm text-text-secondary">{selectedTerminology?.description}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">System</label>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium text-text-primary">{selectedTerminology?.system}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ICD-11 TM2 Code Panel */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <h4 className="font-semibold text-text-primary">ICD-11 TM2</h4>
            </div>
            {selectedTerminology?.icd11 && (
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getConfidenceBg(selectedTerminology?.icd11?.confidence)} ${getConfidenceColor(selectedTerminology?.icd11?.confidence)}`}>
                {selectedTerminology?.icd11?.confidence}%
              </div>
            )}
          </div>

          {selectedTerminology?.icd11 ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Code</label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <span className="font-mono text-sm font-semibold text-accent">{selectedTerminology?.icd11?.code}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Display</label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <span className="text-sm text-text-primary">{selectedTerminology?.icd11?.display}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Icon name="AlertTriangle" size={24} className="text-warning mb-2 mx-auto" />
              <p className="text-xs text-text-secondary">No TM2 mapping</p>
            </div>
          )}
        </div>

        {/* Biomedical Code Panel */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-text-primary">Biomedical</h4>
            </div>
            {selectedTerminology?.biomedical && (
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getConfidenceBg(selectedTerminology?.biomedical?.confidence)} ${getConfidenceColor(selectedTerminology?.biomedical?.confidence)}`}>
                {selectedTerminology?.biomedical?.confidence}%
              </div>
            )}
          </div>

          {selectedTerminology?.biomedical ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Code</label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <span className="font-mono text-sm font-semibold text-green-600">{selectedTerminology?.biomedical?.code}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Display</label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <span className="text-sm text-text-primary">{selectedTerminology?.biomedical?.display}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Description</label>
                <div className="mt-1 p-2 bg-muted rounded">
                  <p className="text-xs text-text-secondary">{selectedTerminology?.biomedical?.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Icon name="AlertTriangle" size={24} className="text-warning mb-2 mx-auto" />
              <p className="text-xs text-text-secondary">No biomedical mapping</p>
            </div>
          )}
        </div>
      </div>
      {/* Action Footer */}
      <div className="bg-muted px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-text-secondary">
            <div className="flex items-center space-x-1">
              <Icon name="Shield" size={14} />
              <span>FHIR R4 Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Clock" size={14} />
              <span>Last Updated: {new Date()?.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddToProblemList(selectedTerminology)}
              className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 clinical-transition flex items-center space-x-1"
            >
              <Icon name="Plus" size={14} />
              <span>Add to Problem List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeComparisonPanel;