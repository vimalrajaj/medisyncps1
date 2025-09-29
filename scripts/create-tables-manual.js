import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk1NTQ0MSwiZXhwIjoyMDc0NTMxNDQxfQ.kHbJKJnbFDgeP8RC7gXTknb4PCYzu_IvoLy9KwzelgI';

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
    
    // Since we can't use RPC, let's try using the REST API to create tables manually
    console.log('Creating patients table...');
    try {
      const { error: patientsError } = await supabase
        .from('patients')
        .select('count')
        .limit(1);
      
      if (patientsError && patientsError.code === 'PGRST116') {
        console.log('Patients table does not exist, it needs to be created manually in Supabase dashboard');
      } else if (!patientsError) {
        console.log('✅ Patients table already exists');
      }
    } catch (err) {
      console.log('Patients table needs to be created');
    }
    
    console.log('Creating diagnosis_sessions table...');
    try {
      const { error: sessionsError } = await supabase
        .from('diagnosis_sessions')
        .select('count')
        .limit(1);
      
      if (sessionsError && sessionsError.code === 'PGRST116') {
        console.log('Diagnosis sessions table does not exist, it needs to be created manually in Supabase dashboard');
      } else if (!sessionsError) {
        console.log('✅ Diagnosis sessions table already exists');
      }
    } catch (err) {
      console.log('Diagnosis sessions table needs to be created');
    }
    
    console.log('\n=== INSTRUCTIONS ===');
    console.log('Please go to your Supabase dashboard:');
    console.log('1. Go to https://krgjbzjpqupgzjmpricw.supabase.co');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Copy and paste the entire content of supabase/migrations/complete_system_schema.sql');
    console.log('4. Click "Run" to execute the schema');
    console.log('5. Come back and run the server again');
    
  } catch (error) {
    console.error('Schema setup failed:', error);
  }
}

createTables();