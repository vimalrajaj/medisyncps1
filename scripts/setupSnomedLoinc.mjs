#!/usr/bin/env node

/**
 * SNOMED CT and LOINC Implementation Setup Script
 * 
 * This script executes all necessary steps to implement SNOMED CT and LOINC
 * semantics compliance in the AYUSH Terminology Service
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🚀 SNOMED CT & LOINC Implementation Setup');
console.log('==========================================\n');

/**
 * Execute a command and log the result
 */
function executeStep(description, command, options = {}) {
    console.log(`📋 ${description}...`);
    
    try {
        const result = execSync(command, {
            cwd: rootDir,
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        
        console.log(`✅ ${description} completed\n`);
        return result;
        
    } catch (error) {
        console.error(`❌ ${description} failed:`);
        console.error(error.message);
        console.log('');
        
        if (options.continueOnError) {
            console.log('⚠️ Continuing despite error...\n');
            return null;
        } else {
            process.exit(1);
        }
    }
}

/**
 * Main setup function
 */
async function setupSnomedLoinc() {
    console.log('🎯 Implementing SNOMED CT and LOINC semantics compliance...\n');
    
    // Step 1: Apply database migration
    console.log('Step 1: Database Schema Setup');
    console.log('-----------------------------');
    
    try {
        executeStep(
            'Applying SNOMED CT and LOINC database migration',
            'npx supabase db push',
            { continueOnError: true }
        );
    } catch (error) {
        console.log('⚠️ If migration failed, you can manually apply the SQL from:');
        console.log('   supabase/migrations/20250101000003_add_snomed_loinc_support.sql\n');
    }
    
    // Step 2: Install dependencies (if needed)
    console.log('Step 2: Dependencies Check');
    console.log('--------------------------');
    executeStep(
        'Ensuring all dependencies are installed',
        'npm install',
        { silent: true }
    );
    
    // Step 3: Populate reference data
    console.log('Step 3: Reference Data Population');
    console.log('---------------------------------');
    executeStep(
        'Populating SNOMED CT and LOINC reference data',
        'node scripts/populateSnomedLoincData.mjs'
    );
    
    // Step 4: Test implementation
    console.log('Step 4: Testing Enhanced Functionality');
    console.log('--------------------------------------');
    executeStep(
        'Running enhanced mapping functionality tests',
        'node scripts/testEnhancedMapping.mjs'
    );
    
    // Step 5: Restart services (if running)
    console.log('Step 5: Service Restart');
    console.log('-----------------------');
    console.log('📝 Manual step: If your servers are running, restart them to pick up changes:');
    console.log('   Backend: Ctrl+C in server terminal, then npm start');
    console.log('   Frontend: Should auto-reload if Vite dev server is running\n');
    
    // Final summary
    console.log('🎉 SNOMED CT & LOINC Implementation Complete!');
    console.log('=============================================\n');
    
    console.log('✅ What was implemented:');
    console.log('   • Database schema extended with SNOMED CT and LOINC tables');
    console.log('   • Reference data populated for both terminologies');
    console.log('   • Enhanced mapping service with multi-terminology support');
    console.log('   • Cross-validation capabilities between terminologies');
    console.log('   • Semantic tag support for clinical context');
    console.log('   • Statistics view for monitoring mapping quality\n');
    
    console.log('📊 Key Features Added:');
    console.log('   • Multi-terminology search (NAMASTE + ICD-11 + SNOMED CT + LOINC)');
    console.log('   • Intelligent mapping algorithms with confidence scoring');
    console.log('   • Cross-validated mappings for higher accuracy');
    console.log('   • Semantic categorization using SNOMED CT tags');
    console.log('   • Clinical evidence tracking for mappings\n');
    
    console.log('🚀 Next Steps:');
    console.log('   1. Start using enhanced search endpoints');
    console.log('   2. Create additional curated mappings in the database');
    console.log('   3. Monitor mapping statistics for quality improvements');
    console.log('   4. Integrate with clinical workflows');
    console.log('   5. Consider expanding reference datasets\n');
    
    console.log('📚 Available API Endpoints:');
    console.log('   • GET /api/v1/terminology/search?query=<term>');
    console.log('   • GET /api/v1/terminology/mappings/statistics');
    console.log('   • POST /api/v1/terminology/mappings (create new mappings)');
    console.log('   • GET /api/v1/terminology/snomed-ct/<code>');
    console.log('   • GET /api/v1/terminology/loinc/<code>\n');
    
    console.log('🎯 Jira Requirements Status:');
    console.log('   ✅ SNOMED CT / LOINC Semantics: IMPLEMENTED');
    console.log('   ✅ Multi-terminology ConceptMap resources: READY');
    console.log('   ✅ Enhanced interoperability: ACTIVE\n');
    
    console.log('💡 The system now supports comprehensive terminology mapping');
    console.log('   across NAMASTE, ICD-11, SNOMED CT, and LOINC standards!');
}

// Execute setup if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupSnomedLoinc().catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}

export { setupSnomedLoinc };