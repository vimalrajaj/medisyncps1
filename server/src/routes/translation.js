import express from 'express';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { realTimeMappingService } from '../services/realTimeMappingService.js';
import { FhirResourceBuilder } from '../utils/fhirBuilder.js';

const router = express.Router();

/**
 * Translate a code between terminology systems
 * 
 * POST /api/v1/terminology/translate
 * 
 * Request body:
 * {
 *   "source": "namaste", // or "icd11"
 *   "target": "icd11",   // or "namaste"
 *   "code": "A01.23",    // The code to translate
 *   "includeMetadata": true,  // Optional: include mapping metadata
 *   "format": "fhir"     // Optional: return as FHIR Parameters resource
 * }
 */
router.post('/translate', async (req, res) => {
  try {
    const { source, target, code, includeMetadata = false, format = 'standard' } = req.body;
    
    // Validate required parameters
    if (!source || !code || !target) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'source, code, and target are mandatory' 
      });
    }
    
    // Validate source and target values
    const validSystems = ['namaste', 'icd11'];
    if (!validSystems.includes(source.toLowerCase()) || !validSystems.includes(target.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid system parameter',
        details: 'source and target must be one of: namaste, icd11' 
      });
    }
    
    // Define column names based on direction
    let sourceCode, sourceDisplay, targetCode, targetDisplay;
    if (source.toLowerCase() === 'namaste' && target.toLowerCase() === 'icd11') {
      sourceCode = 'ayush_code';
      sourceDisplay = 'ayush_term';
      targetCode = 'icd11_code';
      targetDisplay = 'icd11_term';
    } else if (source.toLowerCase() === 'icd11' && target.toLowerCase() === 'namaste') {
      sourceCode = 'icd11_code';
      sourceDisplay = 'icd11_term';
      targetCode = 'ayush_code';
      targetDisplay = 'ayush_term';
    } else {
      return res.status(400).json({ 
        error: 'Invalid translation direction',
        details: 'Translation must be between namaste and icd11' 
      });
    }
    
    // Query for exact matches in database
    let query = supabase
      .from('terminology_mappings')
      .select('*')
      .eq(sourceCode, code);
    
    const { data: mappings, error } = await query;
    
    if (error) {
      logger.error('Translation service database error:', error);
      return res.status(500).json({ 
        error: 'Translation service error',
        details: error.message 
      });
    }
    
    // If no mappings found, try real-time mapping service
    if (!mappings || mappings.length === 0) {
      if (source.toLowerCase() === 'namaste') {
        try {
          // Fetch the source term first to use in mapping
          const { data: sourceTerm } = await supabase
            .from('namaste_codes')
            .select('namaste_display')
            .eq('namaste_code', code)
            .single();
            
          if (sourceTerm) {
            const mapping = await realTimeMappingService.mapNamasteToIcd11(
              code,
              sourceTerm.namaste_display
            );
            
            if (mapping) {
              // Return the real-time mapping result
              const result = {
                source: {
                  system: 'namaste',
                  code: code,
                  display: sourceTerm.namaste_display
                },
                target: {
                  system: 'icd11',
                  code: mapping.code,
                  display: mapping.display
                },
                equivalence: 'inexact',
                mappingMethod: 'machine-learning',
                confidence: mapping.confidence,
                realTimeMapping: true
              };
              
              // Return in requested format
              if (format.toLowerCase() === 'fhir') {
                return res.json(createFhirTranslationResponse(result));
              }
              
              return res.json({ translation: result });
            }
          }
        } catch (err) {
          logger.error('Real-time mapping error:', err);
          // Continue to return no translation found
        }
      }
      
      // No mapping found
      if (format.toLowerCase() === 'fhir') {
        return res.json(createFhirTranslationResponse(null));
      }
      
      return res.status(404).json({ 
        error: 'No translation found',
        details: `No mapping found for ${source} code ${code} to ${target}`
      });
    }
    
    // Process mappings
    const translations = mappings.map(mapping => {
      const result = {
        source: {
          system: source.toLowerCase(),
          code: mapping[sourceCode],
          display: mapping[sourceDisplay]
        },
        target: {
          system: target.toLowerCase(),
          code: mapping[targetCode],
          display: mapping[targetDisplay]
        },
        equivalence: mapping.mapping_confidence >= 0.9 ? 'equivalent' : 
                    mapping.mapping_confidence >= 0.7 ? 'wider' : 'inexact'
      };
      
      // Add metadata if requested
      if (includeMetadata) {
        result.metadata = {
          confidence: mapping.mapping_confidence,
          status: mapping.status,
          lastUpdated: mapping.updated_at,
          notes: mapping.notes
        };
      }
      
      return result;
    });
    
    // Return in requested format
    if (format.toLowerCase() === 'fhir') {
      return res.json(createFhirTranslationResponse(translations[0]));
    }
    
    return res.json({ translations });
  } catch (err) {
    logger.error('Translation service error:', err);
    res.status(500).json({ 
      error: 'Translation service error',
      details: err.message 
    });
  }
});

/**
 * Create a FHIR Parameters resource for translation response
 */
function createFhirTranslationResponse(translation) {
  if (!translation) {
    return FhirResourceBuilder.createOperationOutcome(
      'information',
      'not-found',
      'No translation found for the provided code'
    );
  }
  
  return {
    resourceType: 'Parameters',
    id: 'translate-response-' + Date.now(),
    parameter: [
      {
        name: 'result',
        valueBoolean: true
      },
      {
        name: 'match',
        part: [
          {
            name: 'equivalence',
            valueCode: translation.equivalence
          },
          {
            name: 'concept',
            valueCoding: {
              system: translation.target.system === 'namaste' 
                ? 'http://terminology.ayush.gov.in/CodeSystem/namaste'
                : 'http://id.who.int/icd/release/11/mms',
              code: translation.target.code,
              display: translation.target.display
            }
          }
        ]
      }
    ]
  };
}

export default router;