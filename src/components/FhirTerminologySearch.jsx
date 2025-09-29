/**
 * FHIR Terminology Search Component
 * Auto-complete search for NAMASTE codes with ICD-11 translation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFhirTerminology } from '../services/fhirService';

const FhirTerminologySearch = ({ 
  onCodeSelect, 
  placeholder = "Search NAMASTE codes...", 
  className = "",
  showTranslation = true,
  maxResults = 20
}) => {
  const { abhaToken, isAbhaAuthenticated } = useAuth();
  const fhirService = useFhirTerminology(abhaToken);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2 || !fhirService) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const searchResults = await fhirService.searchCodes(term, maxResults);
        setResults(searchResults.results || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
        
        // Auto-translate first few results if translation is enabled
        if (showTranslation && searchResults.results?.length > 0) {
          const translationPromises = searchResults.results.slice(0, 5).map(async (result) => {
            try {
              const translation = await fhirService.translateCode(result.system, result.code);
              return { code: result.code, translation };
            } catch (err) {
              console.warn(`Translation failed for ${result.code}:`, err);
              return { code: result.code, translation: null };
            }
          });
          
          const translationResults = await Promise.all(translationPromises);
          const translationMap = {};
          translationResults.forEach(({ code, translation }) => {
            translationMap[code] = translation;
          });
          setTranslations(translationMap);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [fhirService, maxResults, showTranslation]
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setResults([]);
      setTranslations({});
      setShowDropdown(false);
    }
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectCode(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectCode = (code) => {
    setSearchTerm(code.display);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    if (onCodeSelect) {
      const codeData = {
        ...code,
        translation: translations[code.code] || null
      };
      onCodeSelect(codeData);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  if (!isAbhaAuthenticated) {
    return (
      <div className={`${className} p-4 bg-yellow-50 border border-yellow-200 rounded-lg`}>
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span>ABHA authentication required for FHIR terminology search</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!fhirService}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Found {results.length} results</span>
              <span className="text-xs text-gray-500">Use ↑↓ to navigate, Enter to select</span>
            </div>
          </div>
          {results.map((result, index) => (
            <div
              key={`${result.system}-${result.code}`}
              className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 ${
                index === selectedIndex 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50 hover:border-l-4 hover:border-l-gray-300'
              }`}
              onClick={() => handleSelectCode(result)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Code and Display */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold font-mono rounded-full">
                      {result.code}
                    </span>
                    {result.category && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {result.category}
                      </span>
                    )}
                    {result.ayushSystem && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {result.ayushSystem}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 truncate">
                    {result.display}
                  </h4>
                  
                  {result.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  
                  {/* Translation Results */}
                  {showTranslation && translations[result.code] && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">ICD-11 TM2 Translation</span>
                      </div>
                      
                      {translations[result.code].success ? (
                        <div className="space-y-1">
                          {translations[result.code].translations.map((translation, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs font-mono text-gray-600">
                                {translation.targetCode}
                              </span>
                              <span className="text-xs text-gray-700">
                                {translation.targetDisplay}
                              </span>
                              {translation.confidence && (
                                <span className="text-xs text-blue-600">
                                  ({Math.round(translation.confidence * 100)}%)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Info className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">No direct translation available</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {result.confidence && (
                  <div className="ml-2 text-right">
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="text-sm font-medium text-blue-600">
                      {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && results.length === 0 && searchTerm && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            <Info className="h-6 w-6 mx-auto mb-2" />
            <p>No codes found for "{searchTerm}"</p>
            <p className="text-xs mt-1">Try a different search term or check spelling</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default FhirTerminologySearch;