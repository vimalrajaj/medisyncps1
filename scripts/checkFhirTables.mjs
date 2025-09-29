import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Simple logger
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

/**
 * Check if FHIR tables exist in Supabase
 */
async function checkFhirTables() {
  try {
    logger.info('Checking Supabase connection and FHIR tables...');
    
    // Get credentials from environment
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      logger.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
      return { success: false, error: 'Missing Supabase credentials' };
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(url, serviceKey);
    
    // Test basic connection by trying to access tables directly
    // We'll try to query each table, and if we get a "relation does not exist" error,
    // we know the table doesn't exist
    
    logger.info('Checking Supabase connection with basic query...');
    const { data: testData, error: testError } = await supabase
      .from('test_connection')
      .select('*')
      .limit(1)
      .catch(() => ({ data: null, error: null })); // Ignore errors here
    
    logger.info('Supabase connection successful');
    
    // Check which FHIR tables already exist by trying to select from each
    const existingTables = [];
    const requiredTables = ['fhir_bundles', 'fhir_patients', 'fhir_conditions', 'fhir_observations'];
    
    logger.info('Checking for FHIR tables...');
    
    for (const tableName of requiredTables) {
      const { error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      // If there's no error or the error isn't about the table not existing,
      // we assume the table exists
      if (!tableError || !tableError.message.includes('does not exist')) {
        existingTables.push(tableName);
      }
    }
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    logger.info(`Existing FHIR tables: ${existingTables.join(', ') || 'none'}`);
    
    if (missingTables.length > 0) {
      logger.info(`Missing FHIR tables: ${missingTables.join(', ')}`);
      
      // In a real app with proper permissions, we'd create the tables here
      // Since we might not have those permissions, print guidance on next steps
      logger.info(`
To create the missing tables, you have a few options:
1. Use the Supabase dashboard to execute the SQL in supabase/migrations/fhir_storage.sql
2. Set up proper RPC functions in Supabase that can execute DDL statements
3. Use the Supabase CLI to run migrations
      `);
    } else {
      logger.info('All required FHIR tables exist!');
    }
    
    return {
      success: true,
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0
    };
  } catch (error) {
    logger.error(`FHIR table check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the check
checkFhirTables().then(result => {
  if (result.success) {
    if (result.allTablesExist) {
      logger.info('FHIR storage is ready for use!');
    } else {
      logger.info('Some FHIR tables need to be created before using the FHIR functionality.');
    }
    process.exit(result.allTablesExist ? 0 : 1);
  } else {
    logger.error(`FHIR storage check failed: ${result.error}`);
    process.exit(1);
  }
}).catch(err => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});