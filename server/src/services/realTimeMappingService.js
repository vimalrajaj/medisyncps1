/**
 * Real-Time Terminology Mapping Service
 * Implements intelligent NAMASTE ↔ ICD-11 TM2 mapping with real CSV data
 * Designed for Ministry of AYUSH demonstration with authentic clinical data
 */

import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Find NAMASTE codes matching user input with fuzzy search and semantic matching
 */
async function findMatchingNamasteCodes(searchTerm, limit = 10) {
    try {
        // First, search NAMASTE codes directly by display name and description
        const { data: namasteMatches, error: namasteError } = await supabase
            .from('namaste_codes')
            .select(`
                namaste_code,
                namaste_display,
                namaste_description,
                category,
                ayush_system
            `)
            .eq('is_active', true)
            .or(`namaste_display.ilike.%${searchTerm}%,namaste_description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
            .order('namaste_code')
            .limit(limit);

        if (namasteError) {
            console.error('Error finding NAMASTE codes:', namasteError);
            return [];
        }

        // For each NAMASTE code found, find potential ICD-11 TM2 and SNOMED CT mappings
        const enrichedResults = await Promise.all(
            (namasteMatches || []).map(async (namasteCode) => {
                // Look for existing approved mappings (ICD-11 and SNOMED CT)
                const { data: curatedMappings, error: curatedError } = await supabase
                    .from('terminology_mappings')
                    .select(`
                        icd11_code,
                        icd11_term,
                        snomed_ct_code,
                        snomed_ct_term,
                        loinc_code,
                        loinc_term,
                        mapping_confidence,
                        status,
                        equivalence,
                        mapping_method,
                        clinical_evidence
                    `)
                    .eq('ayush_code', namasteCode.namaste_code)
                    .eq('status', 'approved')
                    .order('mapping_confidence', { ascending: false });

                if (curatedError) {
                    logger.error('Error loading curated mappings', curatedError);
                }

                // Process ICD-11 mappings
                let icd11Mappings = (curatedMappings || [])
                    .filter(m => m.icd11_code)
                    .map(mapping => ({
                        target_code: mapping.icd11_code,
                        target_system: 'ICD-11-MMS',
                        target_term: mapping.icd11_term,
                        equivalence: mapping.equivalence || 'related',
                        confidence_score: mapping.mapping_confidence ?? 0,
                        clinical_evidence: mapping.clinical_evidence || `Curated ICD-11 mapping: ${namasteCode.namaste_display} → ${mapping.icd11_term}`,
                        mapping_method: mapping.mapping_method || 'curated_alignment'
                    }));

                // Use SNOMED CT and LOINC as bridges to enhance ICD-11 mappings
                // These are not separate mappings but bridge terminologies that improve mapping quality
                const bridgeTerminologies = (curatedMappings || [])
                    .map(mapping => ({
                        snomed_bridge: mapping.snomed_ct_code ? {
                            code: mapping.snomed_ct_code,
                            term: mapping.snomed_ct_term,
                            semantic_tag: mapping.semantic_tag
                        } : null,
                        loinc_bridge: mapping.loinc_code ? {
                            code: mapping.loinc_code,
                            term: mapping.loinc_term
                        } : null
                    }))
                    .filter(bridge => bridge.snomed_bridge || bridge.loinc_bridge);

                // Process LOINC mappings
                const loincMappings = (curatedMappings || [])
                    .filter(m => m.loinc_code)
                    .map(mapping => ({
                        target_code: mapping.loinc_code,
                        target_system: 'LOINC',
                        target_term: mapping.loinc_term,
                        equivalence: mapping.equivalence || 'related',
                        confidence_score: mapping.mapping_confidence ?? 0,
                        clinical_evidence: mapping.clinical_evidence || `Curated LOINC mapping: ${namasteCode.namaste_display} → ${mapping.loinc_term}`,
                        mapping_method: mapping.mapping_method || 'curated_alignment'
                    }));
                
                // If no existing ICD-11 mapping, try intelligent matching for ICD-11
                if (!icd11Mappings.length) {
                    const intelligentIcd11Mappings = await findIntelligentICD11Mappings(namasteCode);
                    icd11Mappings = intelligentIcd11Mappings.map(m => ({ ...m, target_system: 'ICD-11-MMS' }));
                }

                // Try to find intelligent SNOMED CT mappings if none exist
                let intelligentSnomedMappings = [];
                if (!snomedMappings.length) {
                    intelligentSnomedMappings = await findIntelligentSnomedMappings(namasteCode);
                }

                // Combine all mappings
                const allMappings = [...icd11Mappings, ...snomedMappings, ...loincMappings, ...intelligentSnomedMappings];

                return {
                    namaste: namasteCode,
                    mappings: allMappings,
                    icd11_mappings: icd11Mappings, // Keep for backward compatibility
                    snomed_mappings: [...snomedMappings, ...intelligentSnomedMappings],
                    loinc_mappings: loincMappings,
                    mapping_confidence: allMappings.length > 0 ? 
                        Math.max(...allMappings.map(m => m.confidence_score || 0)) : 0
                };
            })
        );

        return enrichedResults.sort((a, b) => b.mapping_confidence - a.mapping_confidence);

    } catch (error) {
        console.error('Error in findMatchingNamasteCodes:', error);
        return [];
    }
}

/**
 * Find intelligent ICD-11 TM2 mappings for a NAMASTE code using pattern matching
 */
async function findIntelligentICD11Mappings(namasteCode) {
    try {
        const searchTerms = [
            namasteCode.namaste_display.toLowerCase(),
            namasteCode.namaste_description?.toLowerCase() || '',
            namasteCode.category?.toLowerCase() || ''
        ].join(' ');

        // Search ICD-11 TM2 codes for semantic matches
        const { data: icdMatches, error } = await supabase
            .from('icd11_tm2_codes')
            .select(`
                icd11_tm2_code,
                icd11_tm2_display,
                icd11_tm2_description,
                equivalence,
                confidence,
                mapping_method
            `)
            .eq('is_active', true)
            .or(`icd11_tm2_display.ilike.%${getKeywords(searchTerms)}%,icd11_tm2_description.ilike.%${getKeywords(searchTerms)}%`)
            .limit(3);

        if (error || !icdMatches?.length) {
            // Fallback to category-based matching
            return await getCategoryBasedMappings(namasteCode.category);
        }

        // Calculate confidence based on text similarity
        return icdMatches.map(icdCode => ({
            target_code: icdCode.icd11_tm2_code,
            target_system: 'ICD-11-TM2',
            equivalence: icdCode.equivalence || 'related',
            confidence_score: calculateSimilarityConfidence(searchTerms, icdCode.icd11_tm2_display),
            clinical_evidence: `Auto-mapped based on semantic similarity: ${namasteCode.category} → ${icdCode.icd11_tm2_display}`,
            mapping_method: 'intelligent_semantic',
            icd11_term: icdCode.icd11_tm2_display
        }));

    } catch (error) {
        console.error('Error in findIntelligentICD11Mappings:', error);
        return [];
    }
}

/**
 * Extract keywords for better matching
 */
function getKeywords(text) {
    const keywords = text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['dosha', 'the', 'and', 'for', 'with'].includes(word))
        .slice(0, 3)
        .join('|');
    return keywords || text.substring(0, 10);
}

/**
 * Find intelligent SNOMED CT mappings for a NAMASTE code using pattern matching
 */
async function findIntelligentSnomedMappings(namasteCode) {
    try {
        const searchTerms = [
            namasteCode.namaste_display.toLowerCase(),
            namasteCode.namaste_description?.toLowerCase() || '',
            namasteCode.category?.toLowerCase() || ''
        ].join(' ');

        // Search SNOMED CT codes for semantic matches
        const { data: snomedMatches, error } = await supabase
            .from('snomed_ct_codes')
            .select(`
                snomed_ct_code,
                snomed_ct_term,
                snomed_ct_description,
                semantic_tag,
                active
            `)
            .eq('active', true)
            .or(`snomed_ct_term.ilike.%${getKeywords(searchTerms)}%,snomed_ct_description.ilike.%${getKeywords(searchTerms)}%`)
            .limit(3);

        if (error || !snomedMatches?.length) {
            // Fallback to category-based SNOMED CT mapping
            return await getSnomedCategoryBasedMappings(namasteCode.category);
        }

        // Calculate confidence based on text similarity and semantic tags
        return snomedMatches.map(snomedCode => ({
            target_code: snomedCode.snomed_ct_code,
            target_system: 'SNOMED-CT',
            target_term: snomedCode.snomed_ct_term,
            equivalence: 'related',
            confidence_score: calculateSnomedSimilarityConfidence(searchTerms, snomedCode.snomed_ct_term, snomedCode.semantic_tag),
            clinical_evidence: `Auto-mapped SNOMED CT based on semantic similarity: ${namasteCode.category} → ${snomedCode.snomed_ct_term} (${snomedCode.semantic_tag})`,
            mapping_method: 'intelligent_snomed_semantic',
            semantic_tag: snomedCode.semantic_tag
        }));

    } catch (error) {
        console.error('Error in findIntelligentSnomedMappings:', error);
        return [];
    }
}

/**
 * Get SNOMED CT category-based mappings as fallback
 */
async function getSnomedCategoryBasedMappings(category) {
    const snomedCategoryMappings = {
        'constitutional': ['762676003', '766988007'], // Body constitution findings
        'digestive': ['271727006', '386033004'], // Digestive system disorders
        'metabolic': ['75934005', '362969004'], // Metabolic disorders
        'immunity': ['414027002', '276654001'], // Immune system disorders
        'mental': ['74732009', '192080009'], // Mental disorders
        'systemic': ['362965005', '118234003'], // General systemic disorders
        'respiratory': ['50043002', '389087006'], // Respiratory disorders
        'circulatory': ['49601007', '105981003'], // Circulatory disorders
        'musculoskeletal': ['928000', '363172005'] // Musculoskeletal disorders
    };

    const mappedCodes = snomedCategoryMappings[category?.toLowerCase()] || [];
    
    if (mappedCodes.length === 0) return [];

    try {
        const { data: categoryMatches } = await supabase
            .from('snomed_ct_codes')
            .select('snomed_ct_code, snomed_ct_term, semantic_tag, active')
            .in('snomed_ct_code', mappedCodes)
            .eq('active', true);

        return (categoryMatches || []).map(match => ({
            target_code: match.snomed_ct_code,
            target_system: 'SNOMED-CT',
            target_term: match.snomed_ct_term,
            equivalence: 'related',
            confidence_score: 0.75,
            clinical_evidence: `SNOMED CT category-based mapping: ${category} clinical pattern → ${match.snomed_ct_term}`,
            mapping_method: 'snomed_category_based',
            semantic_tag: match.semantic_tag
        }));
    } catch (error) {
        console.error('Error in getSnomedCategoryBasedMappings:', error);
        return [];
    }
}

/**
 * Calculate SNOMED CT similarity confidence with semantic tag weighting
 */
function calculateSnomedSimilarityConfidence(source, target, semanticTag) {
    const sourceWords = source.toLowerCase().split(/\s+/);
    const targetWords = target.toLowerCase().split(/\s+/);
    
    const commonWords = sourceWords.filter(word => 
        targetWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    );
    
    let similarity = commonWords.length / Math.max(sourceWords.length, targetWords.length);
    
    // Boost confidence for relevant semantic tags
    const relevantTags = ['disorder', 'finding', 'procedure', 'substance', 'body structure'];
    if (semanticTag && relevantTags.some(tag => semanticTag.toLowerCase().includes(tag))) {
        similarity *= 1.1; // 10% boost for relevant semantic tags
    }
    
    return Math.min(0.95, Math.max(0.60, similarity));
}

/**
 * Get category-based mappings as fallback
 */
async function getCategoryBasedMappings(category) {
    const categoryMappings = {
        'constitutional': ['SS81.0', 'SS82.0'],
        'digestive': ['SM25.1', 'SM25.2', 'SM20.0'],
        'metabolic': ['SM27.0', 'SP75.2'],
        'immunity': ['SP90.1'],
        'mental': ['SK25.0'],
        'systemic': ['SK25.0', 'SP75.2']
    };

    const mappedCodes = categoryMappings[category?.toLowerCase()] || [];
    
    if (mappedCodes.length === 0) return [];

    const { data: categoryMatches } = await supabase
        .from('icd11_tm2_codes')
        .select('icd11_tm2_code, icd11_tm2_display, equivalence')
        .in('icd11_tm2_code', mappedCodes)
        .eq('is_active', true);

    return (categoryMatches || []).map(match => ({
        target_code: match.icd11_tm2_code,
        target_system: 'ICD-11-TM2',
        equivalence: match.equivalence || 'related',
        confidence_score: 0.75,
        clinical_evidence: `Category-based mapping: ${category} clinical pattern`,
        mapping_method: 'category_based',
        icd11_term: match.icd11_tm2_display
    }));
}

/**
 * Calculate similarity confidence between texts
 */
function calculateSimilarityConfidence(source, target) {
    const sourceWords = source.toLowerCase().split(/\s+/);
    const targetWords = target.toLowerCase().split(/\s+/);
    
    const commonWords = sourceWords.filter(word => 
        targetWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    );
    
    const similarity = commonWords.length / Math.max(sourceWords.length, targetWords.length);
    return Math.min(0.95, Math.max(0.60, similarity));
}

/**
 * Map ICD-11 TM2 codes to NAMASTE equivalents using reverse lookup
 */
async function mapICD11ToNamaste(icd11Code, searchContext = '') {
    try {
        // First check existing mappings
        const { data: existingMappings, error: mappingError } = await supabase
            .from('terminology_mappings')
            .select(`
                ayush_code,
                ayush_term,
                mapping_confidence,
                status,
                equivalence,
                mapping_method,
                clinical_evidence
            `)
            .eq('icd11_code', icd11Code)
            .eq('status', 'approved')
            .order('mapping_confidence', { ascending: false });

        if (!mappingError && existingMappings?.length) {
            // Enrich with NAMASTE details
            const enrichedMappings = await Promise.all(
                existingMappings.map(async (mapping) => {
                    const { data: namasteDetails } = await supabase
                        .from('namaste_codes')
                        .select('namaste_display, namaste_description, category')
                        .eq('namaste_code', mapping.ayush_code)
                        .single();

                    return {
                        source_code: mapping.ayush_code,
                        source_system: 'NAMASTE',
                        equivalence: mapping.equivalence || 'related',
                        confidence_score: mapping.mapping_confidence ?? 0,
                        clinical_evidence: mapping.clinical_evidence || `Curated mapping between ${mapping.ayush_term} and ${icd11Code}`,
                        mapping_method: mapping.mapping_method || 'curated_alignment',
                        namaste_details: namasteDetails || {
                            namaste_display: mapping.ayush_term,
                            namaste_description: null,
                            category: null
                        }
                    };
                })
            );
            return enrichedMappings;
        }

        // If no existing mapping, try intelligent reverse mapping
        const { data: icdDetails } = await supabase
            .from('icd11_tm2_codes')
            .select('icd11_tm2_display, icd11_tm2_description')
            .eq('icd11_tm2_code', icd11Code)
            .single();

        if (!icdDetails) return [];

        // Find potential NAMASTE matches based on ICD-11 description
        const searchTerms = [
            icdDetails.icd11_tm2_display.toLowerCase(),
            icdDetails.icd11_tm2_description?.toLowerCase() || '',
            searchContext.toLowerCase()
        ].join(' ');

        const { data: potentialMatches } = await supabase
            .from('namaste_codes')
            .select(`
                namaste_code,
                namaste_display,
                namaste_description,
                category
            `)
            .eq('is_active', true)
            .or(`namaste_display.ilike.%${getKeywords(searchTerms)}%,namaste_description.ilike.%${getKeywords(searchTerms)}%`)
            .limit(3);

        return (potentialMatches || []).map(match => ({
            source_code: match.namaste_code,
            source_system: 'NAMASTE',
            equivalence: 'related',
            confidence_score: calculateSimilarityConfidence(searchTerms, match.namaste_display),
            clinical_evidence: `Reverse-mapped from ICD-11 TM2: ${icd11Code}`,
            namaste_details: {
                namaste_display: match.namaste_display,
                namaste_description: match.namaste_description,
                category: match.category
            }
        }));

    } catch (error) {
        console.error('Error in mapICD11ToNamaste:', error);
        return [];
    }
}

/**
 * Perform intelligent multi-terminology search with real data
 */
async function performDualCodingSearch(searchTerm, options = {}) {
    const { 
        includeNamaste = true, 
        includeICD11 = true, 
        includeSnomed = true, 
        includeLoinc = true, 
        limit = 20 
    } = options;
    
    try {
        const results = {
            search_term: searchTerm,
            namaste_matches: [],
            icd11_matches: [],
            snomed_matches: [],
            loinc_matches: [],
            multi_terminology_mappings: [],
            confidence: 0,
            search_metadata: {
                timestamp: new Date().toISOString(),
                search_type: 'real_time_multi_terminology_search',
                total_results: 0
            }
        };

        // Find NAMASTE matches if requested
        if (includeNamaste) {
            results.namaste_matches = await findMatchingNamasteCodes(searchTerm, Math.floor(limit / 4));
        }

        // Search ICD-11 TM2 codes directly
        if (includeICD11) {
            const { data: directICD11, error } = await supabase
                .from('icd11_tm2_codes')
                .select(`
                    icd11_tm2_code,
                    icd11_tm2_display,
                    icd11_tm2_description,
                    confidence,
                    mapping_method
                `)
                .eq('is_active', true)
                .or(`icd11_tm2_display.ilike.%${searchTerm}%,icd11_tm2_description.ilike.%${searchTerm}%`)
                .order('confidence', { ascending: false })
                .limit(Math.floor(limit / 4));

            if (!error && directICD11) {
                results.icd11_matches = directICD11.map(icd => ({
                    icd11_code: icd.icd11_tm2_code,
                    icd11_display: icd.icd11_tm2_display,
                    icd11_description: icd.icd11_tm2_description,
                    confidence_score: icd.confidence || 0.8,
                    mapping_method: icd.mapping_method || 'direct_search'
                }));
            }
        }

        // Search SNOMED CT codes directly
        if (includeSnomed) {
            const { data: directSnomed, error: snomedError } = await supabase
                .from('snomed_ct_codes')
                .select(`
                    snomed_ct_code,
                    snomed_ct_term,
                    snomed_ct_description,
                    semantic_tag,
                    active
                `)
                .eq('active', true)
                .or(`snomed_ct_term.ilike.%${searchTerm}%,snomed_ct_description.ilike.%${searchTerm}%`)
                .limit(Math.floor(limit / 4));

            if (!snomedError && directSnomed) {
                results.snomed_matches = directSnomed.map(snomed => ({
                    snomed_code: snomed.snomed_ct_code,
                    snomed_display: snomed.snomed_ct_term,
                    snomed_description: snomed.snomed_ct_description,
                    semantic_tag: snomed.semantic_tag,
                    confidence_score: 0.85,
                    mapping_method: 'direct_search'
                }));
            }
        }

        // Search LOINC codes directly
        if (includeLoinc) {
            const { data: directLoinc, error: loincError } = await supabase
                .from('loinc_codes')
                .select(`
                    loinc_code,
                    loinc_long_name,
                    loinc_short_name,
                    component,
                    property,
                    time_aspect,
                    system,
                    scale_type,
                    method_type,
                    active
                `)
                .eq('active', true)
                .or(`loinc_long_name.ilike.%${searchTerm}%,loinc_short_name.ilike.%${searchTerm}%,component.ilike.%${searchTerm}%`)
                .limit(Math.floor(limit / 4));

            if (!loincError && directLoinc) {
                results.loinc_matches = directLoinc.map(loinc => ({
                    loinc_code: loinc.loinc_code,
                    loinc_display: loinc.loinc_long_name,
                    loinc_short_name: loinc.loinc_short_name,
                    component: loinc.component,
                    property: loinc.property,
                    system: loinc.system,
                    confidence_score: 0.85,
                    mapping_method: 'direct_search'
                }));
            }
        }

        // Create multi-terminology mappings by finding intersections
        results.multi_terminology_mappings = [];
        
        for (const namasteMatch of results.namaste_matches) {
            if (namasteMatch.mappings?.length > 0) {
                namasteMatch.mappings.forEach(mapping => {
                    let crossReference = null;
                    
                    // Find cross-references in direct search results
                    if (mapping.target_system === 'ICD-11-MMS') {
                        crossReference = results.icd11_matches.find(i => i.icd11_code === mapping.target_code);
                    } else if (mapping.target_system === 'SNOMED-CT') {
                        crossReference = results.snomed_matches.find(s => s.snomed_code === mapping.target_code);
                    } else if (mapping.target_system === 'LOINC') {
                        crossReference = results.loinc_matches.find(l => l.loinc_code === mapping.target_code);
                    }

                    results.multi_terminology_mappings.push({
                        namaste_code: namasteMatch.namaste.namaste_code,
                        namaste_display: namasteMatch.namaste.namaste_display,
                        namaste_category: namasteMatch.namaste.category,
                        target_code: mapping.target_code,
                        target_system: mapping.target_system,
                        target_display: crossReference?.snomed_display || crossReference?.icd11_display || crossReference?.loinc_display || mapping.target_term || 'Target Code',
                        equivalence: mapping.equivalence,
                        confidence: mapping.confidence_score,
                        clinical_rationale: mapping.clinical_evidence,
                        mapping_type: mapping.mapping_method,
                        semantic_tag: mapping.semantic_tag || crossReference?.semantic_tag,
                        cross_validated: !!crossReference
                    });
                });
            }
        }

        // Calculate overall confidence and metadata
        const allConfidences = [
            ...results.namaste_matches.map(m => m.mapping_confidence || 0),
            ...results.icd11_matches.map(m => m.confidence_score || 0),
            ...results.snomed_matches.map(m => m.confidence_score || 0),
            ...results.loinc_matches.map(m => m.confidence_score || 0)
        ];
        
        results.confidence = allConfidences.length > 0 ? 
            allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length :
            0;

        results.search_metadata.total_results = 
            results.namaste_matches.length + 
            results.icd11_matches.length + 
            results.snomed_matches.length + 
            results.loinc_matches.length + 
            results.multi_terminology_mappings.length;

        results.search_metadata.terminology_systems = {
            namaste: results.namaste_matches.length,
            icd11: results.icd11_matches.length,
            snomed_ct: results.snomed_matches.length,
            loinc: results.loinc_matches.length,
            cross_mapped: results.multi_terminology_mappings.length
        };

        return results;
        
    } catch (error) {
        console.error('Error in performDualCodingSearch:', error);
        return {
            search_term: searchTerm,
            namaste_matches: [],
            icd11_matches: [],
            snomed_matches: [],
            loinc_matches: [],
            multi_terminology_mappings: [],
            confidence: 0,
            error: error.message,
            search_metadata: {
                timestamp: new Date().toISOString(),
                search_type: 'error',
                total_results: 0
            }
        };
    }
}

/**
 * Create a new mapping between NAMASTE and ICD-11 TM2 codes
 */
async function createMapping(namasteCode, icd11Code, equivalence, confidence, clinicalEvidence) {
    try {
        const [{ data: namasteDetails }, { data: icdDetails }] = await Promise.all([
            supabase
                .from('namaste_codes')
                .select('namaste_display')
                .eq('namaste_code', namasteCode)
                .single(),
            supabase
                .from('icd11_tm2_codes')
                .select('icd11_tm2_display')
                .eq('icd11_tm2_code', icd11Code)
                .single()
        ]);

        const mappingData = {
            ayush_code: namasteCode,
            ayush_term: namasteDetails?.namaste_display || namasteCode,
            icd11_code: icd11Code,
            icd11_term: icdDetails?.icd11_tm2_display || icd11Code,
            mapping_confidence: confidence,
            status: 'approved',
            equivalence,
            mapping_method: 'manual_curation',
            clinical_evidence: clinicalEvidence
        };

        const { data, error } = await supabase
            .from('terminology_mappings')
            .upsert([mappingData], { onConflict: 'ayush_code,icd11_code' })
            .select()
            .single();

        if (error) {
            console.error('Error creating mapping:', error);
            return { success: false, error: error.message };
        }

        return { success: true, mapping: data };

    } catch (error) {
        console.error('Error in createMapping:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get real-time mapping statistics from loaded data
 */
async function getMappingStatistics() {
    try {
        const [
            { count: namasteCount },
            { count: icd11Count },
            { count: snomedCount },
            { count: loincCount },
            { count: mappingCount }
        ] = await Promise.all([
            supabase.from('namaste_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('icd11_tm2_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('snomed_ct_codes').select('*', { count: 'exact', head: true }).eq('active', true),
            supabase.from('loinc_codes').select('*', { count: 'exact', head: true }).eq('active', true),
            supabase.from('terminology_mappings').select('*', { count: 'exact', head: true }).eq('status', 'approved')
        ]);

        // Count mappings by terminology system
        const { data: mappingBreakdown } = await supabase
            .from('terminology_mappings')
            .select('icd11_code, snomed_ct_code, loinc_code')
            .eq('status', 'approved');

        const icd11Mappings = (mappingBreakdown || []).filter(m => m.icd11_code).length;
        const snomedMappings = (mappingBreakdown || []).filter(m => m.snomed_ct_code).length;
        const loincMappings = (mappingBreakdown || []).filter(m => m.loinc_code).length;

        return {
            terminology_systems: {
                namaste_codes_available: namasteCount || 0,
                icd11_tm2_codes_available: icd11Count || 0,
                snomed_ct_codes_available: snomedCount || 0,
                loinc_codes_available: loincCount || 0
            },
            mappings: {
                total_active_mappings: mappingCount || 0,
                icd11_mappings: icd11Mappings,
                snomed_ct_mappings: snomedMappings,
                loinc_mappings: loincMappings
            },
            coverage: {
                icd11_coverage: namasteCount > 0 ? Math.round((icd11Mappings / namasteCount) * 100) : 0,
                snomed_ct_coverage: namasteCount > 0 ? Math.round((snomedMappings / namasteCount) * 100) : 0,
                loinc_coverage: namasteCount > 0 ? Math.round((loincMappings / namasteCount) * 100) : 0,
                overall_coverage: namasteCount > 0 ? Math.round((mappingCount / namasteCount) * 100) : 0
            },
            interoperability: {
                fhir_r4_compliant: true,
                snomed_ct_semantics: snomedCount > 0,
                loinc_semantics: loincCount > 0,
                icd11_mms_support: icd11Count > 0
            },
            system_status: 'operational'
        };

    } catch (error) {
        console.error('Error getting mapping statistics:', error);
        return {
            terminology_systems: {
                namaste_codes_available: 0,
                icd11_tm2_codes_available: 0,
                snomed_ct_codes_available: 0,
                loinc_codes_available: 0
            },
            mappings: {
                total_active_mappings: 0,
                icd11_mappings: 0,
                snomed_ct_mappings: 0,
                loinc_mappings: 0
            },
            coverage: {
                icd11_coverage: 0,
                snomed_ct_coverage: 0,
                loinc_coverage: 0,
                overall_coverage: 0
            },
            interoperability: {
                fhir_r4_compliant: false,
                snomed_ct_semantics: false,
                loinc_semantics: false,
                icd11_mms_support: false
            },
            system_status: 'error',
            error: error.message
        };
    }
}

async function mapNamasteToIcd11(namasteCode, searchContext = '') {
    try {
        const { data: namasteDetails, error: namasteError } = await supabase
            .from('namaste_codes')
            .select('namaste_code, namaste_display, namaste_description, category')
            .eq('namaste_code', namasteCode)
            .single();

        if (namasteError || !namasteDetails) {
            logger.warn(`NAMASTE code ${namasteCode} not found for real-time mapping.`);
            return null;
        }

        const { data: curatedMappings, error: curatedError } = await supabase
            .from('terminology_mappings')
            .select('icd11_code, icd11_term, mapping_confidence, equivalence, mapping_method, clinical_evidence')
            .eq('ayush_code', namasteCode)
            .eq('status', 'approved')
            .order('mapping_confidence', { ascending: false })
            .limit(1);

        if (curatedError) {
            logger.error('Error fetching curated mapping', curatedError);
        }

        const curatedMapping = curatedMappings?.[0];
        if (curatedMapping) {
            return {
                code: curatedMapping.icd11_code,
                display: curatedMapping.icd11_term,
                confidence: curatedMapping.mapping_confidence ?? 0,
                equivalence: curatedMapping.equivalence || 'related',
                source: curatedMapping.mapping_method || 'curated_alignment',
                clinicalEvidence: curatedMapping.clinical_evidence,
                mappedAt: new Date().toISOString()
            };
        }

        const enrichedNamaste = {
            ...namasteDetails,
            namaste_description: [namasteDetails.namaste_description, searchContext]
                .filter(Boolean)
                .join(' ') || namasteDetails.namaste_description
        };

        const intelligentMappings = await findIntelligentICD11Mappings(enrichedNamaste);
        const bestMatch = intelligentMappings?.[0];

        if (bestMatch) {
            const { data: icdDetails } = await supabase
                .from('icd11_tm2_codes')
                .select('icd11_tm2_display')
                .eq('icd11_tm2_code', bestMatch.target_code)
                .single();

            return {
                code: bestMatch.target_code,
                display: bestMatch.icd11_term || icdDetails?.icd11_tm2_display || bestMatch.target_code,
                confidence: bestMatch.confidence_score,
                equivalence: bestMatch.equivalence,
                source: bestMatch.mapping_method || 'intelligent_semantic',
                clinicalEvidence: bestMatch.clinical_evidence,
                mappedAt: new Date().toISOString()
            };
        }

        return null;

    } catch (error) {
        logger.error('Error mapping NAMASTE to ICD-11 TM2', error);
        return null;
    }
}

async function getMappingStats() {
    return getMappingStatistics();
}

const realTimeMappingService = {
    findMatchingNamasteCodes,
    mapICD11ToNamaste,
    performDualCodingSearch,
    createMapping,
    getMappingStatistics,
    mapNamasteToIcd11,
    getMappingStats
};

export {
    findMatchingNamasteCodes,
    mapICD11ToNamaste,
    performDualCodingSearch,
    createMapping,
    getMappingStatistics,
    mapNamasteToIcd11,
    getMappingStats,
    realTimeMappingService
};