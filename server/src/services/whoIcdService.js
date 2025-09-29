import axios from 'axios';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/database.js';

class WhoIcdService {
  constructor() {
    this.baseUrl = process.env.WHO_ICD_BASE_URL;
    this.clientId = process.env.WHO_ICD_CLIENT_ID;
    this.clientSecret = process.env.WHO_ICD_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://icdaccessmanagement.who.int/connect/token', 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'icdapi_access'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      logger.info('WHO ICD-11 access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to obtain WHO ICD-11 access token:', error.message);
      throw new Error('Unable to authenticate with WHO ICD-11 API');
    }
  }

  async searchEntities(query, useFlexisearch = true, flatResults = true, medicalCodingMode = true) {
    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams({
        q: query,
        subtreeFilterUsesFoundationDescendants: 'false',
        includeKeywordResult: 'true',
        useFlexisearch: useFlexisearch.toString(),
        flatResults: flatResults.toString(),
        highlightingEnabled: 'false',
        medicalCodingMode: medicalCodingMode.toString()
      });

      const response = await axios.get(
        `https://icd11restapi-developer-test.azurewebsites.net/icd/entity/search?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'API-Version': 'v2'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('WHO ICD-11 search failed:', error.message);
      throw new Error('Failed to search WHO ICD-11 entities');
    }
  }

  async getEntity(entityId, include = 'ancestor,descendant,diagnosticCriteria') {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `https://icd11restapi-developer-test.azurewebsites.net/icd/entity/${entityId}`,
        {
          params: { include },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'API-Version': 'v2'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get WHO ICD-11 entity ${entityId}:`, error.message);
      throw new Error('Failed to retrieve WHO ICD-11 entity');
    }
  }

  async getTM2Entities() {
    try {
      const token = await this.getAccessToken();
      // TM2 is Chapter 26 in ICD-11
      const response = await axios.get(
        'https://icd11restapi-developer-test.azurewebsites.net/icd/entity/1963852842',
        {
          params: { include: 'child' },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'API-Version': 'v2'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get WHO ICD-11 TM2 entities:', error.message);
      throw new Error('Failed to retrieve WHO ICD-11 TM2 entities');
    }
  }

  async syncTM2Data() {
    try {
      logger.info('Starting WHO ICD-11 TM2 data synchronization...');
      
      const tm2Data = await this.getTM2Entities();
      let syncedCount = 0;

      if (tm2Data.child) {
        for (const child of tm2Data.child) {
          try {
            const entityDetails = await this.getEntity(child.split('/').pop());
            
            // Store in our database
            const { error } = await supabase
              .from('who_icd_entities')
              .upsert({
                entity_id: entityDetails['@id'].split('/').pop(),
                code: entityDetails.code,
                display: entityDetails.title?.['@value'] || 'Unknown',
                definition: entityDetails.definition?.['@value'] || null,
                category: 'TM2',
                parent_id: tm2Data['@id'].split('/').pop(),
                last_synced: new Date().toISOString(),
                raw_data: entityDetails
              }, {
                onConflict: 'entity_id'
              });

            if (error) {
              logger.error('Failed to store TM2 entity:', error);
            } else {
              syncedCount++;
            }
          } catch (entityError) {
            logger.error(`Failed to process TM2 entity ${child}:`, entityError.message);
          }
        }
      }

      logger.info(`WHO ICD-11 TM2 sync completed. Synced ${syncedCount} entities.`);
      return { success: true, syncedCount };
    } catch (error) {
      logger.error('WHO ICD-11 TM2 sync failed:', error.message);
      throw error;
    }
  }

  async syncBiomedData() {
    try {
      logger.info('Starting WHO ICD-11 Biomedicine data synchronization...');
      
      // Get main chapters (excluding TM2 which is chapter 26)
      const response = await axios.get(
        'https://icd11restapi-developer-test.azurewebsites.net/icd/release/11/2019-04/mms',
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'API-Version': 'v2'
          }
        }
      );

      let syncedCount = 0;
      const chapters = response.data.child || [];

      for (const chapterUrl of chapters.slice(0, 25)) { // First 25 chapters (skip TM2)
        try {
          const chapterId = chapterUrl.split('/').pop();
          const chapterData = await this.getEntity(chapterId, 'child');
          
          // Store chapter
          await supabase
            .from('who_icd_entities')
            .upsert({
              entity_id: chapterId,
              code: chapterData.code || chapterId,
              display: chapterData.title?.['@value'] || 'Unknown Chapter',
              definition: chapterData.definition?.['@value'] || null,
              category: 'Biomedicine_Chapter',
              parent_id: null,
              last_synced: new Date().toISOString(),
              raw_data: chapterData
            }, {
              onConflict: 'entity_id'
            });

          syncedCount++;
          
          // Process a subset of children for each chapter (to avoid overwhelming the API)
          if (chapterData.child && chapterData.child.length > 0) {
            const childrenToProcess = chapterData.child.slice(0, 10); // Limit to first 10 children
            
            for (const childUrl of childrenToProcess) {
              try {
                const childId = childUrl.split('/').pop();
                const childData = await this.getEntity(childId);
                
                await supabase
                  .from('who_icd_entities')
                  .upsert({
                    entity_id: childId,
                    code: childData.code || childId,
                    display: childData.title?.['@value'] || 'Unknown',
                    definition: childData.definition?.['@value'] || null,
                    category: 'Biomedicine',
                    parent_id: chapterId,
                    last_synced: new Date().toISOString(),
                    raw_data: childData
                  }, {
                    onConflict: 'entity_id'
                  });

                syncedCount++;
              } catch (childError) {
                logger.error(`Failed to process biomedicine child ${childUrl}:`, childError.message);
              }
            }
          }
        } catch (chapterError) {
          logger.error(`Failed to process biomedicine chapter ${chapterUrl}:`, chapterError.message);
        }
      }

      logger.info(`WHO ICD-11 Biomedicine sync completed. Synced ${syncedCount} entities.`);
      return { success: true, syncedCount };
    } catch (error) {
      logger.error('WHO ICD-11 Biomedicine sync failed:', error.message);
      throw error;
    }
  }
}

export const whoIcdService = new WhoIcdService();

export const syncWhoIcdData = async () => {
  try {
    // Ensure the WHO ICD entities table exists
    const { error: tableError } = await supabase
      .from('who_icd_entities')
      .select('entity_id')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      // Table doesn't exist, create it
      logger.info('Creating WHO ICD entities table...');
      // We'll handle table creation in a separate migration
    }

    const tm2Result = await whoIcdService.syncTM2Data();
    const biomedResult = await whoIcdService.syncBiomedData();

    logger.info('WHO ICD-11 complete sync finished', {
      tm2Synced: tm2Result.syncedCount,
      biomedSynced: biomedResult.syncedCount
    });

    return {
      success: true,
      tm2Count: tm2Result.syncedCount,
      biomedCount: biomedResult.syncedCount
    };
  } catch (error) {
    logger.error('WHO ICD-11 complete sync failed:', error);
    throw error;
  }
};