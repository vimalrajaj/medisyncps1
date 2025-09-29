/**
 * FHIR R4 Terminology Service Routes
 * Ministry of AYUSH compliant implementation with OAuth 2.0 + ABHA authentication
 */

import express from 'express';
import { 
    generateNamasteCodeSystem,
    generateNamasteIcd11ConceptMap,
    expandValueSet,
    translateConcept,
    processFhirBundle
} from '../services/fhirTerminologyService.js';
import { 
    authenticateOAuth2, 
    requireRole, 
    requireScope, 
    requireAyushProvider 
} from '../middleware/auth.js';
import { auditLogger, verifyConsent } from '../middleware/audit.js';

const router = express.Router();

// Apply OAuth 2.0 + ABHA authentication and audit logging to all routes
router.use(authenticateOAuth2);
router.use(auditLogger);

/**
 * GET /fhir/CodeSystem/namaste-codes
 * Returns FHIR R4 CodeSystem for NAMASTE codes
 * Requires: terminology.read scope
 */
router.get('/CodeSystem/namaste-codes', 
    requireScope('terminology.read'),
    async (req, res) => {
        try {
            const codeSystem = await generateNamasteCodeSystem();
            res.set('Content-Type', 'application/fhir+json');
            res.json(codeSystem);
        } catch (error) {
            res.status(500).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "processing",
                    diagnostics: `Error generating NAMASTE CodeSystem: ${error.message}`
                }]
            });
        }
    }
);

/**
 * GET /fhir/ConceptMap/namaste-to-icd11-tm2
 * Returns FHIR R4 ConceptMap for NAMASTE to ICD-11 TM2
 * Requires: terminology.read scope
 */
router.get('/ConceptMap/namaste-to-icd11-tm2', 
    requireScope('terminology.read'),
    async (req, res) => {
        try {
            const conceptMap = await generateNamasteIcd11ConceptMap();
            res.set('Content-Type', 'application/fhir+json');
            res.json(conceptMap);
        } catch (error) {
            res.status(500).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "processing",
                    diagnostics: `Error generating ConceptMap: ${error.message}`
                }]
            });
        }
    }
);

/**
 * GET /fhir/ValueSet/namaste-codes/$expand
 * FHIR ValueSet expansion for auto-complete functionality
 * Requires: terminology.read scope, AYUSH provider role
 */
router.get('/ValueSet/namaste-codes/$expand', 
    requireScope('terminology.read'),
    requireAyushProvider,
    async (req, res) => {
        try {
            const params = {
                filter: req.query.filter || '',
                count: parseInt(req.query.count) || 20,
                offset: parseInt(req.query.offset) || 0,
                includeDesignations: req.query.includeDesignations !== 'false',
                activeOnly: req.query.activeOnly !== 'false'
            };

            const valueSet = await expandValueSet(params);
            res.set('Content-Type', 'application/fhir+json');
            res.json(valueSet);
        } catch (error) {
            res.status(500).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "processing",
                    diagnostics: `Error expanding ValueSet: ${error.message}`
                }]
            });
        }
    }
);

/**
 * GET /fhir/ConceptMap/namaste-to-icd11-tm2/$translate
 * FHIR translate operation for code mapping
 * Requires: terminology.read scope, AYUSH provider role
 */
router.get('/ConceptMap/namaste-to-icd11-tm2/$translate', 
    requireScope('terminology.read'),
    requireAyushProvider,
    async (req, res) => {
        try {
            const params = {
                system: req.query.system,
                code: req.query.code,
                version: req.query.version,
                source: req.query.source,
                target: req.query.target,
                conceptMapVersion: req.query.conceptMapVersion,
                reverse: req.query.reverse === 'true'
            };

            // Validate required parameters
            if (!params.system || !params.code) {
                return res.status(400).json({
                    resourceType: "OperationOutcome",
                    issue: [{
                        severity: "error",
                        code: "required",
                        diagnostics: "Parameters 'system' and 'code' are required for translation"
                    }]
                });
            }

            const result = await translateConcept(params);
            res.set('Content-Type', 'application/fhir+json');
            res.json(result);
        } catch (error) {
            res.status(500).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "processing",
                    diagnostics: `Error in translate operation: ${error.message}`
                }]
            });
        }
    }
);

/**
 * POST /fhir/Bundle
 * Process FHIR Bundle with dual coding support
 * Requires: bundle.create scope, healthcare provider role, consent verification
 */
router.post('/Bundle', 
    requireScope('bundle.create'),
    requireRole('healthcare_provider'),
    verifyConsent,
    async (req, res) => {
        try {
            if (!req.body || req.body.resourceType !== 'Bundle') {
                return res.status(400).json({
                    resourceType: "OperationOutcome",
                    issue: [{
                        severity: "error",
                        code: "invalid",
                        diagnostics: "Request body must contain a valid FHIR Bundle resource"
                    }]
                });
            }

            const result = await processFhirBundle(req.body);
            
            if (result.success) {
                res.status(201)
                   .set('Content-Type', 'application/fhir+json')
                   .json(result.bundle);
            } else {
                res.status(422).json({
                    resourceType: "OperationOutcome",
                    issue: [{
                        severity: "error",
                        code: "processing",
                        diagnostics: result.error
                    }]
                });
            }
        } catch (error) {
            res.status(500).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "exception",
                    diagnostics: `Bundle processing error: ${error.message}`
                }]
            });
        }
    }
);

/**
 * GET /fhir/metadata
 * FHIR Capability Statement with ABHA authentication details
 */
router.get('/metadata', (req, res) => {
    const capabilityStatement = {
        resourceType: "CapabilityStatement",
        id: "namaste-terminology-service",
        url: "https://terminology.mohfw.gov.in/fhir/metadata",
        version: "2024.1",
        name: "NAMASTETerminologyService",
        title: "NAMASTE Terminology Service - Ministry of AYUSH",
        status: "active",
        experimental: false,
        date: new Date().toISOString(),
        publisher: "Ministry of AYUSH, Government of India",
        contact: [{
            name: "Ministry of AYUSH",
            telecom: [{
                system: "url",
                value: "https://ayush.gov.in"
            }, {
                system: "email",
                value: "terminology@ayush.gov.in"
            }]
        }],
        description: "FHIR R4 Terminology Service for NAMASTE codes with ICD-11 TM2 mapping support, integrated with ABHA authentication and enhanced with SNOMED CT and LOINC bridge semantics.",
        jurisdiction: [{
            coding: [{
                system: "urn:iso:std:iso:3166",
                code: "IN",
                display: "India"
            }]
        }],
        purpose: "Enable interoperable traditional medicine coding for Electronic Medical Records in India, supporting dual coding between NAMASTE and ICD-11 TM2 with semantic bridges.",
        copyright: "© 2024 Ministry of AYUSH, Government of India. Subject to license terms.",
        kind: "instance",
        software: {
            name: "NAMASTE Terminology Service",
            version: "1.0.0",
            releaseDate: "2024-01-01"
        },
        implementation: {
            description: "Ministry of AYUSH NAMASTE to ICD-11 TM2 Terminology Service with ABHA integration",
            url: "https://terminology.mohfw.gov.in/fhir"
        },
        fhirVersion: "4.0.1",
        format: ["application/fhir+json", "application/fhir+xml"],
        patchFormat: ["application/json-patch+json"],
        rest: [{
            mode: "server",
            documentation: "FHIR R4 terminology service with OAuth 2.0 + ABHA authentication",
            security: {
                cors: true,
                service: [{
                    coding: [{
                        system: "http://terminology.hl7.org/CodeSystem/restful-security-service",
                        code: "OAuth",
                        display: "OAuth2 using ABHA profile"
                    }]
                }],
                description: "OAuth 2.0 with ABHA token validation for healthcare providers",
                extension: [{
                    url: "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris",
                    extension: [{
                        url: "token",
                        valueUri: "https://abhaaddress.abdm.gov.in/api/v1/auth/token"
                    }, {
                        url: "authorize",
                        valueUri: "https://abhaaddress.abdm.gov.in/api/v1/auth/authorize"
                    }]
                }]
            },
            resource: [
                {
                    type: "CodeSystem",
                    supportedProfile: ["http://hl7.org/fhir/StructureDefinition/CodeSystem"],
                    interaction: [
                        { code: "read" },
                        { code: "search-type" }
                    ],
                    searchParam: [
                        {
                            name: "url",
                            type: "uri",
                            documentation: "Canonical URL for the code system"
                        },
                        {
                            name: "version",
                            type: "token",
                            documentation: "Business version of the code system"
                        },
                        {
                            name: "name",
                            type: "string",
                            documentation: "Computer-friendly name for the code system"
                        }
                    ]
                },
                {
                    type: "ConceptMap",
                    supportedProfile: ["http://hl7.org/fhir/StructureDefinition/ConceptMap"],
                    interaction: [
                        { code: "read" },
                        { code: "search-type" }
                    ],
                    operation: [{
                        name: "translate",
                        definition: "http://hl7.org/fhir/OperationDefinition/ConceptMap-translate",
                        documentation: "Translate a code from NAMASTE to ICD-11 TM2 with SNOMED CT and LOINC bridges"
                    }]
                },
                {
                    type: "ValueSet",
                    supportedProfile: ["http://hl7.org/fhir/StructureDefinition/ValueSet"],
                    interaction: [
                        { code: "read" },
                        { code: "search-type" }
                    ],
                    operation: [{
                        name: "expand",
                        definition: "http://hl7.org/fhir/OperationDefinition/ValueSet-expand",
                        documentation: "Expand NAMASTE ValueSet with auto-complete functionality"
                    }]
                },
                {
                    type: "Bundle",
                    supportedProfile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
                    interaction: [
                        { code: "create" }
                    ],
                    documentation: "Process FHIR Bundles with automatic dual coding (NAMASTE + ICD-11 TM2)"
                }
            ]
        }]
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(capabilityStatement);
});

export default router;