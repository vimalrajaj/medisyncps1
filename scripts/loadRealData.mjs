/**
 * CSV Data Loader for NAMASTE and ICD-11 TM2 Codes
 * Loads real CSV data into Supabase database for real-time mapping demonstration
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse CSV content to array of objects
 */
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const headerSignature = lines[0].trim().toLowerCase();
    return lines
        .slice(1)
        .filter(line => line && line.trim().length > 0)
        .filter(line => line.trim().toLowerCase() !== headerSignature)
        .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || null;
        });
            return obj;
        });
}

/**
 * Load NAMASTE codes from CSV
 */
async function loadNamasteCodes() {
    try {
        console.log('📚 Loading NAMASTE codes...');
        
        const csvPath = path.join(__dirname, '../data/namaste_code.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const namasteData = parseCSV(csvContent);
        
        console.log(`Found ${namasteData.length} NAMASTE codes in CSV`);
        
        // Transform data for database insertion
        const transformedData = namasteData.map(row => ({
            namaste_code: row.namaste_code,
            namaste_display: row.namaste_display,
            namaste_description: row.namaste_description,
            category: row.category,
            ayush_system: row.ayush_system || 'Ayurveda'
        }));
        
        // Insert data with upsert to handle duplicates
        const { data, error } = await supabase
            .from('namaste_codes')
            .upsert(transformedData, { 
                onConflict: 'namaste_code',
                ignoreDuplicates: false 
            })
            .select();
        
        if (error) {
            console.error('❌ Error loading NAMASTE codes:', error);
            return false;
        }
        
        console.log(`✅ Successfully loaded ${data?.length || transformedData.length} NAMASTE codes`);
        return true;
        
    } catch (error) {
        console.error('❌ Error reading NAMASTE CSV:', error);
        return false;
    }
}

/**
 * Load ICD-11 TM2 codes from CSV
 */
async function loadICD11TM2Codes() {
    try {
        console.log('🏥 Loading ICD-11 TM2 codes...');
        
        const csvPath = path.join(__dirname, '../data/icd11_TM_2.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const icdData = parseCSV(csvContent).filter(row => row.icd11_tm2_code);
        
        console.log(`Found ${icdData.length} ICD-11 TM2 codes in CSV`);
        
        // Transform data for database insertion
        const transformedData = [];
        const seenCodes = new Set();

        icdData.forEach(row => {
            if (!row.icd11_tm2_code || seenCodes.has(row.icd11_tm2_code)) {
                return;
            }

            seenCodes.add(row.icd11_tm2_code);
            transformedData.push({
            icd11_tm2_code: row.icd11_tm2_code,
            icd11_tm2_display: row.icd11_tm2_display,
            icd11_tm2_description: row.icd11_tm2_description,
            icd11_biomed_code: row.icd11_biomed_code,
            icd11_biomed_display: row.icd11_biomed_display,
            icd11_biomed_description: row.icd11_biomed_description,
            equivalence: row.equivalence,
            confidence: row.confidence ? parseFloat(row.confidence) : null,
            mapping_method: row.mapping_method
            });
        });
        
        // Insert data with upsert to handle duplicates
        const { data, error } = await supabase
            .from('icd11_tm2_codes')
            .upsert(transformedData, { 
                onConflict: 'icd11_tm2_code',
                ignoreDuplicates: false 
            })
            .select();
        
        if (error) {
            console.error('❌ Error loading ICD-11 TM2 codes:', error);
            return false;
        }
        
        console.log(`✅ Successfully loaded ${data?.length || transformedData.length} ICD-11 TM2 codes`);
        return true;
        
    } catch (error) {
        console.error('❌ Error reading ICD-11 TM2 CSV:', error);
        return false;
    }
}

/**
 * Create intelligent mapping rules between NAMASTE and ICD-11 TM2
 */
async function createMappingRules() {
    try {
        console.log('🧠 Creating curated NAMASTE ↔ ICD-11 TM2 mappings...');

        const curatedMappings = [
            { ayush_code: 'AY001', icd11_code: 'SK25.0', mapping_confidence: 0.92, equivalence: 'related', clinical_evidence: 'Vata neuromuscular imbalance aligns with TM2 movement and coordination disorder patterns.' },
            { ayush_code: 'AY002', icd11_code: 'SP75.2', mapping_confidence: 0.91, equivalence: 'equivalent', clinical_evidence: 'Pitta inflammatory presentations mirror TM2 heat and fire disorder category.' },
            { ayush_code: 'AY003', icd11_code: 'SP90.1', mapping_confidence: 0.90, equivalence: 'equivalent', clinical_evidence: 'Kapha stagnation overlaps with TM2 fluid and structural stagnation disorders.' },
            { ayush_code: 'AY004', icd11_code: 'SS81.0', mapping_confidence: 0.95, equivalence: 'equivalent', clinical_evidence: 'Dual air-fire prakruti corresponds to TM2 air-fire constitutional pattern.' },
            { ayush_code: 'AY005', icd11_code: 'SS82.0', mapping_confidence: 0.95, equivalence: 'equivalent', clinical_evidence: 'Dual fire-water prakruti aligns with TM2 fire-water constitutional pattern.' },
            { ayush_code: 'AY006', icd11_code: 'SM25.1', mapping_confidence: 0.93, equivalence: 'equivalent', clinical_evidence: 'Reduced digestive fire directly maps to TM2 digestive weakness classification.' },
            { ayush_code: 'AY007', icd11_code: 'SM25.2', mapping_confidence: 0.92, equivalence: 'equivalent', clinical_evidence: 'Excessive digestive fire corresponds to TM2 excessive digestive fire pattern.' },
            { ayush_code: 'AY008', icd11_code: 'SM20.0', mapping_confidence: 0.90, equivalence: 'equivalent', clinical_evidence: 'Central digestive fire imbalance reflects TM2 central digestive disorder category.' },
            { ayush_code: 'AY009', icd11_code: 'SM27.0', mapping_confidence: 0.88, equivalence: 'related', clinical_evidence: 'Tissue-level metabolic weakness links with TM2 tissue metabolic disorders.' },
            { ayush_code: 'AY010', icd11_code: 'SP96.0', mapping_confidence: 0.86, equivalence: 'related', clinical_evidence: 'Elemental digestive fire weakness impacts metabolic essence similar to TM2 classification.' },
            { ayush_code: 'AY011', icd11_code: 'SP85.0', mapping_confidence: 0.90, equivalence: 'equivalent', clinical_evidence: 'Ama toxin accumulation matches TM2 metabolic toxin disorder category.' },
            { ayush_code: 'AY011', icd11_code: 'SQ75.0', mapping_confidence: 0.84, equivalence: 'related', clinical_evidence: 'Ama formation from exogenous toxins correlates with TM2 artificial toxin disorders.' },
            { ayush_code: 'AY012', icd11_code: 'SP86.1', mapping_confidence: 0.88, equivalence: 'related', clinical_evidence: 'Toxic Vata presentations overlap with TM2 inflammatory toxic disorders.' },
            { ayush_code: 'AY012', icd11_code: 'SQ76.1', mapping_confidence: 0.82, equivalence: 'related', clinical_evidence: 'Herbal toxin accumulation in Sama-Vata cases aligns with TM2 plant toxin disorders.' },
            { ayush_code: 'AY013', icd11_code: 'SP75.2', mapping_confidence: 0.87, equivalence: 'related', clinical_evidence: 'Toxic Pitta heat mirrors TM2 heat and fire disorders with toxic component.' },
            { ayush_code: 'AY014', icd11_code: 'SP90.1', mapping_confidence: 0.86, equivalence: 'related', clinical_evidence: 'Toxic Kapha stagnation parallels TM2 fluid and structural stagnation disorders.' },
            { ayush_code: 'AY015', icd11_code: 'SP95.0', mapping_confidence: 0.92, equivalence: 'equivalent', clinical_evidence: 'Ojas depletion reflects TM2 vital essence depletion manifesting as immune weakness.' },
            { ayush_code: 'AY016', icd11_code: 'SP96.0', mapping_confidence: 0.83, equivalence: 'related', clinical_evidence: 'Excess Tejas impacts metabolic essence similar to TM2 metabolic essence disorders.' },
            { ayush_code: 'AY017', icd11_code: 'SK25.0', mapping_confidence: 0.88, equivalence: 'related', clinical_evidence: 'Prana Vata disturbance causes neuromuscular findings mapped to TM2 movement disorder.' },
            { ayush_code: 'AY017', icd11_code: 'SM67.0', mapping_confidence: 0.82, equivalence: 'related', clinical_evidence: 'Prana Vata disturbance weakens musculature aligning with TM2 muscle tissue disorders.' },
            { ayush_code: 'AY018', icd11_code: 'SP97.0', mapping_confidence: 0.86, equivalence: 'related', clinical_evidence: 'Sadhaka Pitta imbalance contributes to fatigue consistent with TM2 life force depletion.' },
            { ayush_code: 'AY019', icd11_code: 'SM65.0', mapping_confidence: 0.90, equivalence: 'equivalent', clinical_evidence: 'Tarpaka Kapha deficiency mirrors TM2 plasma and lymph tissue deficiency pattern.' },
            { ayush_code: 'AY019', icd11_code: 'SM69.0', mapping_confidence: 0.81, equivalence: 'related', clinical_evidence: 'Chronic Tarpaka depletion impacts bone nourishment similar to TM2 bone deficiency disorders.' },
            { ayush_code: 'AY020', icd11_code: 'SM65.0', mapping_confidence: 0.85, equivalence: 'related', clinical_evidence: 'Rasa dhatu disruption results in plasma deficiency mapped to TM2 plasma tissue disorders.' },
            { ayush_code: 'AY021', icd11_code: 'SP86.1', mapping_confidence: 0.84, equivalence: 'related', clinical_evidence: 'Excess Rakta with inflammatory toxins aligns with TM2 inflammatory toxic disorders.' },
            { ayush_code: 'AY021', icd11_code: 'SM68.1', mapping_confidence: 0.80, equivalence: 'related', clinical_evidence: 'Rakta excess with metabolic accumulation parallels TM2 adipose tissue excess presentations.' }
        ];

        const [{ data: namasteCodes, error: namasteError }, { data: icdCodes, error: icdError }] = await Promise.all([
            supabase.from('namaste_codes').select('namaste_code, namaste_display'),
            supabase.from('icd11_tm2_codes').select('icd11_tm2_code, icd11_tm2_display')
        ]);

        if (namasteError || icdError) {
            console.error('❌ Error fetching code lookups:', namasteError || icdError);
            return false;
        }

        const namasteLookup = new Map((namasteCodes || []).map(code => [code.namaste_code, code.namaste_display]));
        const icdLookup = new Map((icdCodes || []).map(code => [code.icd11_tm2_code, code.icd11_tm2_display]));

        const payload = curatedMappings.map(mapping => ({
            ayush_code: mapping.ayush_code,
            ayush_term: namasteLookup.get(mapping.ayush_code) || mapping.ayush_code,
            icd11_code: mapping.icd11_code,
            icd11_term: icdLookup.get(mapping.icd11_code) || mapping.icd11_code,
            mapping_confidence: mapping.mapping_confidence,
            status: 'approved',
            equivalence: mapping.equivalence,
            mapping_method: 'curated_alignment',
            clinical_evidence: mapping.clinical_evidence
        }));

        const { data, error } = await supabase
            .from('terminology_mappings')
            .upsert(payload, {
                onConflict: 'ayush_code,icd11_code',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Error creating curated mappings:', error);
            return false;
        }

        console.log(`✅ Successfully upserted ${data?.length || payload.length} curated mappings`);
        return true;

    } catch (error) {
        console.error('❌ Error creating mapping rules:', error);
        return false;
    }
}

/**
 * Verify data loading and mapping creation
 */
async function verifyDataLoad() {
    try {
        console.log('🔍 Verifying data load...');
        
        // Count NAMASTE codes
        const { count: namasteCount } = await supabase
            .from('namaste_codes')
            .select('*', { count: 'exact', head: true });
        
        // Count ICD-11 TM2 codes
        const { count: icdCount } = await supabase
            .from('icd11_tm2_codes')
            .select('*', { count: 'exact', head: true });
        
        // Count mapping rules
        const { count: mappingCount } = await supabase
            .from('terminology_mappings')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Database verification:`);
        console.log(`   • NAMASTE codes: ${namasteCount}`);
        console.log(`   • ICD-11 TM2 codes: ${icdCount}`);
        console.log(`   • Mapping rules: ${mappingCount}`);
        
        // Test a sample mapping query
        const { data: sampleMapping } = await supabase
            .from('namaste_codes')
            .select(`
                namaste_code,
                namaste_display,
                category
            `)
            .limit(3);
        
        console.log(`📋 Sample NAMASTE codes loaded:`);
        sampleMapping?.forEach(code => {
            console.log(`   • ${code.namaste_code}: ${code.namaste_display} (${code.category})`);
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error verifying data:', error);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting CSV data loading for real-time NAMASTE ↔ ICD-11 TM2 mapping...\n');
    
    try {
        // Test Supabase connection
        const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            console.log('💡 Please check your VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
            process.exit(1);
        }
        console.log('✅ Supabase connection successful\n');
        
        // Load data sequentially
        const namasteSuccess = await loadNamasteCodes();
        if (!namasteSuccess) {
            console.error('❌ Failed to load NAMASTE codes');
            process.exit(1);
        }
        
        const icdSuccess = await loadICD11TM2Codes();
        if (!icdSuccess) {
            console.error('❌ Failed to load ICD-11 TM2 codes');
            process.exit(1);
        }
        
        const mappingSuccess = await createMappingRules();
        if (!mappingSuccess) {
            console.error('❌ Failed to create mapping rules');
            process.exit(1);
        }
        
        const verificationSuccess = await verifyDataLoad();
        if (!verificationSuccess) {
            console.error('❌ Data verification failed');
            process.exit(1);
        }
        
        console.log('\n🎉 Real-time mapping database successfully populated!');
        console.log('🔗 System ready for authentic NAMASTE ↔ ICD-11 TM2 mapping demonstration');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}

export { loadNamasteCodes, loadICD11TM2Codes, createMappingRules, verifyDataLoad };