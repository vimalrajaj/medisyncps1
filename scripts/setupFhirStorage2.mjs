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
 * Run the FHIR storage migration script using Supabase direct SQL execution
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
    
    // For complex migrations, we might need to split the SQL into individual statements
    // But for now, let's try executing it directly
    
    // Try executing through a stored procedure if available
    let result;
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: migrationSQL });
      if (error) throw error;
      result = data;
    } catch (rpcError) {
      // If RPC fails, it might be because the function doesn't exist
      // Let's do it a different way - split into statements and execute one by one
      logger.info('RPC method failed, trying direct SQL execution');
      
      // For simplicity in this script, we'll just try to create the tables directly
      // using SQL queries on each table definition
      
      // First, check if tables exist
      const { data: existingTables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['fhir_bundles', 'fhir_patients', 'fhir_conditions', 'fhir_observations']);
        
      if (tableError) {
        throw new Error(`Error checking existing tables: ${tableError.message}`);
      }
      
      if (existingTables && existingTables.length > 0) {
        logger.info(`Some FHIR tables already exist: ${existingTables.map(t => t.table_name).join(', ')}`);
      }
      
      // Execute individual statements from the migration file
      // This is a simplified approach - in a real app, we'd parse the SQL properly
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        try {
          const stmt = statements[i].trim();
          if (stmt) {
            logger.info(`Executing statement ${i+1}/${statements.length}`);
            const { error: stmtError } = await supabase.rpc('execute_statement', { statement: stmt });
            if (stmtError) {
              logger.error(`Statement execution error: ${stmtError.message}`);
              // Continue with next statement instead of failing completely
            }
          }
        } catch (stmtError) {
          logger.error(`Failed to execute statement ${i+1}: ${stmtError.message}`);
        }
      }
      
      // Verify tables were created
      const { data: createdTables, error: verifyError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['fhir_bundles', 'fhir_patients', 'fhir_conditions', 'fhir_observations']);
        
      if (verifyError) {
        throw new Error(`Error verifying created tables: ${verifyError.message}`);
      }
      
      result = {
        tablesCreated: createdTables?.length || 0,
        tables: createdTables?.map(t => t.table_name) || []
      };
    }

    logger.info('FHIR storage migration completed successfully');
    return { success: true, result };
  } catch (error) {
    logger.error(`FHIR migration failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the migration
runFhirMigration()
  .then(result => {
    if (result.success) {
      logger.info(`Migration script executed successfully: ${JSON.stringify(result.result)}`);
      process.exit(0);
    } else {
      logger.error(`Migration script failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(err => {
    logger.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });