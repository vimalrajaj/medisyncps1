import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Simple logger
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`),
  success: (msg) => console.log(`SUCCESS: ${msg}`)
};

async function testFhirInsert() {
  try {
    // Get credentials from environment
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    }
    
    logger.info(`Using Supabase URL: ${url}`);
    
    // Create Supabase client
    const supabase = createClient(url, serviceKey);
    
    // Create a test FHIR bundle
    const testBundle = {
      resourceType: 'Bundle',
      id: `test-bundle-${uuidv4()}`,
      type: 'transaction',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: `test-patient-${uuidv4()}`,
            name: [{ text: 'Test Patient' }]
          },
          request: {
            method: 'POST',
            url: 'Patient'
          }
        }
      ]
    };
    
    logger.info('Testing insert into fhir_bundles table...');
    
    // Try to insert into the fhir_bundles table
    const { data: bundleData, error: bundleError } = await supabase
      .from('fhir_bundles')
      .insert({
        bundle_id: testBundle.id,
        bundle_type: testBundle.type,
        timestamp: testBundle.timestamp,
        content: testBundle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (bundleError) {
      throw new Error(`Failed to insert into fhir_bundles: ${bundleError.message}`);
    }
    
    logger.success(`Successfully inserted into fhir_bundles with id: ${bundleData.id}`);
    
    // Try to insert into the fhir_patients table
    const patientResource = testBundle.entry[0].resource;
    
    const { data: patientData, error: patientError } = await supabase
      .from('fhir_patients')
      .insert({
        resource_id: patientResource.id,
        name: patientResource.name[0].text,
        content: patientResource,
        bundle_id: bundleData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (patientError) {
      throw new Error(`Failed to insert into fhir_patients: ${patientError.message}`);
    }
    
    logger.success(`Successfully inserted into fhir_patients with id: ${patientData.id}`);
    
    return true;
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    return false;
  }
}

// Run the test
testFhirInsert().then(success => {
  process.exit(success ? 0 : 1);
});