import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProblemList = ({ problems, onRemove, onGenerateFHIR, onSaveToRecord, isSaving = false, selectedPatient }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'validated':
        return <Icon name="CheckCircle" size={16} className="text-success" />;
      case 'pending':
        return <Icon name="Clock" size={16} className="text-warning" />;
      case 'error':
        return <Icon name="AlertCircle" size={16} className="text-error" />;
      default:
        return <Icon name="Circle" size={16} className="text-text-secondary" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'validated':
        return 'FHIR Validated';
      case 'pending':
        return 'Validation Pending';
      case 'error':
        return 'Validation Error';
      default:
        return 'Not Validated';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 80) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="List" size={20} className="text-text-secondary" />
            <h3 className="text-lg font-semibold text-text-primary">Problem List</h3>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
              {problems?.length} {problems?.length === 1 ? 'diagnosis' : 'diagnoses'}
            </span>
            {selectedPatient && (
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <span>•</span>
                <Icon name="User" size={14} />
                <span>Patient: {selectedPatient.name || selectedPatient.id}</span>
                <span className="text-xs">ID: {selectedPatient.id}</span>
              </div>
            )}
          </div>
          
          {problems?.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                iconName="FileText"
                iconPosition="left"
                onClick={onGenerateFHIR}
              >
                Generate FHIR Bundle
              </Button>
              <Button
                variant="default"
                size="sm"
                iconName={isSaving ? "Loader" : "Save"}
                iconPosition="left"
                onClick={onSaveToRecord}
                disabled={isSaving || !selectedPatient}
                className={isSaving ? "animate-pulse" : ""}
              >
                {isSaving ? "Saving..." : "Save to Patient Record"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Problem List Content */}
      <div className="p-6">
        {problems?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="FileText" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <h4 className="text-lg font-medium text-text-primary mb-2">No Diagnoses Added</h4>
            <p className="text-text-secondary">
              Search and select diagnoses to build the patient's problem list
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {problems?.map((problem, index) => (
              <div
                key={problem?.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 clinical-transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-text-secondary">#{index + 1}</span>
                      <h5 className="font-semibold text-text-primary">{problem?.display}</h5>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(problem?.status)}
                        <span className="text-xs text-text-secondary">{getStatusLabel(problem?.status)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {/* NAMASTE Code */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">NAMASTE</span>
                        </div>
                        <div className="pl-4">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-mono text-sm font-semibold text-primary">{problem?.code}</span>
                            <span className={`text-xs font-medium ${getConfidenceColor(problem?.confidence)}`}>
                              {problem?.confidence}%
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">{problem?.description}</p>
                        </div>
                      </div>

                      {/* ICD-11 Code */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">ICD-11</span>
                        </div>
                        <div className="pl-4">
                          {problem?.icd11 ? (
                            <>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-mono text-sm font-semibold text-accent">{problem?.icd11?.code}</span>
                                <span className={`text-xs font-medium ${getConfidenceColor(problem?.icd11?.confidence)}`}>
                                  {problem?.icd11?.confidence}%
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary">{problem?.icd11?.display}</p>
                            </>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Icon name="AlertTriangle" size={12} className="text-warning" />
                              <span className="text-xs text-warning">No mapping available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <Icon name="Calendar" size={12} />
                        <span>Added: {new Date(problem.addedAt)?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="User" size={12} />
                        <span>Dr. {problem?.addedBy || 'Current User'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onRemove(problem?.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg clinical-transition"
                      title="Remove from problem list"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer Actions */}
      {problems?.length > 0 && (
        <div className="bg-muted px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Icon name="Shield" size={12} />
                <span>FHIR R4 Bundle Ready</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Database" size={12} />
                <span>Auto-save enabled</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Icon name="Clock" size={12} />
              <span>Last updated: {new Date()?.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemList;