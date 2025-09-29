import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ApiEndpointCard = ({ endpoint, onTest }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'text-emerald-600 bg-emerald-50';
      case 'POST': return 'text-blue-600 bg-blue-50';
      case 'PUT': return 'text-amber-600 bg-amber-50';
      case 'DELETE': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg clinical-shadow">
      <div 
        className="p-4 cursor-pointer clinical-hover"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint?.method)}`}>
              {endpoint?.method?.toUpperCase()}
            </span>
            <div>
              <h3 className="font-medium text-text-primary">{endpoint?.title}</h3>
              <p className="text-sm text-text-secondary font-mono">{endpoint?.path}</p>
            </div>
          </div>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={20} 
            className="text-text-secondary"
          />
        </div>
        <p className="text-sm text-text-secondary mt-2">{endpoint?.description}</p>
      </div>
      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-4 space-y-4">
            {/* Parameters */}
            {endpoint?.parameters && endpoint?.parameters?.length > 0 && (
              <div>
                <h4 className="font-medium text-text-primary mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint?.parameters?.map((param, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm text-text-primary">{param?.name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${param?.required ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {param?.required ? 'Required' : 'Optional'}
                          </span>
                          <span className="text-xs text-text-secondary">{param?.type}</span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{param?.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Schema */}
            <div>
              <h4 className="font-medium text-text-primary mb-2">Response Schema</h4>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-slate-100 font-mono">
                  <code>{JSON.stringify(endpoint?.responseSchema, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <Button 
                variant="default" 
                size="sm"
                iconName="Play"
                iconPosition="left"
                onClick={() => onTest(endpoint)}
              >
                Test Endpoint
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                iconName="Code"
                iconPosition="left"
              >
                View Code
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                iconName="Copy"
                iconPosition="left"
              >
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiEndpointCard;