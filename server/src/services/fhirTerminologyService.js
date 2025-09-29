/**
 * FHIR R4-Compliant Terminology Service
 * Integrates with existing realTimeMappingService for Ministry of AYUSH compliance
 */

import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import * as realTimeMappingService from './realTimeMappingService.js';

/**
 * Generate FHIR R4 CodeSystem for NAMASTE codes
 */
async function generateNamasteCodeSystem() {
    try {
        const { data: namasteCodes, error } = await supabase
            .from('namaste_codes')
            .select('*')
            .eq('is_active', true)
            .order('namaste_code');

        if (error) throw error;

        const codeSystem = {
            resourceType: "CodeSystem",
            id: "namaste-codes",
            meta: {
                versionId: "1",
                lastUpdated: new Date().toISOString(),
                profile: ["http://hl7.org/fhir/StructureDefinition/CodeSystem"]
            },
            url: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes",
            identifier: [{
                use: "official",
                system: "urn:ietf:rfc:3986",
                value: "urn:oid:2.16.356.10.99.4.1.3"
            }],
            version: "2024.1",
            name: "NAMASTECodes",
            title: "National AYUSH Morbidity & Standardized Terminologies Electronic (NAMASTE)",
            status: "active",
            experimental: false,
            date: new Date().toISOString(),
            publisher: "Ministry of AYUSH, Government of India",
            contact: [{
                name: "Ministry of AYUSH",
                telecom: [{
                    system: "url",
                    value: "https://ayush.gov.in"
                }]
            }],
            description: "NAMASTE codes provide standardized terminologies for Ayurveda, Siddha, and Unani traditional medicine systems in India.",
            jurisdiction: [{
                coding: [{
                    system: "urn:iso:std:iso:3166",
                    code: "IN",
                    display: "India"
                }]
            }],
            purpose: "To standardize traditional medicine terminologies for electronic health records and interoperability with international classification systems.",
            copyright: "© 2024 Ministry of AYUSH, Government of India. All rights reserved.",
            caseSensitive: true,
            valueSet: "https://terminology.mohfw.gov.in/fhir/ValueSet/namaste-codes",
            hierarchyMeaning: "grouped-by",
            compositional: false,
            versionNeeded: false,
            content: "complete",
            count: namasteCodes?.length || 0,
            property: [
                {
                    code: "category",
                    uri: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes#category",
                    description: "Clinical category of the traditional medicine concept",
                    type: "string"
                },
                {
                    code: "ayush_system",
                    uri: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes#ayush_system",
                    description: "Traditional medicine system (Ayurveda, Siddha, Unani)",
                    type: "string"
                }
            ],
            concept: (namasteCodes || []).map(code => ({
                code: code.namaste_code,
                display: code.namaste_display,
                definition: code.namaste_description,
                property: [
                    {
                        code: "category",
                        valueString: code.category
                    },
                    {
                        code: "ayush_system", 
                        valueString: code.ayush_system
                    }
                ]
            }))
        };

        return codeSystem;

    } catch (error) {
        logger.error('Error generating NAMASTE CodeSystem:', error);
        throw error;
    }
}

/**
 * Generate FHIR R4 ConceptMap using existing mapping data
 */
async function generateNamasteIcd11ConceptMap() {
    try {
        const { data: mappings, error } = await supabase
            .from('terminology_mappings')
            .select(`
                ayush_code,
                ayush_term,
                icd11_code,
                icd11_term,
                snomed_ct_code,
                snomed_ct_term,
                loinc_code,
                loinc_term,
                mapping_confidence,
                equivalence,
                mapping_method,
                clinical_evidence
            `)
            .eq('status', 'approved')
            .not('icd11_code', 'is', null);

        if (error) throw error;

        const conceptMap = {
            resourceType: "ConceptMap",
            id: "namaste-to-icd11-tm2",
            meta: {
                versionId: "1",
                lastUpdated: new Date().toISOString(),
                profile: ["http://hl7.org/fhir/StructureDefinition/ConceptMap"]
            },
            url: "https://terminology.mohfw.gov.in/fhir/ConceptMap/namaste-to-icd11-tm2",
            identifier: [{
                use: "official",
                system: "urn:ietf:rfc:3986",
                value: "urn:oid:2.16.356.10.99.4.2.1"
            }],
            version: "2024.1",
            name: "NAMASTEToICD11TM2ConceptMap",
            title: "NAMASTE to ICD-11 Traditional Medicine Module 2 Concept Map",
            status: "active",
            experimental: false,
            date: new Date().toISOString(),
            publisher: "Ministry of AYUSH, Government of India",
            contact: [{
                name: "Ministry of AYUSH",
                telecom: [{
                    system: "url",
                    value: "https://ayush.gov.in"
                }]
            }],
            description: "Concept map defining equivalences between NAMASTE traditional medicine codes and ICD-11 Traditional Medicine Module 2 (TM2) codes, enhanced with SNOMED CT and LOINC bridge semantics.",
            jurisdiction: [{
                coding: [{
                    system: "urn:iso:std:iso:3166",
                    code: "IN",
                    display: "India"
                }]
            }],
            purpose: "Enable interoperability between Indian traditional medicine coding (NAMASTE) and international health information systems using ICD-11 TM2, with SNOMED CT and LOINC semantic bridges.",
            copyright: "© 2024 Ministry of AYUSH & WHO. Mapping content subject to ICD-11 license terms.",
            sourceUri: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes",
            targetUri: "http://id.who.int/icd/release/11/2024-01/mms",
            group: [{
                source: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes",
                target: "http://id.who.int/icd/release/11/2024-01/mms",
                element: (mappings || []).map(mapping => ({
                    code: mapping.ayush_code,
                    display: mapping.ayush_term,
                    target: [{
                        code: mapping.icd11_code,
                        display: mapping.icd11_term,
                        equivalence: mapping.equivalence || "relatedto",
                        comment: mapping.clinical_evidence,
                        product: [
                            // SNOMED CT bridge
                            ...(mapping.snomed_ct_code ? [{
                                property: "http://snomed.info/sct",
                                value: mapping.snomed_ct_code,
                                display: mapping.snomed_ct_term
                            }] : []),
                            // LOINC bridge
                            ...(mapping.loinc_code ? [{
                                property: "http://loinc.org",
                                value: mapping.loinc_code,
                                display: mapping.loinc_term
                            }] : []),
                            // Confidence score
                            {
                                property: "http://terminology.mohfw.gov.in/fhir/CodeSystem/mapping-confidence",
                                value: (mapping.mapping_confidence || 0).toString()
                            }
                        ]
                    }]
                }))
            }]
        };

        return conceptMap;

    } catch (error) {
        logger.error('Error generating ConceptMap:', error);
        throw error;
    }
}

/**
 * FHIR R4 ValueSet expansion using existing search logic
 */
async function expandValueSet(params = {}) {
    try {
        const { 
            filter = '', 
            count = 20, 
            offset = 0,
            includeDesignations = true,
            activeOnly = true 
        } = params;

        // Use existing real-time mapping service
        const searchResults = await realTimeMappingService.findMatchingNamasteCodes(filter, count);

        const valueSet = {
            resourceType: "ValueSet",
            id: "namaste-codes-expanded",
            meta: {
                lastUpdated: new Date().toISOString()
            },
            url: "https://terminology.mohfw.gov.in/fhir/ValueSet/namaste-codes",
            version: "2024.1",
            name: "NAMASTECodesExpanded",
            title: "NAMASTE Codes - Expanded",
            status: "active",
            experimental: false,
            date: new Date().toISOString(),
            publisher: "Ministry of AYUSH, Government of India",
            expansion: {
                identifier: `expansion-${Date.now()}`,
                timestamp: new Date().toISOString(),
                total: searchResults.length,
                offset: offset,
                parameter: [
                    {
                        name: "filter",
                        valueString: filter
                    },
                    {
                        name: "count",
                        valueInteger: count
                    }
                ],
                contains: searchResults.map(result => ({
                    system: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes",
                    code: result.namaste.namaste_code,
                    display: result.namaste.namaste_display,
                    designation: includeDesignations ? [
                        {
                            language: "en",
                            use: {
                                system: "http://snomed.info/sct",
                                code: "900000000000013009",
                                display: "Synonym"
                            },
                            value: result.namaste.namaste_description
                        }
                    ] : undefined,
                    property: [
                        {
                            code: "category",
                            valueString: result.namaste.category
                        },
                        {
                            code: "ayush_system",
                            valueString: result.namaste.ayush_system
                        },
                        {
                            code: "mapping_confidence",
                            valueDecimal: result.mapping_confidence
                        }
                    ]
                }))
            }
        };

        return valueSet;

    } catch (error) {
        logger.error('Error expanding ValueSet:', error);
        throw error;
    }
}

/**
 * FHIR R4 $translate operation using existing mapping logic
 */
