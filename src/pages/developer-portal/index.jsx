import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ApiEndpointCard from './components/ApiEndpointCard';
import CodeExamplePanel from './components/CodeExamplePanel';
import ApiTestConsole from './components/ApiTestConsole';
import SystemHealthPanel from './components/SystemHealthPanel';
import QuickStartGuide from './components/QuickStartGuide';

const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState('documentation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showTestConsole, setShowTestConsole] = useState(false);

  const apiEndpoints = [
    {
      id: 'terminology-search',
      title: 'Search Terminology',
      method: 'POST',
      path: '/api/v1/terminology/search',
      description: 'Search NAMASTE and ICD-11 terminology codes with fuzzy matching and multi-language support',
      category: 'Terminology',
      parameters: [
        {
          name: 'query',
          type: 'string',
          required: true,
          description: 'Search term or phrase'
        },
        {
          name: 'system',
          type: 'string',
          required: false,
          description: 'Terminology system (NAMASTE, ICD11, or ALL)'
        },
        {
          name: 'limit',
          type: 'integer',
          required: false,
          description: 'Maximum number of results (default: 10, max: 100)'
        },
        {
          name: 'language',
          type: 'string',
          required: false,
          description: 'Language code (en, hi, etc.)'
        }
      ],
      responseSchema: {
        resourceType: "Bundle",
        type: "searchset",
        total: 0,
        entry: []
      }
    },
    {
      id: 'concept-mapping',
      title: 'Get Concept Mapping',
      method: 'GET',
      path: '/api/v1/fhir/conceptmap',
      description: 'Retrieve NAMASTE to ICD-11 concept mappings with confidence scores',
      category: 'Mapping',
      parameters: [
        {
          name: 'source',
          type: 'string',
          required: true,
          description: 'Source concept code (NAMASTE)'
        },
        {
          name: 'target',
          type: 'string',
          required: false,
          description: 'Target system (ICD11)'
        }
      ],
      responseSchema: {
        resourceType: "ConceptMap",
        url: "http://terminology.ayush.gov.in/ConceptMap/namaste-to-icd11",
        group: []
      }
    },
    {
      id: 'validate-mapping',
      title: 'Validate Mapping',
      method: 'POST',
      path: '/api/v1/mapping/validate',
      description: 'Validate terminology mappings and check for accuracy',
      category: 'Validation',
      parameters: [
        {
          name: 'sourceCode',
          type: 'string',
          required: true,
          description: 'Source terminology code'
        },
        {
          name: 'targetCode',
          type: 'string',
          required: true,
          description: 'Target terminology code'
        },
        {
          name: 'mappingType',
          type: 'string',
          required: false,
          description: 'Type of mapping (equivalent, broader, narrower)'
        }
      ],
      responseSchema: {
        valid: true,
        confidence: 0.95,
        issues: []
      }
    },
    {
      id: 'fhir-bundle',
      title: 'Process FHIR Bundle',
      method: 'POST',
      path: '/api/v1/fhir/bundle',
      description: 'Process FHIR Bundle resources for batch terminology operations',
      category: 'FHIR',
      parameters: [
        {
          name: 'bundle',
          type: 'object',
          required: true,
          description: 'FHIR Bundle resource'
        },
        {
          name: 'operation',
          type: 'string',
          required: true,
          description: 'Operation type (translate, validate, enrich)'
        }
      ],
      responseSchema: {
        resourceType: "Bundle",
        type: "batch-response",
        entry: []
      }
    },
    {
      id: 'auth-token',
      title: 'Generate Auth Token',
      method: 'POST',
      path: '/api/v1/auth/token',
      description: 'Generate JWT authentication tokens for API access',
      category: 'Authentication',
      parameters: [
        {
          name: 'client_id',
          type: 'string',
          required: true,
          description: 'Your application client ID'
        },
        {
          name: 'client_secret',
          type: 'string',
          required: true,
          description: 'Your application client secret'
        },
        {
          name: 'grant_type',
          type: 'string',
          required: true,
          description: 'OAuth grant type (client_credentials)'
        }
      ],
      responseSchema: {
        access_token: "jwt_token_here",
        token_type: "Bearer",
        expires_in: 3600
      }
    }
  ];

  const categories = [
    { id: 'all', name: 'All Endpoints', count: apiEndpoints?.length },
    { id: 'Terminology', name: 'Terminology', count: apiEndpoints?.filter(e => e?.category === 'Terminology')?.length },
    { id: 'Mapping', name: 'Mapping', count: apiEndpoints?.filter(e => e?.category === 'Mapping')?.length },
    { id: 'FHIR', name: 'FHIR', count: apiEndpoints?.filter(e => e?.category === 'FHIR')?.length },
    { id: 'Authentication', name: 'Authentication', count: apiEndpoints?.filter(e => e?.category === 'Authentication')?.length },
    { id: 'Validation', name: 'Validation', count: apiEndpoints?.filter(e => e?.category === 'Validation')?.length }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredEndpoints = apiEndpoints?.filter(endpoint => {
    const matchesSearch = endpoint?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         endpoint?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         endpoint?.path?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || endpoint?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTestEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setShowTestConsole(true);
  };

  const tabs = [
    { id: 'documentation', label: 'API Documentation', icon: 'FileText' },
    { id: 'quickstart', label: 'Quick Start', icon: 'Zap' },
    { id: 'health', label: 'System Health', icon: 'Activity' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full">
        <div className="px-4 lg:px-6 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon name="Code" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">Developer Portal</h1>
                <p className="text-text-secondary">
                  Comprehensive API documentation and testing tools for AYUSH Terminology Service integration
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'API Endpoints', value: '15+', icon: 'Globe', color: 'text-blue-600 bg-blue-50' },
                { label: 'Active Developers', value: '1.2K', icon: 'Users', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'API Calls/Month', value: '2.5M', icon: 'BarChart', color: 'text-purple-600 bg-purple-50' },
                { label: 'Uptime', value: '99.9%', icon: 'CheckCircle', color: 'text-green-600 bg-green-50' }
              ]?.map((stat, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4 clinical-shadow">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stat?.color}`}>
                      <Icon name={stat?.icon} size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-text-primary">{stat?.value}</p>
                      <p className="text-sm text-text-secondary">{stat?.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="default" iconName="Key" iconPosition="left">
                Get API Key
              </Button>
              <Button variant="outline" iconName="Download" iconPosition="left">
                Download SDK
              </Button>
              <Button variant="outline" iconName="ExternalLink" iconPosition="left">
                View Examples
              </Button>
              <Button variant="ghost" iconName="MessageCircle" iconPosition="left">
                Support
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border mb-6">
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
          {activeTab === 'documentation' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Sidebar - Categories and Search */}
              <div className="lg:col-span-1 space-y-6">
                {/* Search */}
                <div className="bg-card border border-border rounded-lg clinical-shadow p-4">
                  <Input
                    type="search"
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e?.target?.value)}
                    className="mb-4"
                  />
                  
                  {/* Categories */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-text-primary mb-3">Categories</h3>
                    {categories?.map((category) => (
                      <button
                        key={category?.id}
                        onClick={() => setSelectedCategory(category?.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm clinical-transition ${
                          selectedCategory === category?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                        }`}
                      >
                        <span>{category?.name}</span>
                        <span className="text-xs opacity-75">{category?.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Example Panel */}
                <CodeExamplePanel endpoint={selectedEndpoint} />
              </div>

              {/* Main Content - API Endpoints */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-text-primary">
                      API Endpoints {searchQuery && `(${filteredEndpoints?.length} results)`}
                    </h2>
                    <div className="text-sm text-text-secondary">
                      {filteredEndpoints?.length} of {apiEndpoints?.length} endpoints
                    </div>
                  </div>

                  {filteredEndpoints?.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Search" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">No endpoints found</h3>
                      <p className="text-text-secondary">Try adjusting your search or category filter</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEndpoints?.map((endpoint) => (
                        <ApiEndpointCard
                          key={endpoint?.id}
                          endpoint={endpoint}
                          onTest={handleTestEndpoint}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quickstart' && <QuickStartGuide />}
          {activeTab === 'health' && <SystemHealthPanel />}
        </div>
      </div>
      {/* Test Console Modal */}
      {showTestConsole && selectedEndpoint && (
        <ApiTestConsole
          endpoint={selectedEndpoint}
          onClose={() => setShowTestConsole(false)}
        />
      )}
    </div>
  );
};

export default DeveloperPortal;