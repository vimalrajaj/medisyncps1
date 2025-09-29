// Simple Supabase Connection Test
const https = require('https');

const supabaseUrl = 'https://krgjbzjpqupgzjmpricw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTU0NDEsImV4cCI6MjA3NDUzMTQ0MX0.hB4DlAIynpXWPQEFAE5HmHtr9iF7D6ghKQEPsynNfvs';

console.log('🔌 Testing Supabase Database Connection...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${anonKey.substring(0, 20)}...`);

const options = {
    hostname: 'krgjbzjpqupgzjmpricw.supabase.co',
    port: 443,
    path: '/rest/v1/user_profiles?select=count',
    method: 'GET',
    headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    console.log(`📡 Response Status: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('✅ Connection successful!');
        console.log('📊 Response data:', data);
        
        if (res.statusCode === 200) {
            console.log('🎉 Supabase database is accessible and responsive!');
        } else {
            console.log(`⚠️  Response code ${res.statusCode} - Check permissions or table structure`);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('💡 Possible issues:');
    console.log('   • Network connectivity problems');
    console.log('   • Incorrect Supabase URL or API key');
    console.log('   • Firewall blocking HTTPS requests');
});

req.on('timeout', () => {
    console.error('❌ Connection timeout');
    req.destroy();
});

req.setTimeout(10000); // 10 second timeout
req.end();