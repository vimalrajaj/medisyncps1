import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk1NTQ0MSwiZXhwIjoyMDc0NTMxNDQxfQ.kHbJKJnbFDgeP8RC7gXTknb4PCYzu_IvoLy9KwzelgI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');
  
  try {
    // Test patients table
    console.log('Testing patients table...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('medical_record_number, first_name, last_name')
      .limit(5);
      
    if (patientsError) {
      console.error('❌ Patients table error:', patientsError.message);
    } else {
      console.log('✅ Patients table working!');
      console.log('   Sample patients:', patients);
    }
    
    // Test diagnosis_sessions table
    console.log('\nTesting diagnosis_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('diagnosis_sessions')
      .select('count')
      .limit(1);
      
    if (sessionsError) {
      console.error('❌ Diagnosis sessions table error:', sessionsError.message);
    } else {
      console.log('✅ Diagnosis sessions table working!');
    }
    
    // Test diagnosis_entries table
    console.log('\nTesting diagnosis_entries table...');
    const { data: entries, error: entriesError } = await supabase
      .from('diagnosis_entries')
      .select('count')
      .limit(1);
      
    if (entriesError) {
      console.error('❌ Diagnosis entries table error:', entriesError.message);
    } else {
      console.log('✅ Diagnosis entries table working!');
    }
    
    console.log('\n🎉 Database verification completed!');
    console.log('You can now test the "Save to Patient Record" functionality.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyTables();