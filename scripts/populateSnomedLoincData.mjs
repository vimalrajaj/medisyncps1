import { supabase } from '../server/src/config/database.js';
import { logger } from '../server/src/utils/logger.js';

/**
 * SNOMED CT Reference Data for AYUSH Systems
 * This dataset includes clinically relevant SNOMED CT codes for traditional medicine
 */
const snomedCTData = [
    // Constitutional/Prakriti Assessment
    { code: '762676003', term: 'Assessment of constitutional type', semantic_tag: 'procedure', module_id: '900000000000207008' },
    { code: '766988007', term: 'Constitutional imbalance', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '118233009', term: 'Finding related to general condition of patient', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // Digestive System (Agni/Pachak Pitta)
    { code: '271727006', term: 'Digestive system finding', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '386033004', term: 'Digestive system disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '162076009', term: 'Excessive appetite', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '79890006', term: 'Loss of appetite', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // Mental Health/Satvavajaya Chikitsa
    { code: '74732009', term: 'Mental disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '192080009', term: 'Mental health problem', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '48694002', term: 'Anxiety', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '35489007', term: 'Depressive disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Metabolic/Metabolic Disorders (Medas Dhatu)
    { code: '75934005', term: 'Metabolic syndrome', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '362969004', term: 'Disorder of metabolism', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '238013002', term: 'Disorder of lipid metabolism', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Immunity/Ojas (Immune System)
    { code: '414027002', term: 'Disorder involving the immune mechanism', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '276654001', term: 'Congenital immunodeficiency', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '234532001', term: 'Immunologic deficiency syndrome', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Respiratory System (Prana Vata)
    { code: '50043002', term: 'Disorder of respiratory system', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '195967001', term: 'Asthma', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '82272006', term: 'Common cold', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Circulatory System (Vyana Vata)
    { code: '49601007', term: 'Disorder of cardiovascular system', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '38341003', term: 'Hypertensive disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '53741008', term: 'Coronary arteriosclerosis', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Musculoskeletal System (Mamsa/Asthi Dhatu)
    { code: '928000', term: 'Disorder of musculoskeletal system', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '3723001', term: 'Arthritis', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '161891005', term: 'Back pain', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // Skin Disorders (Rasa/Rakta Dhatu)
    { code: '95320005', term: 'Disorder of skin', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '43116000', term: 'Eczema', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '9014002', term: 'Psoriasis', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Gynecological/Reproductive Health (Shukra Dhatu)
    { code: '198130006', term: 'Female reproductive system disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '198154004', term: 'Male reproductive system disorder', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '14302008', term: 'Infertility', semantic_tag: 'disorder', module_id: '900000000000207008' },
    
    // Neurological System (Majja Dhatu)
    { code: '118940003', term: 'Disorder of nervous system', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '25064002', term: 'Headache', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '193093009', term: 'Memory impairment', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // General Systemic Conditions
    { code: '362965005', term: 'Disorder of body system', semantic_tag: 'disorder', module_id: '900000000000207008' },
    { code: '118234003', term: 'General finding of observation of patient', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '404684003', term: 'Clinical finding', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // Traditional Medicine Procedures
    { code: '386053000', term: 'Evaluation procedure', semantic_tag: 'procedure', module_id: '900000000000207008' },
    { code: '225288009', term: 'Assessment procedure', semantic_tag: 'procedure', module_id: '900000000000207008' },
    { code: '182836005', term: 'Review of patient', semantic_tag: 'procedure', module_id: '900000000000207008' },
    
    // Pain Management
    { code: '22253000', term: 'Pain', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '30989003', term: 'Knee pain', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '76948002', term: 'Severe pain', semantic_tag: 'finding', module_id: '900000000000207008' },
    
    // Wellness and Prevention
    { code: '225336008', term: 'Wellness behavior', semantic_tag: 'finding', module_id: '900000000000207008' },
    { code: '410546004', term: 'Preventive procedure', semantic_tag: 'procedure', module_id: '900000000000207008' },
    { code: '373873005', term: 'Pharmaceutical / biologic product', semantic_tag: 'product', module_id: '900000000000207008' }
];

/**
 * LOINC Reference Data for Traditional Medicine Laboratory Tests
 */
const loincData = [
    // Constitutional Assessment
    { code: '72133-2', term: 'Patient constitutional assessment', component: 'Constitutional type', property: 'Type', time_aspect: 'Pt', system: 'Patient', scale_type: 'Nom', method_type: 'Clinical assessment', class: 'SURVEY' },
    
    // Pulse Diagnosis (Nadi Pariksha)
    { code: '8867-4', term: 'Heart rate', component: 'Heart beat', property: 'NRat', time_aspect: 'Pt', system: 'Heart', scale_type: 'Qn', method_type: 'Auscultation', class: 'VITAL SIGNS' },
    { code: '8480-6', term: 'Systolic blood pressure', component: 'Systolic blood pressure', property: 'Pres', time_aspect: 'Pt', system: 'Arterial system', scale_type: 'Qn', method_type: 'Auscultation', class: 'VITAL SIGNS' },
    { code: '8462-4', term: 'Diastolic blood pressure', component: 'Diastolic blood pressure', property: 'Pres', time_aspect: 'Pt', system: 'Arterial system', scale_type: 'Qn', method_type: 'Auscultation', class: 'VITAL SIGNS' },
    
    // Digestive Assessment (Agni Pariksha)
    { code: '33747-0', term: 'General appearance', component: 'General appearance', property: 'Find', time_aspect: 'Pt', system: 'Patient', scale_type: 'Nom', method_type: 'Physical examination', class: 'EXAM' },
    { code: '10210-3', term: 'Physical findings of Abdomen', component: 'Abdomen', property: 'Find', time_aspect: 'Pt', system: 'Abdomen', scale_type: 'Nar', method_type: 'Physical examination', class: 'EXAM' },
    
    // Mental Health Assessment
    { code: '72133-2', term: 'Mental status assessment', component: 'Mental status', property: 'Find', time_aspect: 'Pt', system: 'Mental', scale_type: 'Nar', method_type: 'Clinical interview', class: 'SURVEY' },
    { code: '44261-6', term: 'Patient Health Questionnaire 9 item total score', component: 'Depression severity', property: 'Scor', time_aspect: 'Pt', system: 'Patient', scale_type: 'Qn', method_type: 'PHQ-9', class: 'SURVEY' },
    
    // Laboratory Values - Metabolic Panel
    { code: '2345-7', term: 'Glucose', component: 'Glucose', property: 'SCnc', time_aspect: 'Pt', system: 'Serum/Plasma', scale_type: 'Qn', method_type: 'Enzymatic', class: 'CHEM' },
    { code: '2093-3', term: 'Cholesterol', component: 'Cholesterol', property: 'SCnc', time_aspect: 'Pt', system: 'Serum/Plasma', scale_type: 'Qn', method_type: 'Enzymatic', class: 'CHEM' },
    { code: '2571-8', term: 'Triglycerides', component: 'Triglyceride', property: 'SCnc', time_aspect: 'Pt', system: 'Serum/Plasma', scale_type: 'Qn', method_type: 'Enzymatic', class: 'CHEM' },
    
    // Immunity Assessment
    { code: '6690-2', term: 'Leukocytes', component: 'Leukocytes', property: 'NCnc', time_aspect: 'Pt', system: 'Blood', scale_type: 'Qn', method_type: 'Automated count', class: 'HEMATOLOGY' },
    { code: '770-8', term: 'Neutrophils/100 leukocytes', component: 'Neutrophils', property: 'NFr', time_aspect: 'Pt', system: 'Blood', scale_type: 'Qn', method_type: 'Manual count', class: 'HEMATOLOGY' },
    
    // Traditional Medicine Assessments
    { code: '67504-6', term: 'Discharge summary', component: 'Discharge summary', property: 'Find', time_aspect: 'Pt', system: 'Patient', scale_type: 'Nar', method_type: 'Clinical documentation', class: 'DOC' },
    { code: '8302-2', term: 'Body height', component: 'Body height', property: 'Len', time_aspect: 'Pt', system: 'Patient', scale_type: 'Qn', method_type: 'Measured', class: 'VITAL SIGNS' },
    { code: '29463-7', term: 'Body weight', component: 'Body weight', property: 'Mass', time_aspect: 'Pt', system: 'Patient', scale_type: 'Qn', method_type: 'Measured', class: 'VITAL SIGNS' },
    { code: '39156-5', term: 'Body mass index', component: 'Body mass index', property: 'Ratio', time_aspect: 'Pt', system: 'Patient', scale_type: 'Qn', method_type: 'Calculated', class: 'VITAL SIGNS' },
    
    // Ayurvedic Diagnostic Methods
    { code: '72274-4', term: 'Traditional medicine diagnostic assessment', component: 'Traditional diagnosis', property: 'Find', time_aspect: 'Pt', system: 'Patient', scale_type: 'Nar', method_type: 'Traditional examination', class: 'SURVEY' },
    
    // Quality of Life Assessment
    { code: '71969-0', term: 'Quality of life assessment', component: 'Quality of life', property: 'Find', time_aspect: 'Pt', system: 'Patient', scale_type: 'Nar', method_type: 'Questionnaire', class: 'SURVEY' }
];

/**
 * Populate SNOMED CT reference data
 */
async function populateSnomedCTData() {
    try {
        logger.info('Starting SNOMED CT data population...');
        
        const snomedRecords = snomedCTData.map(item => ({
            snomed_code: item.code,
            snomed_term: item.term,
            semantic_tag: item.semantic_tag,
            definition: `SNOMED CT concept: ${item.term}`,
            module_id: item.module_id,
            is_active: true,
            effective_time: new Date().toISOString().split('T')[0]
        }));
        
        const { data, error } = await supabase
            .from('snomed_ct_codes')
            .upsert(snomedRecords, { 
                onConflict: 'snomed_code',
                ignoreDuplicates: false 
            });
        
        if (error) {
            logger.error('Error populating SNOMED CT data:', error);
            throw error;
        }
        
        logger.info(`Successfully populated ${snomedRecords.length} SNOMED CT codes`);
        return data;
        
    } catch (error) {
        logger.error('Failed to populate SNOMED CT data:', error);
        throw error;
    }
}

/**
 * Populate LOINC reference data
 */
async function populateLoincData() {
    try {
        logger.info('Starting LOINC data population...');
        
        const loincRecords = loincData.map(item => ({
            loinc_code: item.code,
            loinc_term: item.term,
            component: item.component,
            property: item.property,
            time_aspect: item.time_aspect,
            system: item.system,
            scale_type: item.scale_type,
            method_type: item.method_type,
            class: item.class,
            status: 'ACTIVE'
        }));
        
        const { data, error } = await supabase
            .from('loinc_codes')
            .upsert(loincRecords, { 
                onConflict: 'loinc_code',
                ignoreDuplicates: false 
            });
        
        if (error) {
            logger.error('Error populating LOINC data:', error);
            throw error;
        }
        
        logger.info(`Successfully populated ${loincRecords.length} LOINC codes`);
        return data;
        
    } catch (error) {
        logger.error('Failed to populate LOINC data:', error);
        throw error;
    }
}

/**
 * Create enhanced NAMASTE ↔ ICD-11 mappings using SNOMED CT and LOINC as bridges
 * This demonstrates how SNOMED CT/LOINC improve mapping quality between NAMASTE and ICD-11
 */
async function createSampleMappings() {
    try {
        logger.info('Creating enhanced NAMASTE ↔ ICD-11 mappings with SNOMED CT/LOINC bridges...');
        
        const sampleMappings = [
            {
                // Primary mapping: NAMASTE → ICD-11
                ayush_code: 'A001.1',
                ayush_display: 'Vata Prakopa',
                icd11_code: 'QA02.Y',
                icd11_term: 'Constitutional disorder, unspecified',
                
                // Bridge terminologies for enhanced mapping
                snomed_ct_code: '766988007',
                snomed_ct_term: 'Constitutional imbalance',
                loinc_code: '72133-2',
                loinc_term: 'Patient constitutional assessment',
                
                mapping_confidence: 90, // Higher confidence due to SNOMED CT bridge
                status: 'approved',
                equivalence: 'related',
                mapping_method: 'snomed_ct_bridge',
                clinical_evidence: 'NAMASTE Vata Prakopa → SNOMED CT Constitutional imbalance → ICD-11 Constitutional disorder',
                semantic_tag: 'finding',
                cross_validated: true
            },
            {
                // Primary mapping: NAMASTE → ICD-11
                ayush_code: 'A002.1',
                ayush_display: 'Mandagni',
                icd11_code: 'DA90.Z',
                icd11_term: 'Functional dyspepsia, unspecified',
                
                // Bridge terminologies for enhanced mapping
                snomed_ct_code: '271727006',
                snomed_ct_term: 'Digestive system finding',
                loinc_code: '10210-3',
                loinc_term: 'Physical findings of Abdomen',
                
                mapping_confidence: 85, // Improved confidence via semantic bridge
                status: 'approved',
                equivalence: 'related',
                mapping_method: 'semantic_bridge_alignment',
                clinical_evidence: 'NAMASTE Mandagni (weak digestive fire) mapped via SNOMED CT digestive findings to ICD-11 functional dyspepsia',
                semantic_tag: 'finding',
                cross_validated: true
            },
            {
                // Primary mapping: NAMASTE → ICD-11
                ayush_code: 'A003.1',
                ayush_display: 'Manas Roga',
                icd11_code: '6A00-6E8Z',
                icd11_term: 'Mental, behavioural or neurodevelopmental disorders',
                
                // Bridge terminologies for enhanced mapping
                snomed_ct_code: '74732009',
                snomed_ct_term: 'Mental disorder',
                loinc_code: '72133-2',
                loinc_term: 'Mental status assessment',
                
                mapping_confidence: 95, // Highest confidence - direct semantic match
                status: 'approved',
                equivalence: 'equivalent',
                mapping_method: 'direct_semantic_bridge',
                clinical_evidence: 'NAMASTE Manas Roga directly corresponds to SNOMED CT Mental disorder and ICD-11 Mental disorders',
                semantic_tag: 'disorder',
                cross_validated: true
            }
        ];
        
        const { data, error } = await supabase
            .from('terminology_mappings')
            .upsert(sampleMappings, { 
                onConflict: 'ayush_code',
                ignoreDuplicates: false 
            });
        
        if (error) {
            logger.error('Error creating sample mappings:', error);
            throw error;
        }
        
        logger.info(`Successfully created ${sampleMappings.length} sample mappings`);
        return data;
        
    } catch (error) {
        logger.error('Failed to create sample mappings:', error);
        throw error;
    }
}

/**
 * Main execution function
 */
async function populateReferenceData() {
    try {
        console.log('🚀 Starting SNOMED CT and LOINC reference data population...\n');
        
        // 1. Populate SNOMED CT data
        console.log('📊 Populating SNOMED CT reference data...');
        await populateSnomedCTData();
        console.log('✅ SNOMED CT data populated successfully\n');
        
        // 2. Populate LOINC data
        console.log('📋 Populating LOINC reference data...');
        await populateLoincData();
        console.log('✅ LOINC data populated successfully\n');
        
        // 3. Create sample mappings
        console.log('🔗 Creating sample terminology mappings...');
        await createSampleMappings();
        console.log('✅ Sample mappings created successfully\n');
        
        // 4. Display statistics
        const { data: stats } = await supabase
            .from('mapping_statistics_view')
            .select('*');
        
        if (stats && stats.length > 0) {
            console.log('📈 Mapping Statistics:');
            console.log(`   Total Mappings: ${stats[0].total_mappings}`);
            console.log(`   ICD-11 Mappings: ${stats[0].icd11_mappings}`);
            console.log(`   SNOMED CT Mappings: ${stats[0].snomed_mappings}`);
            console.log(`   LOINC Mappings: ${stats[0].loinc_mappings}`);
            console.log(`   Cross-validated: ${stats[0].cross_validated_mappings}`);
            console.log(`   Average Confidence: ${stats[0].avg_confidence}%`);
            console.log(`   Approved: ${stats[0].approved_mappings}`);
        }
        
        console.log('\n🎉 Reference data population completed successfully!');
        console.log('\n📌 Next Steps:');
        console.log('   1. Run the database migration: supabase db push');
        console.log('   2. Test the enhanced mapping functionality');
        console.log('   3. Verify terminology search endpoints');
        
    } catch (error) {
        console.error('❌ Error during reference data population:', error);
        process.exit(1);
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    populateReferenceData();
}

export {
    populateSnomedCTData,
    populateLoincData,
    createSampleMappings,
    populateReferenceData
};