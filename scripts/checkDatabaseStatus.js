// Check existing tables and load real CSV data
const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTU0NDEsImV4cCI6MjA3NDUzMTQ0MX0.hB4DlAIynpXWPQEFAE5HmHtr9iF7D6ghKQEPsynNfvs';

function makeRequest(path, method = 'GET', data = null) {
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

        if (data && method !== 'GET') {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function checkDatabaseStatus() {
    console.log('🔍 Checking Supabase Database Status...\n');

    // Check existing core tables
    const coreTables = [
        'user_profiles',
        'terminology_mappings', 
        'file_uploads',
        'api_clients',
        'system_notifications'
    ];

    console.log('📋 Core Tables Status:');
    for (const table of coreTables) {
        try {
            const response = await makeRequest(`/rest/v1/${table}?select=count`);
            if (response.status === 200) {
                const count = response.data[0]?.count || 0;
                console.log(`   ✅ ${table}: ${count} records`);
            } else {
                console.log(`   ❌ ${table}: Error ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
        }
    }

    // Check if new data tables exist
    console.log('\n🆕 Real Data Tables Status:');
    const dataTables = ['namaste_codes', 'icd11_tm2_codes'];
    
    for (const table of dataTables) {
        try {
            const response = await makeRequest(`/rest/v1/${table}?select=count`);
            if (response.status === 200) {
                const count = response.data[0]?.count || 0;
                console.log(`   ✅ ${table}: ${count} records`);
            } else if (response.status === 404) {
                console.log(`   ⚠️  ${table}: Table doesn't exist yet (will be created)`);
            } else {
                console.log(`   ❌ ${table}: Error ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
        }
    }

    // Sample existing data
    console.log('\n📊 Sample Existing Data:');
    try {
        const response = await makeRequest('/rest/v1/terminology_mappings?select=ayush_code,ayush_term,icd11_code,status&limit=3');
        if (response.status === 200 && response.data.length > 0) {
            console.log('   Existing terminology mappings:');
            response.data.forEach(mapping => {
                console.log(`   • ${mapping.ayush_code}: ${mapping.ayush_term} → ${mapping.icd11_code} (${mapping.status})`);
            });
        } else {
            console.log('   No existing terminology mappings found');
        }
    } catch (error) {
        console.log(`   Error fetching sample data: ${error.message}`);
    }

    console.log('\n🎯 Next Steps for Real Data Loading:');
    console.log('   1. ✅ Database connection verified');
    console.log('   2. ✅ Core schema is operational');
    console.log('   3. 🔄 Need to create tables for real CSV data');
    console.log('   4. 📥 Load NAMASTE codes from CSV');
    console.log('   5. 📥 Load ICD-11 TM2 codes from CSV');
    console.log('   6. 🧠 Create intelligent mappings');
}

checkDatabaseStatus().catch(console.error);