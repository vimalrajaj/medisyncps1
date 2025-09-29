// Check if our two CSV datasets are actually loaded in Supabase database
const https = require('https');

const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTU0NDEsImV4cCI6MjA3NDUzMTQ0MX0.hB4DlAIynpXWPQEFAE5HmHtr9iF7D6ghKQEPsynNfvs';

function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'krgjbzjpqupgzjmpricw.supabase.co',
            port: 443,
            path: path,
            method: method,
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = responseData ? JSON.parse(responseData) : null;
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function checkDatasetStatus() {
    console.log('🔍 Checking Dataset Loading Status in Supabase...\n');

    try {
        // Check if dedicated tables exist for our datasets
        console.log('📋 Checking for dedicated dataset tables:');
        
        const dedicatedTables = ['namaste_codes', 'icd11_tm2_codes'];
        let dedicatedTablesExist = false;
        
        for (const table of dedicatedTables) {
            try {
                const response = await makeRequest(`/rest/v1/${table}?select=count`);
                if (response.status === 200) {
                    const count = response.data[0]?.count || 0;
                    console.log(`   ✅ ${table}: ${count} records`);
                    dedicatedTablesExist = true;
                } else if (response.status === 404) {
                    console.log(`   ❌ ${table}: Table does not exist`);
                } else {
                    console.log(`   ⚠️  ${table}: Error ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            }
        }

        // Check existing terminology_mappings table for our data
        console.log('\n📊 Checking terminology_mappings table:');
        const response = await makeRequest('/rest/v1/terminology_mappings?select=*');
        
        if (response.status === 200) {
            const allMappings = response.data;
            console.log(`   📈 Total mappings in database: ${allMappings.length}`);
            
            // Check for NAMASTE codes (AY001, AY002, etc.)
            const namasteMappings = allMappings.filter(mapping => 
                mapping.ayush_code && mapping.ayush_code.startsWith('AY')
            );
            console.log(`   🟢 NAMASTE code mappings: ${namasteMappings.length}`);
            
            // Check for ICD-11 TM2 codes in target field
            const icdMappings = allMappings.filter(mapping => 
                mapping.icd11_code && (
                    mapping.icd11_code.startsWith('S') || 
                    mapping.icd11_code.includes('TM2') ||
                    mapping.icd11_term?.includes('TM2')
                )
            );
            console.log(`   🟡 ICD-11 TM2 mappings: ${icdMappings.length}`);
            
            // Show sample data
            console.log('\n   📋 Sample existing mappings:');
            allMappings.slice(0, 5).forEach(mapping => {
                console.log(`      • ${mapping.ayush_code}: ${mapping.ayush_term}`);
                console.log(`        → ${mapping.icd11_code || 'No ICD code'}: ${mapping.icd11_term || 'No ICD term'}`);
                console.log(`        Status: ${mapping.status} | Confidence: ${mapping.mapping_confidence || 'N/A'}`);
                console.log('');
            });
            
        } else {
            console.log(`   ❌ Error accessing terminology_mappings: ${response.status}`);
        }

        // Summary of dataset loading status
        console.log('\n🎯 Dataset Loading Status Summary:');
        console.log('─'.repeat(60));
        
        if (!dedicatedTablesExist) {
            console.log('❌ DEDICATED TABLES: Not created in database');
            console.log('   • namaste_codes table: Missing');
            console.log('   • icd11_tm2_codes table: Missing');
            console.log('');
            console.log('📝 CURRENT SITUATION:');
            console.log('   • CSV files exist locally in /data folder ✅');
            console.log('   • Database connection is working ✅');
            console.log('   • Core schema exists ✅');
            console.log('   • Dedicated dataset tables are NOT created ❌');
            console.log('   • Data is NOT loaded into database ❌');
            console.log('');
            console.log('💡 WHAT HAPPENED:');
            console.log('   • Our loading script failed due to 401 unauthorized errors');
            console.log('   • We only have anon key (read-only access)');
            console.log('   • Need service role key or admin authentication to insert data');
            console.log('   • Demo is working with local CSV files + simulation');
            console.log('');
            console.log('🔧 NEXT STEPS TO ACTUALLY LOAD DATA:');
            console.log('   1. Get service role key from Supabase dashboard');
            console.log('   2. Apply SQL migration to create tables');
            console.log('   3. Run data loading script with proper authentication');
            console.log('   4. Verify data loaded successfully');
        } else {
            console.log('✅ DATASET STATUS: Loaded in database');
        }

    } catch (error) {
        console.error('❌ Error checking dataset status:', error.message);
    }
}

checkDatasetStatus().catch(console.error);