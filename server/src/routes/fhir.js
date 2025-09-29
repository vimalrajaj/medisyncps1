import express from 'express';
import { FhirResourceBuilder } from '../utils/fhirBuilder.js';
import { validateRequest, lookupSchema, translateSchema, expandSchema, bundleSchema } from '../utils/validation.js';
import { supabase } from '../config/database.js';
import { whoIcdService } from '../services/whoIcdService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// FHIR CodeSystem endpoints
router.get('/CodeSystem', async (req, res) => {
  try {
    const { data: mappings, error } = await supabase
      .from('terminology_mappings')
      .select('*')
      .eq('status', 'approved');

    if (error) throw error;

    // Create NAMASTE CodeSystem
    const namasteSystem = FhirResourceBuilder.createCodeSystem(
      'namaste-codes',
      'http://terminology.ayush.gov.in/CodeSystem/namaste',
      'NAMASTE_Codes',
      'NAMASTE - National AYUSH Morbidity & Standardized Terminologies Electronic',
      'Standardized terminology codes for Ayurveda, Siddha, and Unani disorders as defined by the Ministry of AYUSH',
      mappings.map(mapping => ({
        code: mapping.ayush_code,
        display: mapping.ayush_term,
        definition: mapping.notes || mapping.ayush_term
      }))
    );

    const bundle = FhirResourceBuilder.createBundle('searchset', [
      {
        fullUrl: `${process.env.FHIR_BASE_URL}/CodeSystem/namaste-codes`,
        resource: namasteSystem,
        search: { mode: 'match' }
      }
    ]);

    res.json(bundle);
  } catch (error) {
    logger.error('Failed to retrieve CodeSystems:', error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Failed to retrieve CodeSystems')
    );
  }
});

router.get('/CodeSystem/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'namaste-codes') {
      const { data: mappings, error } = await supabase
        .from('terminology_mappings')
        .select('*')
        .eq('status', 'approved');

      if (error) throw error;

      const codeSystem = FhirResourceBuilder.createCodeSystem(
        'namaste-codes',
        'http://terminology.ayush.gov.in/CodeSystem/namaste',
        'NAMASTE_Codes',
        'NAMASTE - National AYUSH Morbidity & Standardized Terminologies Electronic',
        'Standardized terminology codes for Ayurveda, Siddha, and Unani disorders as defined by the Ministry of AYUSH',
        mappings.map(mapping => ({
          code: mapping.ayush_code,
          display: mapping.ayush_term,
          definition: mapping.notes || mapping.ayush_term
        }))
      );

      res.json(codeSystem);
    } else {
      res.status(404).json(
        FhirResourceBuilder.createOperationOutcome('error', 'not-found', `CodeSystem ${id} not found`)
      );
    }
  } catch (error) {
    logger.error(`Failed to retrieve CodeSystem ${req.params.id}:`, error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Failed to retrieve CodeSystem')
    );
  }
});

// FHIR ConceptMap endpoints
router.get('/ConceptMap', async (req, res) => {
  try {
    const { data: mappings, error } = await supabase
      .from('terminology_mappings')
      .select('*')
      .eq('status', 'approved')
      .not('icd11_code', 'is', null);

    if (error) throw error;

    const conceptMap = FhirResourceBuilder.createConceptMap(
      'namaste-to-icd11',
      'http://terminology.ayush.gov.in/ConceptMap/namaste-to-icd11',
      'NAMASTE_to_ICD11_Map',
      'NAMASTE to ICD-11 Concept Mapping',
      'http://terminology.ayush.gov.in/CodeSystem/namaste',
      'http://id.who.int/icd/release/11/mms',
      [{
        source: 'http://terminology.ayush.gov.in/CodeSystem/namaste',
        sourceVersion: '1.0.0',
        target: 'http://id.who.int/icd/release/11/mms',
        targetVersion: '2019-04',
        elements: mappings.map(mapping => ({
          code: mapping.ayush_code,
          display: mapping.ayush_term,
          targets: [{
            code: mapping.icd11_code,
            display: mapping.icd11_term,
            equivalence: mapping.mapping_confidence >= 0.9 ? 'equivalent' : 
                        mapping.mapping_confidence >= 0.7 ? 'wider' : 'inexact',
            comment: mapping.notes
          }]
        }))
      }]
    );

    const bundle = FhirResourceBuilder.createBundle('searchset', [
      {
        fullUrl: `${process.env.FHIR_BASE_URL}/ConceptMap/namaste-to-icd11`,
        resource: conceptMap,
        search: { mode: 'match' }
      }
    ]);

    res.json(bundle);
  } catch (error) {
    logger.error('Failed to retrieve ConceptMaps:', error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Failed to retrieve ConceptMaps')
    );
  }
});

router.get('/ConceptMap/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'namaste-to-icd11') {
      const { data: mappings, error } = await supabase
        .from('terminology_mappings')
        .select('*')
        .eq('status', 'approved')
        .not('icd11_code', 'is', null);

      if (error) throw error;

      const conceptMap = FhirResourceBuilder.createConceptMap(
        'namaste-to-icd11',
        'http://terminology.ayush.gov.in/ConceptMap/namaste-to-icd11',
        'NAMASTE_to_ICD11_Map',
        'NAMASTE to ICD-11 Concept Mapping',
        'http://terminology.ayush.gov.in/CodeSystem/namaste',
        'http://id.who.int/icd/release/11/mms',
        [{
          source: 'http://terminology.ayush.gov.in/CodeSystem/namaste',
          sourceVersion: '1.0.0',
          target: 'http://id.who.int/icd/release/11/mms',
          targetVersion: '2019-04',
          elements: mappings.map(mapping => ({
            code: mapping.ayush_code,
            display: mapping.ayush_term,
            targets: [{
              code: mapping.icd11_code,
              display: mapping.icd11_term,
              equivalence: mapping.mapping_confidence >= 0.9 ? 'equivalent' : 
                          mapping.mapping_confidence >= 0.7 ? 'wider' : 'inexact',
              comment: mapping.notes
            }]
          }))
        }]
      );

      res.json(conceptMap);
    } else {
      res.status(404).json(
        FhirResourceBuilder.createOperationOutcome('error', 'not-found', `ConceptMap ${id} not found`)
      );
    }
  } catch (error) {
    logger.error(`Failed to retrieve ConceptMap ${req.params.id}:`, error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Failed to retrieve ConceptMap')
    );
  }
});

// FHIR $lookup operation
router.get('/CodeSystem/$lookup', validateRequest(lookupSchema), async (req, res) => {
  try {
    const { system, code, displayLanguage } = req.validatedData;
    
    let result = null;
    
    if (system === 'http://terminology.ayush.gov.in/CodeSystem/namaste') {
      const { data: mapping, error } = await supabase
        .from('terminology_mappings')
        .select('*')
        .eq('ayush_code', code)
        .eq('status', 'approved')
        .single();

      if (!error && mapping) {
        result = {
          name: 'lookup',
          valueString: 'Found',
          part: [
            { name: 'display', valueString: mapping.ayush_term },
            { name: 'definition', valueString: mapping.notes || mapping.ayush_term },
            { name: 'system', valueString: system }
          ]
        };
      }
    }

    if (result) {
      res.json(FhirResourceBuilder.createParameters([result]));
    } else {
      res.status(404).json(
        FhirResourceBuilder.createOperationOutcome('error', 'not-found', `Code ${code} not found in system ${system}`)
      );
    }
  } catch (error) {
    logger.error('$lookup operation failed:', error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Lookup operation failed')
    );
  }
});

