import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MockCredentialsHelper = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const credentials = [
    {
      role: 'Admin',
      email: 'admin@ayush.gov.in',
      password: 'Admin@123',
      description: 'Full system access, user management',
      icon: 'UserCog',
      color: 'text-error'
    },
    {
      role: 'Clinician',
      email: 'doctor@ayush.clinic',
      password: 'Doctor@123',
      description: 'Clinical diagnosis entry, terminology mapping',
      icon: 'Stethoscope',
      color: 'text-primary'
    },
    {
      role: 'Viewer',
      email: 'viewer@ayush.org',
      password: 'Viewer@123',
      description: 'Read-only access, reports viewing',
      icon: 'Eye',
      color: 'text-accent'
    },
    {
      role: 'System',
      apiKey: 'ayush_api_key_2024_system_integration',
      description: 'API integration, developer access',
      icon: 'Code',
      color: 'text-warning'
    }
  ];

  const otpCode = '123456';

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body?.appendChild(textArea);
      textArea?.select();
      document.execCommand('copy');
      document.body?.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  return (
    <div className="bg-card rounded-lg clinical-shadow border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted clinical-transition"
      >
        <div className="flex items-center space-x-2">
          <Icon name="HelpCircle" size={16} className="text-primary" />
          <span className="text-sm font-medium text-text-primary">Demo Credentials</span>
        </div>
        <Icon 
          name={isExpanded ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-text-secondary"
        />
      </button>
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="text-xs text-text-secondary mb-3">
            Use these credentials to test different user roles and access levels:
          </div>

          {credentials?.map((cred, index) => (
            <div key={index} className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name={cred?.icon} size={16} className={cred?.color} />
                <span className="text-sm font-medium text-text-primary">{cred?.role}</span>
              </div>
              
              <div className="text-xs text-text-secondary mb-2">{cred?.description}</div>
              
              {cred?.email && (
                <div className="flex items-center justify-between bg-surface rounded p-2">
                  <div>
                    <div className="text-xs text-text-secondary">Email:</div>
                    <div className="text-xs font-mono text-text-primary">{cred?.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(cred?.email, `email-${index}`)}
                    iconName={copiedField === `email-${index}` ? "Check" : "Copy"}
                  />
                </div>
              )}
              
              {cred?.password && (
                <div className="flex items-center justify-between bg-surface rounded p-2">
                  <div>
                    <div className="text-xs text-text-secondary">Password:</div>
                    <div className="text-xs font-mono text-text-primary">{cred?.password}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(cred?.password, `password-${index}`)}
                    iconName={copiedField === `password-${index}` ? "Check" : "Copy"}
                  />
                </div>
              )}
              
              {cred?.apiKey && (
                <div className="flex items-center justify-between bg-surface rounded p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-secondary">API Key:</div>
                    <div className="text-xs font-mono text-text-primary truncate">{cred?.apiKey}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(cred?.apiKey, `apikey-${index}`)}
                    iconName={copiedField === `apikey-${index}` ? "Check" : "Copy"}
                  />
                </div>
              )}
            </div>
          ))}

          {/* OTP Information */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Shield" size={16} className="text-success" />
              <span className="text-sm font-medium text-text-primary">Multi-Factor Authentication</span>
            </div>
            <div className="text-xs text-text-secondary mb-2">
              Use this OTP code when prompted for two-factor authentication:
            </div>
            <div className="flex items-center justify-between bg-surface rounded p-2">
              <div>
                <div className="text-xs text-text-secondary">OTP Code:</div>
                <div className="text-lg font-mono text-text-primary tracking-widest">{otpCode}</div>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => copyToClipboard(otpCode, 'otp')}
                iconName={copiedField === 'otp' ? "Check" : "Copy"}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Icon name="Info" size={14} className="text-primary mt-0.5" />
            <div className="text-xs text-text-secondary">
              <strong>Note:</strong> These are demo credentials for testing purposes only. 
              In production, use your actual AYUSH system credentials or ABHA authentication.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockCredentialsHelper;