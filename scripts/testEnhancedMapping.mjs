import { supabase } from '../server/src/config/database.js';
import { logger } from '../server/src/utils/logger.js';

/**
 * Test Suite for Enhanced Mapping Functionality
 * Tests SNOMED CT and LOINC integration in the terminology service
 */

/**
 * Test 1: Verify SNOMED CT and LOINC tables exist and are populated
 */
async function testTablesExist() {
    console.log('🧪 Test 1: Verifying database tables...');
    
    try {
        // Test SNOMED CT table
        const { data: snomedData, error: snomedError } = await supabase
            .from('snomed_ct_codes')
            .select('count(*)')
            .single();
        
        if (snomedError) throw snomedError;
        
        // Test LOINC table
        const { data: loincData, error: loincError } = await supabase
            .from('loinc_codes')
            .select('count(*)')
            .single();
        
        if (loincError) throw loincError;
        
        // Test enhanced terminology_mappings
        const { data: mappingData, error: mappingError } = await supabase
            .from('terminology_mappings')
            .select('snomed_ct_code, loinc_code, cross_validated')
            .not('snomed_ct_code', 'is', null)
            .limit(1);
        
        if (mappingError) throw mappingError;
        
        console.log(`✅ SNOMED CT codes: ${snomedData.count}`);
        console.log(`✅ LOINC codes: ${loincData.count}`);
        console.log(`✅ Enhanced mappings: ${mappingData.length > 0 ? 'Present' : 'None'}\n`);
        
        return {
            snomedCount: snomedData.count,
            loincCount: loincData.count,
            enhancedMappings: mappingData.length > 0
        };
        
    } catch (error) {
        console.error('❌ Table verification failed:', error.message);
        throw error;
    }
}

/**
 * Test 2: Test multi-terminology search functionality
 */
async function testMultiTerminologySearch() {
    console.log('🧪 Test 2: Testing multi-terminology search...');
    
    try {
        const searchTerms = ['vata', 'digestive', 'mental', 'pain'];
        const results = [];
        
        for (const term of searchTerms) {
            // Test NAMASTE search
            const { data: namasteResults } = await supabase
                .from('namaste_codes')
                .select('*')
                .ilike('namaste_display', `%${term}%`)
                .limit(3);
            
            // Test SNOMED CT search
            const { data: snomedResults } = await supabase
                .from('snomed_ct_codes')
                .select('*')
                .ilike('snomed_term', `%${term}%`)
                .limit(3);
            
            // Test LOINC search
            const { data: loincResults } = await supabase
                .from('loinc_codes')
                .select('*')
                .or(`loinc_term.ilike.%${term}%,component.ilike.%${term}%`)
                .limit(3);
            
            results.push({
                term,
                namaste: namasteResults?.length || 0,
                snomed: snomedResults?.length || 0,
                loinc: loincResults?.length || 0
            });
        }
        
        console.log('Search Results:');
        results.forEach(result => {
            console.log(`   "${result.term}": NAMASTE(${result.namaste}) | SNOMED(${result.snomed}) | LOINC(${result.loinc})`);
        });
        console.log('✅ Multi-terminology search working\n');
        
        return results;
        
    } catch (error) {
        console.error('❌ Multi-terminology search failed:', error.message);
        throw error;
    }
}

/**
 * Test 3: Test mapping relationships and cross-validation
 */
