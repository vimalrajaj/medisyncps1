import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { logger } from '../utils/logger.js';

class CsvMappingService {
  constructor() {
    this.mappings = new Map();
    this.loaded = false;
  }

  async loadMappings() {
    if (this.loaded) return;

    try {
      const csvPath = path.join(process.cwd(), '..', 'data', 'icd11_TM_2.csv');
      
      if (!fs.existsSync(csvPath)) {
        logger.warn('CSV mapping file not found:', csvPath);
        return;
      }

      return new Promise((resolve, reject) => {
        const mappings = new Map();
        
        fs.createReadStream(csvPath)
          .pipe(csvParser())
          .on('data', (row) => {
            // Skip empty rows or header duplicates
            if (!row.icd11_tm2_code || row.icd11_tm2_code === 'icd11_tm2_code') return;

            const key = row.icd11_tm2_code;
            mappings.set(key, {
              tm2: {
                code: row.icd11_tm2_code,
                display: row.icd11_tm2_display,
                description: row.icd11_tm2_description
              },
              biomedical: row.icd11_biomed_code ? {
                code: row.icd11_biomed_code,
                display: row.icd11_biomed_display,
                description: row.icd11_biomed_description,
                confidence: parseFloat(row.confidence) || 0.8
              } : null,
              equivalence: row.equivalence,
              confidence: parseFloat(row.confidence) || 0.8,
              mappingMethod: row.mapping_method
            });
          })
          .on('end', () => {
            this.mappings = mappings;
            this.loaded = true;
            logger.info(`Loaded ${mappings.size} CSV mappings`);
            resolve();
          })
          .on('error', (error) => {
            logger.error('Failed to load CSV mappings:', error);
            reject(error);
          });
      });
    } catch (error) {
      logger.error('CSV mapping service initialization failed:', error);
    }
  }

  async getBiomedicalMapping(tm2Code) {
    await this.loadMappings();
    
    const mapping = this.mappings.get(tm2Code);
    return mapping?.biomedical || null;
  }

  async searchMappings(query) {
    await this.loadMappings();
    
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [key, mapping] of this.mappings) {
      // Search in TM2 fields
      const tm2Match = 
        mapping.tm2.code.toLowerCase().includes(searchTerm) ||
        mapping.tm2.display.toLowerCase().includes(searchTerm) ||
        (mapping.tm2.description && mapping.tm2.description.toLowerCase().includes(searchTerm));

      // Search in biomedical fields
      const biomedMatch = mapping.biomedical && (
        mapping.biomedical.code.toLowerCase().includes(searchTerm) ||
        mapping.biomedical.display.toLowerCase().includes(searchTerm) ||
        (mapping.biomedical.description && mapping.biomedical.description.toLowerCase().includes(searchTerm))
      );

      if (tm2Match || biomedMatch) {
        results.push({
          system: 'TM2_MAPPED',
          code: mapping.tm2.code,
          display: mapping.tm2.display,
          definition: mapping.tm2.description,
          confidence: mapping.confidence,
          icd11Mapping: {
            code: mapping.tm2.code,
            display: mapping.tm2.display,
            confidence: mapping.confidence,
            source: 'csv_mapping'
          },
          biomedicalMapping: mapping.biomedical
        });
      }
    }

    return results;
  }

  async getAllMappings() {
    await this.loadMappings();
    return Array.from(this.mappings.values());
  }
}

export const csvMappingService = new CsvMappingService();