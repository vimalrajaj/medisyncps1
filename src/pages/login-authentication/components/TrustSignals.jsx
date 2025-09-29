import React from 'react';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const trustBadges = [
    {
      id: 1,
      name: 'Ministry of AYUSH',
      description: 'Government Approved',
      icon: 'Shield',
      color: 'text-success'
    },
    {
      id: 2,
      name: 'FHIR R4 Certified',
      description: 'Healthcare Interoperability',
      icon: 'CheckCircle',
      color: 'text-primary'
    },
    {
      id: 3,
      name: 'ABHA OAuth 2.0',
      description: 'Secure Authentication',
      icon: 'Key',
      color: 'text-blue-600'
    },
    {
      id: 4,
      name: 'SNOMED CT/LOINC',
      description: 'Bridge Semantics',
      icon: 'Network',
      color: 'text-purple-600'
    },
    {
      id: 5,
      name: 'ISO 22600 Compliant',
      description: 'Security Standards',
      icon: 'Lock',
      color: 'text-accent'
    },
    {
      id: 6,
      name: 'EHR Standards 2016',
      description: 'India Compliance',
      icon: 'FileText',
      color: 'text-orange-600'
    }
  ];

  const securityFeatures = [
    'ABHA token authentication',
    'FHIR R4 audit trails',
    'OAuth 2.0 compliance',
    'Role-based FHIR access',
    'Real-time terminology mapping',
    'Ministry of AYUSH compliance'
  ];

  return (
    <div className="space-y-6">
      {/* Trust Badges */}
      <div className="bg-card rounded-lg clinical-shadow p-4 border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center">
          <Icon name="Award" size={16} className="mr-2" />
          Trusted & Certified
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {trustBadges?.map((badge) => (
            <div key={badge?.id} className="flex items-center space-x-2">
              <Icon name={badge?.icon} size={16} className={badge?.color} />
              <div>
                <div className="text-xs font-medium text-text-primary">{badge?.name}</div>
                <div className="text-xs text-text-secondary">{badge?.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Security Features */}
      <div className="bg-card rounded-lg clinical-shadow p-4 border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center">
          <Icon name="Shield" size={16} className="mr-2" />
          Security Features
        </h3>
        <div className="space-y-2">
          {securityFeatures?.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Icon name="Check" size={14} className="text-success" />
              <span className="text-xs text-text-secondary">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      {/* System Status */}
      <div className="bg-card rounded-lg clinical-shadow p-4 border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center">
          <Icon name="Activity" size={16} className="mr-2" />
          System Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">API Services</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-success">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">WHO ICD-11 Sync</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-success">Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">NAMASTE Database</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-success">Updated</span>
            </div>
          </div>
        </div>
      </div>
      {/* Compliance Notice */}
      <div className="bg-muted rounded-lg p-3 border border-border">
        <div className="flex items-start space-x-2">
          <Icon name="Info" size={14} className="text-primary mt-0.5" />
          <div>
            <p className="text-xs text-text-secondary">
              This system complies with India's 2016 EHR Standards and maintains 
              audit trails as per healthcare regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;