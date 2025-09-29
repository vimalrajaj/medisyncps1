import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ApiTestConsole = ({ endpoint, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('request');

  const mockResponses = {
    '/api/v1/terminology/search': {
      status: 200,
      data: {
        resourceType: "Bundle",
        id: "terminology-search-results",
        type: "searchset",
        total: 3,
        entry: [
          {
            resource: {
              resourceType: "CodeSystem",
              id: "namaste-fever-001",
              url: "http://terminology.ayush.gov.in/CodeSystem/namaste",
              version: "1.0.0",
              name: "NAMASTE_Fever_Concepts",
              title: "NAMASTE Fever Related Concepts",
              status: "active",
              concept: [
                {
                  code: "NAM-F001",
                  display: "Jwara (Fever)",
                  definition: "Elevated body temperature with systemic symptoms in Ayurveda",
                  property: [
                    {
                      code: "icd11-mapping",
                      valueString: "MG30.0"
                    },
                    {
                      code: "confidence",
                      valueDecimal: 0.95
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    '/api/v1/fhir/conceptmap': {
      status: 200,
      data: {
        resourceType: "ConceptMap",
        id: "namaste-to-icd11",
        url: "http://terminology.ayush.gov.in/ConceptMap/namaste-to-icd11",
        version: "1.0.0",
        name: "NAMASTE_to_ICD11_Mapping",
        title: "NAMASTE to ICD-11 Concept Mapping",
        status: "active",
        sourceUri: "http://terminology.ayush.gov.in/CodeSystem/namaste",
        targetUri: "http://id.who.int/icd/release/11/mms",
        group: [
          {
            source: "http://terminology.ayush.gov.in/CodeSystem/namaste",
            target: "http://id.who.int/icd/release/11/mms",
            element: [
              {
                code: "NAM-F001",
                display: "Jwara (Fever)",
                target: [
                  {
                    code: "MG30.0",
                    display: "Fever, unspecified",
                    equivalence: "equivalent",
                    comment: "Direct mapping with high confidence"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  const handleTest = async () => {
    if (!apiKey?.trim()) {
      setResponse({
        status: 401,
        error: "API key is required for authentication"
      });
      return;
    }

    setLoading(true);
    setActiveTab('response');

    // Simulate API call delay
    setTimeout(() => {
      const mockResponse = mockResponses?.[endpoint?.path] || {
        status: 200,
        data: { message: "API endpoint response", timestamp: new Date()?.toISOString() }
      };

      setResponse(mockResponse);
      setLoading(false);
    }, 1500);
  };

  const tabs = [
    { id: 'request', label: 'Request', icon: 'Send' },
    { id: 'response', label: 'Response', icon: 'FileText' },
    { id: 'headers', label: 'Headers', icon: 'Settings' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg clinical-shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Terminal" size={20} className="text-primary" />
            <div>
              <h3 className="font-medium text-text-primary">API Test Console</h3>
              <p className="text-sm text-text-secondary font-mono">{endpoint?.method} {endpoint?.path}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        {/* Authentication */}
        <div className="p-4 bg-muted border-b border-border">
          <Input
            label="API Key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e?.target?.value)}
            description="Use your AYUSH Terminology Service API key"
            className="max-w-md"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium clinical-transition ${
                activeTab === tab?.id
                  ? 'border-b-2 border-primary text-primary bg-primary/5' :'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {activeTab === 'request' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Request URL
                </label>
                <div className="bg-slate-100 p-3 rounded-lg font-mono text-sm">
                  https://api.ayush-terminology.gov.in{endpoint?.path}
                </div>
              </div>

              {endpoint?.method === 'POST' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e?.target?.value)}
                    placeholder='{\n  "query": "fever",\n  "system": "NAMASTE",\n  "limit": 10\n}'
                    className="w-full h-32 p-3 border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <Button
                variant="default"
                iconName="Play"
                iconPosition="left"
                loading={loading}
                onClick={handleTest}
                disabled={!apiKey?.trim()}
              >
                {loading ? 'Testing...' : 'Send Request'}
              </Button>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-text-secondary">Sending request...</span>
                  </div>
                </div>
              ) : response ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      response?.status === 200 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {response?.status}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {response?.status === 200 ? 'Success' : 'Error'}
                    </span>
                  </div>
                  
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-100 font-mono">
                      <code>{JSON.stringify(response?.data || response?.error, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Icon name="Play" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Click "Send Request" to test the API endpoint</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-medium text-text-primary">Authorization</span>
                  <span className="font-mono text-sm text-text-secondary">Bearer {apiKey || 'YOUR_API_KEY'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-medium text-text-primary">Content-Type</span>
                  <span className="font-mono text-sm text-text-secondary">application/json</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-medium text-text-primary">Accept</span>
                  <span className="font-mono text-sm text-text-secondary">application/fhir+json</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-medium text-text-primary">User-Agent</span>
                  <span className="font-mono text-sm text-text-secondary">AYUSH-Terminology-Client/1.0</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTestConsole;