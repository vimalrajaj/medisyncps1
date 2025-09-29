import express from 'express';
import { validateRequest, searchSchema } from '../utils/validation.js';
import { supabase } from '../config/database.js';
import { whoIcdService } from '../services/whoIcdService.js';
import { realTimeMappingService } from '../services/realTimeMappingService.js';
import { csvMappingService } from '../services/csvMappingService.js';
import { logger } from '../utils/logger.js';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Search terminology across all systems
router.get('/search', validateRequest(searchSchema), async (req, res) => {
  try {
    const { query, system, limit, language, exact } = req.validatedData;
    const results = [];

    // Search NAMASTE codes with real-time mapping
    if (system === 'NAMASTE' || system === 'ALL') {
      // Search in unmapped NAMASTE codes
      const { data: namasteResults, error } = await supabase
        .from('namaste_codes')
        .select('*')
        .or(exact 
          ? `namaste_code.eq.${query},namaste_display.eq.${query}`
          : `namaste_code.ilike.%${query}%,namaste_display.ilike.%${query}%,namaste_description.ilike.%${query}%`
        )
        .limit(limit);

      if (!error && namasteResults) {
        // For each NAMASTE result, create or get mapping in real-time
        const mappedResults = await Promise.all(
          namasteResults.map(async (namasteItem) => {
            try {
              // Real-time mapping happens here!
              const icd11Mapping = await realTimeMappingService.mapNamasteToIcd11(
                namasteItem.namaste_code,
                namasteItem.namaste_display
              );

              // Get biomedical mapping if TM2 mapping exists
              let biomedicalMapping = null;
              if (icd11Mapping?.code) {
                biomedicalMapping = await csvMappingService.getBiomedicalMapping(icd11Mapping.code);
              }

              return {
                system: 'NAMASTE',
                code: namasteItem.namaste_code,
                display: namasteItem.namaste_display,
                definition: namasteItem.namaste_description,
                category: namasteItem.category,
                confidence: icd11Mapping?.confidence || 0.8,
                icd11Mapping: icd11Mapping ? {
                  code: icd11Mapping.code,
                  display: icd11Mapping.display,
                  confidence: icd11Mapping.confidence,
                  source: icd11Mapping.source,
                  mappedAt: icd11Mapping.mappedAt
                } : null,
                biomedicalMapping
              };
            } catch (mappingError) {
              logger.warn(`Failed to map ${namasteItem.namaste_code}:`, mappingError.message);
              return {
                system: 'NAMASTE',
                code: namasteItem.namaste_code,
                display: namasteItem.namaste_display,  
                definition: namasteItem.namaste_description,
                category: namasteItem.category,
                confidence: 0.8,
                icd11Mapping: null,
                biomedicalMapping: null
              };
            }
          })
        );

        results.push(...mappedResults);
      }
    }

    // Search CSV mappings for TM2 and biomedical codes
    if (system === 'TM2' || system === 'BIOMEDICAL' || system === 'ALL') {
      try {
        const csvResults = await csvMappingService.searchMappings(query);
        results.push(...csvResults.slice(0, limit));
      } catch (csvError) {
        logger.warn('CSV mapping search failed:', csvError.message);
      }
    }

    // Search WHO ICD-11 entities
    if (system === 'ICD11' || system === 'TM2' || system === 'ALL') {
      try {
        const whoResults = await whoIcdService.searchEntities(query, true, true, true);
        
        if (whoResults.destinationEntities) {
          const filteredResults = whoResults.destinationEntities
            .filter(entity => {
              if (system === 'TM2') {
                return entity.theCode && entity.theCode.startsWith('T');
              }
              return true;
            })
            .slice(0, limit);

          results.push(...filteredResults.map(entity => ({
            system: entity.theCode && entity.theCode.startsWith('T') ? 'TM2' : 'ICD11',
            code: entity.theCode,
            display: entity.title,
            definition: entity.definition || entity.title,
            url: entity.id
          })));
        }
      } catch (whoError) {
        logger.warn('WHO ICD search failed, continuing with local results:', whoError.message);
      }
    }

    // Sort by relevance (exact matches first, then by confidence)
    results.sort((a, b) => {
      const aExact = a.display.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bExact = b.display.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      const aConf = a.confidence || 0;
      const bConf = b.confidence || 0;
      return bConf - aConf;
    });

    res.json({
      query,
      system,
      total: results.length,
      results: results.slice(0, limit)
    });
  } catch (error) {
    logger.error('Terminology search failed:', error);
    res.status(500).json({
      error: 'Search operation failed',
      message: error.message
    });
  }
});

