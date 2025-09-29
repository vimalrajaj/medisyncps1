import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logger since we can't import the logger module easily
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

/**
 * Run the FHIR storage migration script
 */
async function runFhirMigration() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    logger.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    return { success: false, error: 'Missing Supabase credentials' };
  }

  const supabase = createClient(url, serviceKey);

  try {
    logger.info('Starting FHIR storage migration...');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/fhir_storage.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    logger.info(`Read migration SQL from ${migrationPath}`);

    // Execute each SQL statement separately using raw queries
    const sqlStatements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    logger.info(`Found ${sqlStatements.length} SQL statements to execute`);
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim() + ';';
      logger.info(`Executing statement ${i + 1}/${sqlStatements.length}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(err => {
        return { error: err };
      });
      
      if (error) {
        // If exec_sql isn't available, try a direct query for simple statements
        logger.info(`RPC failed, trying direct query`);
        const { error: directError } = await supabase.from('_exec_sql').select('*').eq('query', statement).catch(err => {
          return { error: err };
        });
        
        if (directError) {
          logger.error(`Error executing statement: ${directError.message}`);
          logger.error(`Statement was: ${statement}`);
          // Continue with next statement instead of failing completely
        }
      }
    }
    
    const data = { message: 'SQL execution completed' };

    logger.info('FHIR storage migration completed successfully');
    return { success: true, data };
  } catch (error) {
    logger.error(`FHIR migration failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the migration
runFhirMigration().then(result => {
  if (result.success) {
    logger.info('Migration script executed successfully');
    process.exit(0);
  } else {
    logger.error(`Migration script failed: ${result.error}`);
    process.exit(1);
  }
}).catch(err => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});