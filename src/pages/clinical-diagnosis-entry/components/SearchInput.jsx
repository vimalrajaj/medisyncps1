import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import { resolveApiUrl } from '../../../config/api';

const SearchInput = ({ onSearch, onSelect, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Real-time search using backend API
  const searchTerminologies = async (query) => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await fetch(
        resolveApiUrl(`/api/v1/terminology/search?query=${encodeURIComponent(query)}&system=ALL&limit=10`)
      );
      
      if (!response.ok) {
        console.error('Search API failed:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      // Transform backend response to frontend format
      return (data.results || []).map((result, index) => ({
        id: result.code || `${result.system}_${Date.now()}_${index}`,
        code: result.code,
        display: result.display,
        system: result.system,
        confidence: Math.round((result.confidence || 0.8) * 100),
        description: result.definition || result.display,
        icd11: result.icd11Mapping ? {
          code: result.icd11Mapping.code,
          display: result.icd11Mapping.display,
          confidence: Math.round((result.icd11Mapping.confidence || 0.8) * 100)
        } : null,
        biomedical: result.biomedicalMapping ? {
          code: result.biomedicalMapping.code,
          display: result.biomedicalMapping.display,
          description: result.biomedicalMapping.description,
          confidence: Math.round((result.biomedicalMapping.confidence || 0.8) * 100)
        } : null
      }));
    } catch (error) {
      console.error('Error searching terminologies:', error);
      return [];
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm?.length >= 2) {
        const results = await searchTerminologies(searchTerm);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    performSearch();
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const value = e?.target?.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions?.length === 0) return;

    switch (e?.key) {
      case 'ArrowDown':
        e?.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions?.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e?.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions?.length - 1
        );
        break;
      case 'Enter':
        e?.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions?.[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (terminology) => {
    setSearchTerm(terminology?.display);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect(terminology);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 80) return 'text-warning';
    return 'text-error';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 90) return 'bg-success/10';
    if (confidence >= 80) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search NAMASTE codes, symptoms, or conditions..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pr-12"
          label="Diagnosis Search"
          description="Type at least 2 characters to see suggestions"
        />
        <div className="absolute right-3 top-9 flex items-center">
          {isLoading ? (
            <Icon name="Loader2" size={20} className="animate-spin text-text-secondary" />
          ) : (
            <Icon name="Search" size={20} className="text-text-secondary" />
          )}
        </div>
      </div>
      {showSuggestions && suggestions?.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg clinical-shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {suggestions?.map((suggestion, index) => (
              <div
                key={suggestion?.id}
                onClick={() => handleSelect(suggestion)}
                className={`p-3 rounded-lg cursor-pointer clinical-transition ${
                  index === selectedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{suggestion?.display}</span>
                      <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                        {suggestion?.code}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mb-2">{suggestion?.description}</p>
                    
                    <div className="space-y-1">
                      {suggestion?.icd11 && (
                        <div className="flex items-center space-x-2 text-xs">
                          <Icon name="ArrowRight" size={12} />
                          <span>TM2: {suggestion?.icd11?.code} - {suggestion?.icd11?.display}</span>
                        </div>
                      )}
                      {suggestion?.biomedical && (
                        <div className="flex items-center space-x-2 text-xs">
                          <Icon name="ArrowRight" size={12} />
                          <span>Biomedical: {suggestion?.biomedical?.code} - {suggestion?.biomedical?.display}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1 ml-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceBg(suggestion?.confidence)} ${getConfidenceColor(suggestion?.confidence)}`}>
                      {suggestion?.confidence}%
                    </div>
                    {suggestion?.icd11 && (
                      <div className={`px-2 py-1 rounded text-xs ${getConfidenceBg(suggestion?.icd11?.confidence)} ${getConfidenceColor(suggestion?.icd11?.confidence)}`}>
                        TM2: {suggestion?.icd11?.confidence}%
                      </div>
                    )}
                    {suggestion?.biomedical && (
                      <div className={`px-2 py-1 rounded text-xs ${getConfidenceBg(suggestion?.biomedical?.confidence)} ${getConfidenceColor(suggestion?.biomedical?.confidence)}`}>
                        Bio: {suggestion?.biomedical?.confidence}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSuggestions && suggestions?.length === 0 && searchTerm?.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg clinical-shadow-lg z-50">
          <div className="p-4 text-center text-text-secondary">
            <Icon name="Search" size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No matching terminologies found</p>
            <p className="text-xs mt-1">Try different keywords or check spelling</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;