async function translateConcept(params = {}) {
    try {
        const {
            system,
            code,
            version,
            source,
            target,
            conceptMapVersion,
            reverse = false
        } = params;

        let translationResults = [];

        if (!reverse && system === "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes") {
            // NAMASTE to ICD-11 TM2 translation using existing service
            const mappingResults = await realTimeMappingService.findMatchingNamasteCodes(code, 10);
            const matchingResult = mappingResults.find(r => r.namaste.namaste_code === code);
            
            if (matchingResult && matchingResult.mappings) {
                translationResults = matchingResult.mappings
                    .filter(m => m.target_system === 'ICD-11-MMS')
                    .map(mapping => ({
                        equivalence: mapping.equivalence || "relatedto",
                        concept: {
                            system: "http://id.who.int/icd/release/11/2024-01/mms",
                            code: mapping.target_code,
                            display: mapping.target_term
                        },
                        product: [{
                            property: "confidence",
                            value: mapping.confidence_score.toString()
                        }]
                    }));
            }
        }

        const parameters = {
            resourceType: "Parameters",
            parameter: [
                {
                    name: "result",
                    valueBoolean: !!translationResults?.length
                }
            ]
        };

        if (translationResults?.length) {
            translationResults.forEach((result) => {
                parameters.parameter.push({
                    name: "match",
                    part: [
                        {
                            name: "equivalence",
                            valueCode: result.equivalence
                        },
                        {
                            name: "concept",
                            valueCoding: result.concept
                        },
                        ...(result.product || []).map(product => ({
                            name: "product",
                            part: [
                                {
                                    name: "property",
                                    valueCode: product.property
                                },
                                {
                                    name: "value",
                                    valueString: product.value
                                }
                            ]
                        }))
                    ]
                });
            });
        }

        return parameters;

    } catch (error) {
        logger.error('Error in translate operation:', error);
        throw error;
    }
}

/**
 * Process FHIR Bundle with dual coding using existing mapping service
 */
async function processFhirBundle(bundle) {
    try {
        if (bundle.resourceType !== "Bundle") {
            throw new Error("Resource must be a FHIR Bundle");
        }

        const processedEntries = [];
        const auditEntries = [];

        for (const entry of bundle.entry || []) {
            const resource = entry.resource;
            
            if (resource.resourceType === "Condition" || resource.resourceType === "Observation") {
                // Process codes for dual coding using existing service
                if (resource.code?.coding) {
                    const enhancedCodings = [];
                    
                    for (const coding of resource.code.coding) {
                        enhancedCodings.push(coding);
                        
                        // If NAMASTE code, add ICD-11 TM2 equivalent using existing service
                        if (coding.system === "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes") {
                            const mappingResults = await realTimeMappingService.findMatchingNamasteCodes(coding.code, 5);
                            const matchingResult = mappingResults.find(r => r.namaste.namaste_code === coding.code);
                            
                            if (matchingResult && matchingResult.mappings) {
                                // Add ICD-11 mappings
                                const icd11Mappings = matchingResult.mappings.filter(m => m.target_system === 'ICD-11-MMS');
                                for (const mapping of icd11Mappings) {
                                    enhancedCodings.push({
                                        system: "http://id.who.int/icd/release/11/2024-01/mms",
                                        code: mapping.target_code,
                                        display: mapping.target_term,
                                        extension: [{
                                            url: "http://hl7.org/fhir/StructureDefinition/coding-mapping-confidence",
                                            valueDecimal: mapping.confidence_score
                                        }]
                                    });
                                }
                                
                                // Add SNOMED CT bridge codes
                                const snomedMappings = matchingResult.mappings.filter(m => m.target_system === 'SNOMED-CT');
                                for (const mapping of snomedMappings) {
                                    enhancedCodings.push({
                                        system: "http://snomed.info/sct",
                                        code: mapping.target_code,
                                        display: mapping.target_term,
                                        extension: [{
                                            url: "http://terminology.mohfw.gov.in/fhir/StructureDefinition/bridge-terminology",
                                            valueBoolean: true
                                        }]
                                    });
                                }
                            }
                        }
                    }
                    
                    resource.code.coding = enhancedCodings;
                }
            }
            
            processedEntries.push({
                ...entry,
                resource: resource
            });
            
            // Create audit entry
            auditEntries.push({
                timestamp: new Date().toISOString(),
                resource_type: resource.resourceType,
                resource_id: resource.id,
                operation: "create",
                user_id: bundle.meta?.tag?.find(t => t.system === "http://terminology.hl7.org/CodeSystem/v3-ActCode")?.code,
                dual_coding_applied: resource.code?.coding?.length > 1
            });
        }

        // Store audit entries
        if (auditEntries.length > 0) {
            await supabase.from('fhir_audit_log').insert(auditEntries);
        }

        const processedBundle = {
            ...bundle,
            entry: processedEntries,
            meta: {
                ...bundle.meta,
                lastUpdated: new Date().toISOString(),
                tag: [
                    ...(bundle.meta?.tag || []),
                    {
                        system: "https://terminology.mohfw.gov.in/fhir/CodeSystem/processing-status",
                        code: "dual-coded",
                        display: "Processed with dual NAMASTE-ICD11 coding using SNOMED CT and LOINC bridges"
                    }
                ]
            }
        };

        return {
            success: true,
            bundle: processedBundle,
            statistics: {
                total_entries: processedEntries.length,
                dual_coded_entries: auditEntries.filter(a => a.dual_coding_applied).length,
                audit_entries_created: auditEntries.length
            }
        };

    } catch (error) {
        logger.error('Error processing FHIR Bundle:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export {
    generateNamasteCodeSystem,
    generateNamasteIcd11ConceptMap,
    expandValueSet,
    translateConcept,
    processFhirBundle
};