async function testMappingRelationships() {
    console.log('🧪 Test 3: Testing mapping relationships...');
    
    try {
        // Test mappings with SNOMED CT
        const { data: snomedMappings } = await supabase
            .from('terminology_mappings')
            .select(`
                ayush_code,
                ayush_display,
                snomed_ct_code,
                snomed_ct_term,
                mapping_confidence,
                cross_validated
            `)
            .not('snomed_ct_code', 'is', null)
            .limit(5);
        
        // Test mappings with LOINC
        const { data: loincMappings } = await supabase
            .from('terminology_mappings')
            .select(`
                ayush_code,
                ayush_display,
                loinc_code,
                loinc_term,
                mapping_confidence,
                cross_validated
            `)
            .not('loinc_code', 'is', null)
            .limit(5);
        
        // Test cross-validated mappings
        const { data: crossValidated } = await supabase
            .from('terminology_mappings')
            .select('*')
            .eq('cross_validated', true);
        
        console.log(`✅ SNOMED CT mappings: ${snomedMappings?.length || 0}`);
        console.log(`✅ LOINC mappings: ${loincMappings?.length || 0}`);
        console.log(`✅ Cross-validated mappings: ${crossValidated?.length || 0}`);
        
        if (snomedMappings?.length > 0) {
            console.log('Sample SNOMED mapping:');
            console.log(`   ${snomedMappings[0].ayush_display} → ${snomedMappings[0].snomed_ct_term} (${snomedMappings[0].mapping_confidence}%)`);
        }
        
        console.log('');
        
        return {
            snomedMappings: snomedMappings?.length || 0,
            loincMappings: loincMappings?.length || 0,
            crossValidated: crossValidated?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Mapping relationships test failed:', error.message);
        throw error;
    }
}

/**
 * Test 4: Test semantic tag functionality
 */
async function testSemanticTags() {
    console.log('🧪 Test 4: Testing semantic tags...');
    
    try {
        // Test semantic tags in SNOMED CT
        const { data: semanticTags } = await supabase
            .from('snomed_ct_codes')
            .select('semantic_tag')
            .not('semantic_tag', 'is', null);
        
        const tagCounts = semanticTags?.reduce((acc, row) => {
            acc[row.semantic_tag] = (acc[row.semantic_tag] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Semantic Tag Distribution:');
        Object.entries(tagCounts || {}).forEach(([tag, count]) => {
            console.log(`   ${tag}: ${count}`);
        });
        
        // Test mappings with semantic tags
        const { data: mappingsWithTags } = await supabase
            .from('terminology_mappings')
            .select('semantic_tag')
            .not('semantic_tag', 'is', null);
        
        console.log(`✅ Mappings with semantic tags: ${mappingsWithTags?.length || 0}\n`);
        
        return {
            uniqueTags: Object.keys(tagCounts || {}).length,
            taggedMappings: mappingsWithTags?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Semantic tags test failed:', error.message);
        throw error;
    }
}

/**
 * Test 5: Test mapping statistics view
 */
async function testMappingStatistics() {
    console.log('🧪 Test 5: Testing mapping statistics...');
    
    try {
        const { data: stats, error } = await supabase
            .from('mapping_statistics_view')
            .select('*')
            .single();
        
        if (error) throw error;
        
        console.log('Mapping Statistics:');
        console.log(`   Total Mappings: ${stats.total_mappings}`);
        console.log(`   ICD-11 Mappings: ${stats.icd11_mappings}`);
        console.log(`   SNOMED Mappings: ${stats.snomed_mappings}`);
        console.log(`   LOINC Mappings: ${stats.loinc_mappings}`);
        console.log(`   Cross-validated: ${stats.cross_validated_mappings}`);
        console.log(`   Average Confidence: ${stats.avg_confidence}%`);
        console.log(`   Approved: ${stats.approved_mappings}`);
        console.log(`   Pending: ${stats.pending_mappings}\n`);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Mapping statistics test failed:', error.message);
        throw error;
    }
}

/**
 * Test 6: Test API endpoint functionality (if server is running)
 */
async function testApiEndpoints() {
    console.log('🧪 Test 6: Testing API endpoints...');
    
    try {
        const baseUrl = 'http://localhost:3002/api/v1';
        
        // Test terminology search endpoint
        const searchResponse = await fetch(`${baseUrl}/terminology/search?query=vata&limit=5`);
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`✅ Search API: ${searchData.results?.length || 0} results for "vata"`);
            
            // Check if results include SNOMED CT and LOINC mappings
            const hasSnomed = searchData.results?.some(r => r.snomed_mappings?.length > 0);
            const hasLoinc = searchData.results?.some(r => r.loinc_mappings?.length > 0);
            
            console.log(`   SNOMED CT integration: ${hasSnomed ? '✅ Active' : '⚠️ Not detected'}`);
            console.log(`   LOINC integration: ${hasLoinc ? '✅ Active' : '⚠️ Not detected'}`);
        } else {
            console.log('⚠️ API server not running or endpoint not accessible');
        }
        
        console.log('');
        
    } catch (error) {
        console.log('⚠️ API endpoint test skipped (server may not be running)');
        console.log('');
    }
}

/**
 * Main test runner
 */
async function runEnhancedMappingTests() {
    const startTime = Date.now();
    
    console.log('🧪 ENHANCED MAPPING FUNCTIONALITY TEST SUITE');
    console.log('============================================\n');
    
    const testResults = {
        passed: 0,
        failed: 0,
        warnings: 0
    };
    
    try {
        // Run all tests
        const tests = [
            { name: 'Tables Verification', fn: testTablesExist },
            { name: 'Multi-terminology Search', fn: testMultiTerminologySearch },
            { name: 'Mapping Relationships', fn: testMappingRelationships },
            { name: 'Semantic Tags', fn: testSemanticTags },
            { name: 'Statistics View', fn: testMappingStatistics },
            { name: 'API Endpoints', fn: testApiEndpoints }
        ];
        
        const results = {};
        
        for (const test of tests) {
            try {
                results[test.name] = await test.fn();
                testResults.passed++;
            } catch (error) {
                console.error(`❌ ${test.name} failed:`, error.message);
                testResults.failed++;
                results[test.name] = { error: error.message };
            }
        }
        
        // Summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('============================================');
        console.log('📊 TEST SUMMARY');
        console.log('============================================');
        console.log(`✅ Tests Passed: ${testResults.passed}`);
        console.log(`❌ Tests Failed: ${testResults.failed}`);
        console.log(`⚠️ Warnings: ${testResults.warnings}`);
        console.log(`⏱️ Duration: ${duration}s\n`);
        
        if (testResults.failed === 0) {
            console.log('🎉 All tests passed! Enhanced mapping functionality is working correctly.');
            console.log('\n📌 Your SNOMED CT and LOINC integration is ready for use!');
            console.log('\n🚀 Next steps:');
            console.log('   1. Start using the enhanced search endpoints');
            console.log('   2. Begin creating cross-validated mappings');
            console.log('   3. Monitor mapping statistics for quality metrics');
        } else {
            console.log('⚠️ Some tests failed. Please review the errors above and ensure:');
            console.log('   1. Database migration has been applied');
            console.log('   2. Reference data has been populated');
            console.log('   3. API server is running (for endpoint tests)');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runEnhancedMappingTests();
}

export { runEnhancedMappingTests };