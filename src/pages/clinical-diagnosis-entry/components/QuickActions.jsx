import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onLanguageChange, currentLanguage, onExport, onImport, problemCount }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' }
  ];

  const currentLang = languages?.find(lang => lang?.code === currentLanguage) || languages?.[0];

  const handleLanguageSelect = (langCode) => {
    onLanguageChange(langCode);
    setShowLanguageMenu(false);
  };

  const handleExport = () => {
    // Mock export functionality
    const exportData = {
      timestamp: new Date()?.toISOString(),
      problemCount,
      format: 'FHIR R4 Bundle',
      status: 'success'
    };
    
    console.log('Exporting data:', exportData);
    onExport(exportData);
  };

  const handleImport = () => {
    // Mock import functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.xml';
    input.onchange = (e) => {
      const file = e?.target?.files?.[0];
      if (file) {
        console.log('Importing file:', file?.name);
        onImport(file);
      }
    };
    input?.click();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">Quick Actions</h4>
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center space-x-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm clinical-transition"
            >
              <span className="text-base">{currentLang?.flag}</span>
              <span className="font-medium">{currentLang?.name}</span>
              <Icon name="ChevronDown" size={14} />
            </button>

            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-popover border border-border rounded-lg clinical-shadow-lg z-50">
                <div className="p-2">
                  {languages?.map((lang) => (
                    <button
                      key={lang?.code}
                      onClick={() => handleLanguageSelect(lang?.code)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm clinical-transition ${
                        lang?.code === currentLanguage
                          ? 'bg-primary text-primary-foreground'
                          : 'text-popover-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="text-base">{lang?.flag}</span>
                      <span className="font-medium">{lang?.name}</span>
                      {lang?.code === currentLanguage && (
                        <Icon name="Check" size={14} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Upload"
              iconPosition="left"
              onClick={handleImport}
            >
              Import
            </Button>

            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
              disabled={problemCount === 0}
            >
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              iconName="RefreshCw"
              onClick={() => window.location?.reload()}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold text-primary">{problemCount}</div>
          <div className="text-xs text-text-secondary">Active Diagnoses</div>
        </div>

        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold text-success">
            {problemCount > 0 ? Math.round((problemCount * 0.85)) : 0}
          </div>
          <div className="text-xs text-text-secondary">FHIR Validated</div>
        </div>

        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold text-accent">
            {problemCount > 0 ? Math.round((problemCount * 0.92)) : 0}
          </div>
          <div className="text-xs text-text-secondary">ICD-11 Mapped</div>
        </div>

        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-lg font-bold text-warning">
            {problemCount > 0 ? '98%' : '0%'}
          </div>
          <div className="text-xs text-text-secondary">Avg. Confidence</div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium text-text-primary">Recent Activity</h5>
          <button className="text-xs text-primary hover:underline">View All</button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-text-secondary">
            <Icon name="Plus" size={12} className="text-success" />
            <span>Added Vata Dosha Imbalance - 2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-text-secondary">
            <Icon name="FileText" size={12} className="text-primary" />
            <span>Generated FHIR Bundle - 5 minutes ago</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-text-secondary">
            <Icon name="Save" size={12} className="text-accent" />
            <span>Saved to patient record - 8 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;