import {# Read environment variables from server config or set directly
const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk1NTQ0MSwiZXhwIjoyMDc0NTMxNDQxfQ.kHbJKJnbFDgeP8RC7gXTknb4PCYzu_IvoLy9KwzelgI';eateClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from server config or set directly
const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', 'complete_system_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Schema file loaded successfully');
    
    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        stmt !== ''
      );
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          
          // Use the raw SQL execution via RPC
          const { error } = await supabase.rpc('execute_sql', { sql: statement });
          
          if (error) {
            console.warn(`Warning on statement ${i + 1}:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.warn(`Error on statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\nExecution completed:`);
    console.log(`- Successful statements: ${successCount}`);
    console.log(`- Failed statements: ${errorCount}`);
    
    // Test if key tables exist
    console.log('\nTesting table accessibility...');
    
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
      
    if (patientsError) {
      console.error('❌ Patients table not accessible:', patientsError.message);
    } else {
      console.log('✅ Patients table is accessible');
    }
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('diagnosis_sessions')
      .select('count')
      .limit(1);
      
    if (sessionsError) {
      console.error('❌ Diagnosis sessions table not accessible:', sessionsError.message);
    } else {
      console.log('✅ Diagnosis sessions table is accessible');
    }
    
    console.log('\nSchema setup completed!');
    
  } catch (error) {
    console.error('Schema creation failed:', error);
  }
}

createTables();