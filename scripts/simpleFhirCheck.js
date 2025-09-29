import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logger
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

/**
 * Simple check for FHIR tables
 */
async function simpleFhirCheck() {
  try {
    // Get credentials from environment
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    logger.info('Checking Supabase connection...');
    
    if (!url || !serviceKey) {
      throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    }
    
    // Create Supabase client
    const supabase = createClient(url, serviceKey);
    
    // List of tables to check
    const fhirTables = [
      'fhir_bundles',
      'fhir_patients', 
      'fhir_conditions',
      'fhir_observations'
    ];
    
    // Try to check each table
    const results = [];
    
    for (const table of fhirTables) {
      try {
        logger.info(`Checking if table exists: ${table}`);
        
        const { error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
          
        if (!error) {
          logger.info(`✓ Table ${table} exists`);
          results.push({ table, exists: true });
        } else {
          logger.info(`✗ Table ${table} doesn't exist: ${error.message}`);
          results.push({ table, exists: false });
        }
      } catch (e) {
        logger.info(`✗ Error checking table ${table}: ${e.message}`);
        results.push({ table, exists: false });
      }
    }
    
    // Summarize findings
    const existingTables = results.filter(r => r.exists).map(r => r.table);
    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    
    if (missingTables.length === 0) {
      logger.info('All FHIR tables exist! The system is ready for FHIR storage.');
    } else {
      logger.info(`Missing tables: ${missingTables.join(', ')}`);
      
      // Try to create the tables
      logger.info('Attempting to create missing tables...');
      
      try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../supabase/migrations/fhir_storage.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
        
        logger.info(`SQL file read successfully from ${sqlPath}`);
        logger.info('SQL content will be submitted to Supabase...');
        
        // Since we can't execute arbitrary SQL directly via the Supabase client,
        // we'll inform the user about the needed steps
        logger.info(`
To create these tables, you have a few options:

1. Use the Supabase dashboard's SQL Editor to run the following SQL:
   - Navigate to https://app.supabase.io/project/_/sql
   - Copy and paste the content from ${sqlPath}
   - Execute the SQL

2. Use the Supabase CLI to run migrations
   - Install Supabase CLI: npm install -g supabase
   - Login: supabase login
   - Link your project: supabase link --project-ref <your-project-ref>
   - Push migrations: supabase db push

The system will continue to function, but FHIR storage capabilities will be limited until these tables are created.
`);
      } catch (sqlError) {
        logger.error(`Error reading SQL file: ${sqlError.message}`);
      }
    }
    
    return {
      existingTables,
      missingTables,
      allTablesExist: missingTables.length === 0
    };
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return null;
  }
}

// Run the check
simpleFhirCheck().then(result => {
  if (!result) {
    process.exit(1);
  }
  
  process.exit(result.allTablesExist ? 0 : 1);
});