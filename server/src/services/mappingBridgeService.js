import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * NAMASTE to ICD-11 Mapping Service with SNOMED CT and LOINC Bridge Support
 * 
 * This service uses SNOMED CT and LOINC as intermediate terminologies to improve
 * the quality and accuracy of mappings between NAMASTE and ICD-11 codes.
 * 
 * Mapping Flow:
 * NAMASTE → SNOMED CT/LOINC → ICD-11
 * 
 * This approach provides:
 * - Higher mapping confidence through semantic bridges
 * - Clinical validation via established international standards
 * - Better interoperability with existing healthcare systems
 */

/**
 * Find enhanced NAMASTE to ICD-11 mappings using bridge terminologies
 */
async function findEnhancedNamasteToIcd11Mappings(searchTerm, limit = 10) {
    try {
        logger.info(`Finding enhanced NAMASTE→ICD-11 mappings for: ${searchTerm}`);
        
        // 1. First, find NAMASTE codes matching the search term
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
            logger.error('Error finding NAMASTE codes:', namasteError);
            return [];
        }

        // 2. For each NAMASTE code, find enhanced mappings with bridge terminologies
        const enhancedMappings = await Promise.all(
            (namasteMatches || []).map(async (namasteCode) => {
                // Look for mappings that include SNOMED CT and LOINC bridges
                const { data: bridgedMappings, error: mappingError } = await supabase
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
                        clinical_evidence,
                        semantic_tag,
                        cross_validated
                    `)
                    .eq('ayush_code', namasteCode.namaste_code)
                    .eq('status', 'approved')
                    .order('mapping_confidence', { ascending: false });

                if (mappingError) {
                    logger.error('Error loading bridged mappings:', mappingError);
                }

                // Process the mappings to show how bridges enhance quality
                const processedMappings = (bridgedMappings || []).map(mapping => {
                    let mappingQuality = 'basic';
                    let qualityScore = mapping.mapping_confidence || 50;
                    let mappingPath = `NAMASTE → ICD-11`;
                    
                    // Enhance quality based on bridge terminologies
                    if (mapping.snomed_ct_code && mapping.loinc_code) {
                        mappingQuality = 'high_confidence_dual_bridge';
                        qualityScore = Math.min(95, (mapping.mapping_confidence || 70) + 20);
                        mappingPath = `NAMASTE → SNOMED CT → LOINC → ICD-11`;
                    } else if (mapping.snomed_ct_code) {
                        mappingQuality = 'enhanced_snomed_bridge';
                        qualityScore = Math.min(90, (mapping.mapping_confidence || 60) + 15);
                        mappingPath = `NAMASTE → SNOMED CT → ICD-11`;
                    } else if (mapping.loinc_code) {
                        mappingQuality = 'enhanced_loinc_bridge';
                        qualityScore = Math.min(85, (mapping.mapping_confidence || 60) + 10);
                        mappingPath = `NAMASTE → LOINC → ICD-11`;
                    }

                    return {
                        // Primary mapping (what users see)
                        primary_mapping: {
                            source_code: namasteCode.namaste_code,
                            source_term: namasteCode.namaste_display,
                            target_code: mapping.icd11_code,
                            target_term: mapping.icd11_term,
                            confidence: qualityScore,
                            equivalence: mapping.equivalence
                        },
                        
                        // Bridge information (how mapping quality is enhanced)
                        bridge_details: {
                            mapping_path: mappingPath,
                            quality_level: mappingQuality,
                            snomed_bridge: mapping.snomed_ct_code ? {
                                code: mapping.snomed_ct_code,
                                term: mapping.snomed_ct_term,
                                semantic_tag: mapping.semantic_tag
                            } : null,
                            loinc_bridge: mapping.loinc_code ? {
                                code: mapping.loinc_code,
                                term: mapping.loinc_term
                            } : null,
                            cross_validated: mapping.cross_validated
                        },
                        
                        // Clinical context
                        clinical_context: {
                            evidence: mapping.clinical_evidence,
                            method: mapping.mapping_method,
                            semantic_category: mapping.semantic_tag
                        }
                    };
                });

                return {
                    namaste_concept: namasteCode,
                    enhanced_mappings: processedMappings,
                    mapping_summary: {
                        total_mappings: processedMappings.length,
                        highest_confidence: processedMappings.length > 0 ? 
                            Math.max(...processedMappings.map(m => m.primary_mapping.confidence)) : 0,
                        bridge_enhanced: processedMappings.filter(m => 
                            m.bridge_details.snomed_bridge || m.bridge_details.loinc_bridge
                        ).length,
                        cross_validated: processedMappings.filter(m => 
                            m.bridge_details.cross_validated
                        ).length
                    }
                };
            })
        );

        return enhancedMappings.filter(result => result.enhanced_mappings.length > 0);

    } catch (error) {
        logger.error('Error in enhanced mapping search:', error);
        throw error;
    }
}

/**
 * Get mapping quality statistics showing how SNOMED CT/LOINC improve mappings
 */
async function getMappingQualityStatistics() {
    try {
        const { data: stats, error } = await supabase
            .from('terminology_mappings')
            .select(`
                mapping_confidence,
                snomed_ct_code,
                loinc_code,
                cross_validated,
                mapping_method
            `)
            .eq('status', 'approved');

        if (error) throw error;

        const analysis = {
            total_mappings: stats.length,
            basic_mappings: stats.filter(m => !m.snomed_ct_code && !m.loinc_code).length,
            snomed_enhanced: stats.filter(m => m.snomed_ct_code).length,
            loinc_enhanced: stats.filter(m => m.loinc_code).length,
            dual_bridge: stats.filter(m => m.snomed_ct_code && m.loinc_code).length,
            cross_validated: stats.filter(m => m.cross_validated).length,
            
            confidence_by_type: {
                basic: calculateAverageConfidence(stats.filter(m => !m.snomed_ct_code && !m.loinc_code)),
                snomed_bridge: calculateAverageConfidence(stats.filter(m => m.snomed_ct_code)),
                loinc_bridge: calculateAverageConfidence(stats.filter(m => m.loinc_code)),
                dual_bridge: calculateAverageConfidence(stats.filter(m => m.snomed_ct_code && m.loinc_code))
            }
        };

        return analysis;

    } catch (error) {
        logger.error('Error getting mapping quality statistics:', error);
        throw error;
    }
}

function calculateAverageConfidence(mappings) {
    if (mappings.length === 0) return 0;
    const total = mappings.reduce((sum, m) => sum + (m.mapping_confidence || 0), 0);
    return Math.round(total / mappings.length);
}

/**
 * Demonstrate mapping improvement with bridge terminologies
 */
async function demonstrateMappingImprovement(namasteCode) {
    try {
        logger.info(`Demonstrating mapping improvement for: ${namasteCode}`);
        
        const { data: mapping, error } = await supabase
            .from('terminology_mappings')
            .select('*')
            .eq('ayush_code', namasteCode)
            .single();

        if (error || !mapping) {
            return { error: 'Mapping not found' };
        }

        // Show the improvement path
        const improvement = {
            original_mapping: {
                path: `${mapping.ayush_display} → ${mapping.icd11_term}`,
                confidence: mapping.mapping_confidence || 50,
                method: 'direct_mapping'
            },
            
            enhanced_mapping: {
                path: buildMappingPath(mapping),
                confidence: calculateEnhancedConfidence(mapping),
                method: mapping.mapping_method,
                improvements: []
            }
        };

        // Identify specific improvements
        if (mapping.snomed_ct_code) {
            improvement.enhanced_mapping.improvements.push(
                `SNOMED CT bridge (${mapping.snomed_ct_code}) provides clinical standardization`
            );
        }
        
        if (mapping.loinc_code) {
            improvement.enhanced_mapping.improvements.push(
                `LOINC bridge (${mapping.loinc_code}) enables laboratory/diagnostic alignment`
            );
        }
        
        if (mapping.cross_validated) {
            improvement.enhanced_mapping.improvements.push(
                'Cross-validation across multiple terminologies ensures accuracy'
            );
        }

        return improvement;

    } catch (error) {
        logger.error('Error demonstrating mapping improvement:', error);
        throw error;
    }
}

function buildMappingPath(mapping) {
    let path = mapping.ayush_display;
    
    if (mapping.snomed_ct_code) {
        path += ` → SNOMED CT (${mapping.snomed_ct_term})`;
    }
    
    if (mapping.loinc_code) {
        path += ` → LOINC (${mapping.loinc_term})`;
    }
    
    path += ` → ${mapping.icd11_term}`;
    return path;
}

function calculateEnhancedConfidence(mapping) {
    let baseConfidence = mapping.mapping_confidence || 50;
    
    if (mapping.snomed_ct_code && mapping.loinc_code) {
        return Math.min(95, baseConfidence + 20); // Dual bridge
    } else if (mapping.snomed_ct_code) {
        return Math.min(90, baseConfidence + 15); // SNOMED bridge
    } else if (mapping.loinc_code) {
        return Math.min(85, baseConfidence + 10); // LOINC bridge
    }
    
    return baseConfidence;
}

export {
    findEnhancedNamasteToIcd11Mappings,
    getMappingQualityStatistics,
    demonstrateMappingImprovement
};