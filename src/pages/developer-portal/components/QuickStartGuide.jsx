import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickStartGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'register',
      title: 'Get API Key',
      description: 'Register your application and obtain API credentials',
      icon: 'Key',
      content: `1. Visit the API Client Management section
2. Click "Register New Application"
3. Fill in your application details
4. Copy your API key and secret
5. Store credentials securely in your environment`,
      code: `# Add to your .env file
AYUSH_API_KEY=your_api_key_here
AYUSH_API_SECRET=your_api_secret_here
AYUSH_BASE_URL=https://api.ayush-terminology.gov.in`
    },
    {
      id: 'authenticate',
      title: 'Authentication',
      description: 'Authenticate your requests using Bearer tokens',
      icon: 'Shield',
      content: `All API requests require authentication using Bearer tokens.
Include your API key in the Authorization header of every request.`,
      code: `curl -H "Authorization: Bearer YOUR_API_KEY" \ -H"Content-Type: application/json"\ -H"Accept: application/fhir+json" \\
     https://api.ayush-terminology.gov.in/api/v1/terminology/search`
    },
    {
      id: 'search',
      title: 'Search Terminology',
      description: 'Search NAMASTE and ICD-11 terminology codes',
      icon: 'Search',
      content: `Use the terminology search endpoint to find relevant codes.
Supports fuzzy matching and multi-language queries.`,
      code: `{
  "query": "fever",
  "system": "NAMASTE",
  "limit": 10,
  "language": "en",
  "includeMapping": true
}`
    },
    {
      id: 'mapping',
      title: 'Get Mappings',
      description: 'Retrieve NAMASTE to ICD-11 concept mappings',
      icon: 'GitBranch',
      content: `Fetch concept mappings between NAMASTE and ICD-11 terminologies.
Returns FHIR ConceptMap resources with confidence scores.`,
      code: `GET /api/v1/fhir/conceptmap?source=NAM-F001&target=ICD11

Response:
{
  "resourceType": "ConceptMap",
  "source": "NAM-F001",
  "target": "MG30.0",
  "equivalence": "equivalent",
  "confidence": 0.95
}`
    },
    {
      id: 'fhir',
      title: 'FHIR Integration',
      description: 'Generate FHIR-compliant resources for EMR systems',
      icon: 'FileText',
      content: `All responses follow FHIR R4 specifications.
Perfect for integration with Electronic Medical Record systems.`,
      code: `{
  "resourceType": "Bundle",
  "type": "searchset",
  "entry": [
    {
      "resource": {
        "resourceType": "CodeSystem",
        "url": "http://terminology.ayush.gov.in/CodeSystem/namaste",
        "concept": [...]
      }
    }
  ]
}`
    }
  ];

  const sdkDownloads = [
    {
      name: 'JavaScript SDK',
      description: 'NPM package for Node.js and browser applications',
      icon: 'FileText',
      version: 'v1.2.0',
      size: '45KB',
      downloads: '2.1K'
    },
    {
      name: 'Python SDK',
      description: 'PyPI package for Python applications',
      icon: 'FileText',
      version: 'v1.1.5',
      size: '38KB',
      downloads: '1.8K'
    },
    {
      name: 'Java SDK',
      description: 'Maven package for Java applications',
      icon: 'FileText',
      version: 'v1.0.8',
      size: '125KB',
      downloads: '950'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Start Steps */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-primary">Quick Start Guide</h3>
          <p className="text-sm text-text-secondary mt-1">Get started with AYUSH Terminology Service in 5 steps</p>
        </div>
        
        <div className="p-4">
          {/* Step Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {steps?.map((step, index) => (
              <button
                key={step?.id}
                onClick={() => setActiveStep(index)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium clinical-transition ${
                  activeStep === index
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                <Icon name={step?.icon} size={16} />
                <span>{index + 1}. {step?.title}</span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-text-primary mb-2">{steps?.[activeStep]?.title}</h4>
              <p className="text-text-secondary mb-4">{steps?.[activeStep]?.content}</p>
            </div>

            {/* Code Example */}
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
                <span className="text-sm text-slate-300">Example</span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Copy"
                  className="text-slate-300 hover:text-white"
                >
                  Copy
                </Button>
              </div>
              <div className="p-4">
                <pre className="text-sm text-slate-100 font-mono overflow-x-auto">
                  <code>{steps?.[activeStep]?.code}</code>
                </pre>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                iconName="ChevronLeft"
                iconPosition="left"
                disabled={activeStep === 0}
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Step {activeStep + 1} of {steps?.length}
              </span>
              <Button
                variant="default"
                iconName="ChevronRight"
                iconPosition="right"
                disabled={activeStep === steps?.length - 1}
                onClick={() => setActiveStep(Math.min(steps?.length - 1, activeStep + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* SDK Downloads */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-primary">SDK Downloads</h3>
          <p className="text-sm text-text-secondary mt-1">Official SDKs for popular programming languages</p>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sdkDownloads?.map((sdk, index) => (
              <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted clinical-transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name={sdk?.icon} size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{sdk?.name}</h4>
                      <p className="text-xs text-text-secondary">{sdk?.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                  <span>{sdk?.version}</span>
                  <span>{sdk?.size}</span>
                  <span>{sdk?.downloads} downloads</span>
                </div>
                
                <Button variant="outline" size="sm" fullWidth>
                  Download SDK
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Integration Examples */}
      <div className="bg-card border border-border rounded-lg clinical-shadow">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-primary">Integration Examples</h3>
          <p className="text-sm text-text-secondary mt-1">Common integration patterns and use cases</p>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'EMR Integration',
                description: 'Integrate with Electronic Medical Record systems',
                icon: 'Database',
                tags: ['FHIR R4', 'HL7', 'EMR']
              },
              {
                title: 'Clinical Workflow',
                description: 'Real-time terminology lookup during patient care',
                icon: 'Stethoscope',
                tags: ['Real-time', 'Auto-complete', 'Clinical']
              },
              {
                title: 'Batch Processing',
                description: 'Process large datasets with bulk operations',
                icon: 'Upload',
                tags: ['Bulk', 'CSV', 'Batch']
              },
              {
                title: 'Analytics Dashboard',
                description: 'Build reporting and analytics applications',
                icon: 'BarChart',
                tags: ['Analytics', 'Reporting', 'Dashboard']
              }
            ]?.map((example, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Icon name={example?.icon} size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{example?.title}</h4>
                    <p className="text-sm text-text-secondary">{example?.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {example?.tags?.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-0.5 text-xs bg-muted text-text-secondary rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;