// Get terminology mappings
router.get('/mappings', async (req, res) => {
  try {
    const { status = 'approved', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('terminology_mappings')
      .select('*, created_by:user_profiles!created_by(full_name, organization)', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: mappings, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      mappings: mappings || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve mappings:', error);
    res.status(500).json({
      error: 'Failed to retrieve mappings',
      message: error.message
    });
  }
});

// Validate terminology mapping
router.post('/validate', async (req, res) => {
  try {
    const { namasteCode, icd11Code } = req.body;

    if (!namasteCode || !icd11Code) {
      return res.status(400).json({
        error: 'Both namasteCode and icd11Code are required'
      });
    }

    // Check if mapping exists
    const { data: existingMapping, error } = await supabase
      .from('terminology_mappings')
      .select('*')
      .eq('ayush_code', namasteCode)
      .eq('icd11_code', icd11Code)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Validate NAMASTE code format
    const namasteValid = /^NMST-[ASUH]\d{3}$/.test(namasteCode);
    
    // Try to validate ICD-11 code with WHO API
    let icd11Valid = false;
    try {
      const entity = await whoIcdService.getEntity(icd11Code);
      icd11Valid = !!entity;
    } catch {
      // If WHO API fails, check basic format
      icd11Valid = /^[A-Z0-9]{2,10}(\.[0-9]{1,2})?$/.test(icd11Code);
    }

    res.json({
      namasteCode,
      icd11Code,
      validation: {
        namasteValid,
        icd11Valid,
        mappingExists: !!existingMapping,
        overallValid: namasteValid && icd11Valid
      },
      existingMapping: existingMapping || null
    });
  } catch (error) {
    logger.error('Validation failed:', error);
    res.status(500).json({
      error: 'Validation operation failed',
      message: error.message
    });
  }
});

// Upload terminology data
router.post('/upload', async (req, res) => {
  try {
    const { csvData, fileName } = req.body;

    if (!csvData) {
      return res.status(400).json({
        error: 'CSV data is required'
      });
    }

    // Parse CSV data
    const results = [];
    const errors = [];
    let lineNumber = 0;

    // Create a temporary file to parse CSV
    const tempFile = path.join(process.cwd(), 'temp_upload.csv');
    fs.writeFileSync(tempFile, csvData);

    return new Promise((resolve, reject) => {
      fs.createReadStream(tempFile)
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Expected CSV format: namaste_code,namaste_display,namaste_description,ayush_system,icd11_tm2_code,icd11_tm2_display,icd11_tm2_description,icd11_biomed_code,icd11_biomed_display,icd11_biomed_description,equivalence,confidence,mapping_method
            const mapping = {
              ayush_code: row.namaste_code,
              ayush_term: row.namaste_display,
              ayush_description: row.namaste_description,
              ayush_system: row.ayush_system,
              icd11_tm2_code: row.icd11_tm2_code,
              icd11_tm2_display: row.icd11_tm2_display,
              icd11_tm2_description: row.icd11_tm2_description,
              icd11_biomed_code: row.icd11_biomed_code,
              icd11_biomed_display: row.icd11_biomed_display,
              icd11_biomed_description: row.icd11_biomed_description,
              equivalence: row.equivalence,
              confidence: parseFloat(row.confidence),
              mapping_method: row.mapping_method
            };

            // Validate required fields
            if (!mapping.ayush_code || !mapping.ayush_term) {
              errors.push({
                line: lineNumber,
                error: 'Missing required fields: namaste_code and namaste_display'
              });
              return;
            }

            results.push(mapping);
          } catch (parseError) {
            errors.push({
              line: lineNumber,
              error: parseError.message
            });
          }
        })
        .on('end', async () => {
          try {
            // Clean up temp file
            fs.unlinkSync(tempFile);

            if (results.length === 0) {
              return res.status(400).json({
                error: 'No valid mappings found in CSV',
                errors
              });
            }

            // Insert mappings into database
            const insertPromises = results.map(async (mapping) => {
              // Use TM2 code preferentially, fall back to biomed code
              const finalMapping = {
                ayush_code: mapping.ayush_code,
                ayush_term: mapping.ayush_term,
                icd11_code: mapping.icd11_tm2_code || mapping.icd11_biomed_code,
                icd11_term: mapping.icd11_tm2_display || mapping.icd11_biomed_display,
                mapping_confidence: mapping.confidence,
                status: 'pending',
                notes: `${mapping.ayush_description || ''} | TM2: ${mapping.icd11_tm2_description || 'N/A'} | Biomed: ${mapping.icd11_biomed_description || 'N/A'}`.trim()
              };

              return supabase
                .from('terminology_mappings')
                .upsert(finalMapping, {
                  onConflict: 'ayush_code'
                });
            });

            const insertResults = await Promise.allSettled(insertPromises);
            const successful = insertResults.filter(result => result.status === 'fulfilled').length;
            const failed = insertResults.filter(result => result.status === 'rejected').length;

            // Record upload in file_uploads table
            await supabase
              .from('file_uploads')
              .insert({
                filename: fileName || 'terminology_upload.csv',
                file_size: csvData.length,
                file_type: 'text/csv',
                upload_status: failed > 0 ? 'completed' : 'completed',
                processed_records: successful,
                total_records: results.length
              });

            res.json({
              message: 'Upload completed',
              summary: {
                totalRows: results.length,
                successful,
                failed,
                errors: errors.length
              },
              errors
            });

          } catch (dbError) {
            logger.error('Database insertion failed:', dbError);
            res.status(500).json({
              error: 'Failed to save mappings',
              message: dbError.message
            });
          }
        })
        .on('error', (parseError) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempFile);
          } catch {}
          
          logger.error('CSV parsing failed:', parseError);
          res.status(400).json({
            error: 'CSV parsing failed',
            message: parseError.message
          });
        });
    });

  } catch (error) {
    logger.error('Upload failed:', error);
    res.status(500).json({
      error: 'Upload operation failed',
      message: error.message
    });
  }
});

// Get real-time mapping statistics
router.get('/mapping-stats', async (req, res) => {
  try {
    const stats = await realTimeMappingService.getMappingStats();
    
    res.json({
      message: 'Real-time mapping statistics',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get mapping stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve mapping statistics',
      message: error.message
    });
  }
});

export default router;