// FHIR $translate operation
router.post('/ConceptMap/$translate', validateRequest(translateSchema), async (req, res) => {
  try {
    const { code, system, targetsystem, reverse } = req.validatedData;
    
    let query = supabase
      .from('terminology_mappings')
      .select('*')
      .eq('status', 'approved');

    if (!reverse) {
      // NAMASTE to ICD-11
      query = query.eq('ayush_code', code);
    } else {
      // ICD-11 to NAMASTE
      query = query.eq('icd11_code', code);
    }

    const { data: mappings, error } = await query;
    
    if (error) throw error;

    const matches = mappings.map(mapping => ({
      equivalence: mapping.mapping_confidence >= 0.9 ? 'equivalent' : 
                  mapping.mapping_confidence >= 0.7 ? 'wider' : 'inexact',
      concept: {
        system: reverse ? 'http://terminology.ayush.gov.in/CodeSystem/namaste' : 'http://id.who.int/icd/release/11/mms',
        code: reverse ? mapping.ayush_code : mapping.icd11_code,
        display: reverse ? mapping.ayush_term : mapping.icd11_term
      }
    }));

    const result = {
      name: 'translate',
      valueBoolean: matches.length > 0,
      part: [
        { name: 'result', valueBoolean: matches.length > 0 },
        ...matches.map(match => ({
          name: 'match',
          part: [
            { name: 'equivalence', valueCode: match.equivalence },
            { 
              name: 'concept', 
              valueCoding: {
                system: match.concept.system,
                code: match.concept.code,
                display: match.concept.display
              }
            }
          ]
        }))
      ]
    };

    res.json(FhirResourceBuilder.createParameters([result]));
  } catch (error) {
    logger.error('$translate operation failed:', error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Translate operation failed')
    );
  }
});

// FHIR Bundle processing endpoint
router.post('/Bundle', validateRequest(bundleSchema), async (req, res) => {
  try {
    const bundle = req.validatedData;
    const responseEntries = [];

    for (const entry of bundle.entry) {
      try {
        if (entry.request) {
          const { method, url } = entry.request;
          let response = { status: '200 OK' };

          // Process based on HTTP method and resource type
          if (method === 'POST' && entry.resource) {
            // Create operation
            if (entry.resource.resourceType === 'Condition' || 
                entry.resource.resourceType === 'DiagnosticReport') {
              
              // Extract dual coding from the resource
              const coding = entry.resource.code?.coding || [];
              const namasteCoding = coding.find(c => c.system === 'http://terminology.ayush.gov.in/CodeSystem/namaste');
              const icd11Coding = coding.find(c => c.system === 'http://id.who.int/icd/release/11/mms');

              if (namasteCoding && icd11Coding) {
                // Store the dual-coded entry
                const { error } = await supabase
                  .from('dual_coded_entries')
                  .insert({
                    resource_type: entry.resource.resourceType,
                    resource_id: entry.resource.id || `generated-${Date.now()}`,
                    namaste_code: namasteCoding.code,
                    namaste_display: namasteCoding.display,
                    icd11_code: icd11Coding.code,
                    icd11_display: icd11Coding.display,
                    patient_id: entry.resource.subject?.reference,
                    encounter_id: entry.resource.encounter?.reference,
                    raw_resource: entry.resource,
                    created_at: new Date().toISOString()
                  });

                if (error) {
                  response = { status: '400 Bad Request', outcome: error };
                } else {
                  response = { status: '201 Created' };
                }
              } else {
                response = { 
                  status: '400 Bad Request', 
                  outcome: 'Dual coding required (NAMASTE + ICD-11)' 
                };
              }
            }
          }

          responseEntries.push({
            response,
            ...(entry.fullUrl && { fullUrl: entry.fullUrl })
          });
        }
      } catch (entryError) {
        logger.error('Bundle entry processing failed:', entryError);
        responseEntries.push({
          response: { 
            status: '500 Internal Server Error',
            outcome: entryError.message
          }
        });
      }
    }

    const responseBundle = FhirResourceBuilder.createBundle('transaction-response', responseEntries);
    res.json(responseBundle);
  } catch (error) {
    logger.error('Bundle processing failed:', error);
    res.status(500).json(
      FhirResourceBuilder.createOperationOutcome('error', 'exception', 'Bundle processing failed')
    );
  }
});

export default router;