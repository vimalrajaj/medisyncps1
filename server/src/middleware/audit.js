/**
 * Audit Trail Middleware
 * Compliant with India's 2016 EHR Standards and Ministry of AYUSH requirements
 */

import { supabase } from '../config/database.js';

// Logger utility (create if not exists)
const logger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || '')
};

/**
 * Comprehensive audit logging middleware
 */
export async function auditLogger(req, res, next) {
    const startTime = Date.now();
    
    // Capture request details for audit
    const auditEntry = {
        timestamp: new Date().toISOString(),
        user_id: req.user?.id,
        abha_id: req.user?.abhaId,
        abha_address: req.user?.abhaAddress,
        healthcare_provider_id: req.user?.healthcareProviderId,
        facility_id: req.user?.facilityId,
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: req.headers['x-session-id'],
        consent_version: req.headers['x-consent-version'],
        data_version: req.headers['x-data-version'],
        abha_consent_id: req.headers['x-abha-consent-id'],
        purpose_of_use: req.headers['x-purpose-of-use'] || 'treatment'
    };

    // Override res.json to capture response details
    const originalJson = res.json;
    res.json = function(data) {
        auditEntry.response_time_ms = Date.now() - startTime;
        auditEntry.status_code = res.statusCode;
        auditEntry.response_size = JSON.stringify(data).length;
        
        // Log specific FHIR operations
        if (req.originalUrl.includes('/fhir/')) {
            auditEntry.fhir_operation = extractFhirOperation(req);
            auditEntry.resource_type = extractResourceType(req, data);
            auditEntry.terminology_system = extractTerminologySystem(req, data);
        }

        // Enhanced audit for Ministry of AYUSH compliance
        if (req.originalUrl.includes('/namaste') || req.originalUrl.includes('/ayush')) {
            auditEntry.ayush_operation = extractAyushOperation(req);
            auditEntry.traditional_medicine_system = extractTradMedSystem(req, data);
        }

        // Store audit entry asynchronously
        storeAuditEntry(auditEntry);
        
        return originalJson.call(this, data);
    };

    next();
}

/**
 * Extract FHIR operation from request
 */
function extractFhirOperation(req) {
    const path = req.originalUrl.toLowerCase();
    
    if (path.includes('$expand')) return 'expand';
    if (path.includes('$translate')) return 'translate';
    if (req.method === 'GET' && path.includes('/codesystem/')) return 'read-codesystem';
    if (req.method === 'GET' && path.includes('/conceptmap/')) return 'read-conceptmap';
    if (req.method === 'GET' && path.includes('/valueset/')) return 'read-valueset';
    if (req.method === 'POST' && path.includes('/bundle')) return 'create-bundle';
    if (path.includes('/metadata')) return 'capabilities';
    if (path.includes('/search')) return 'search';
    
    return 'unknown';
}

/**
 * Extract resource type from request/response
 */
function extractResourceType(req, data) {
    if (data?.resourceType) return data.resourceType;
    
    const path = req.originalUrl.toLowerCase();
    if (path.includes('/codesystem/')) return 'CodeSystem';
    if (path.includes('/conceptmap/')) return 'ConceptMap';
    if (path.includes('/valueset/')) return 'ValueSet';
    if (path.includes('/bundle')) return 'Bundle';
    if (path.includes('/condition')) return 'Condition';
    if (path.includes('/observation')) return 'Observation';
    
    return 'unknown';
}

/**
 * Extract terminology system being accessed
 */
function extractTerminologySystem(req, data) {
    const path = req.originalUrl.toLowerCase();
    const systems = [];
    
    if (path.includes('/namaste-codes') || req.body?.system?.includes('namaste')) {
        systems.push('NAMASTE');
    }
    if (path.includes('/icd11') || req.body?.target?.includes('icd')) {
        systems.push('ICD-11-TM2');
    }
    if (req.body?.system?.includes('snomed') || data?.expansion?.contains?.some(c => c.system?.includes('snomed'))) {
        systems.push('SNOMED-CT');
    }
    if (req.body?.system?.includes('loinc') || data?.expansion?.contains?.some(c => c.system?.includes('loinc'))) {
        systems.push('LOINC');
    }
    
    return systems.join(', ') || 'unknown';
}

/**
 * Extract AYUSH-specific operation
 */
function extractAyushOperation(req) {
    const path = req.originalUrl.toLowerCase();
    
    if (path.includes('/search')) return 'traditional-medicine-search';
    if (path.includes('/mapping')) return 'traditional-modern-mapping';
    if (path.includes('/dual-coding')) return 'dual-coding-generation';
    if (path.includes('/ayurveda')) return 'ayurveda-terminology';
    if (path.includes('/siddha')) return 'siddha-terminology';
    if (path.includes('/unani')) return 'unani-terminology';
    
    return 'general-ayush-operation';
}

/**
 * Extract traditional medicine system
 */
function extractTradMedSystem(req, data) {
    if (data?.concept?.some(c => c.property?.find(p => p.valueString === 'Ayurveda'))) return 'Ayurveda';
    if (data?.concept?.some(c => c.property?.find(p => p.valueString === 'Siddha'))) return 'Siddha';
    if (data?.concept?.some(c => c.property?.find(p => p.valueString === 'Unani'))) return 'Unani';
    
    const querySystem = req.query.ayush_system || req.body?.ayush_system;
    if (querySystem) return querySystem;
    
    return 'mixed';
}

/**
 * Store audit entry in database with error handling
 */
async function storeAuditEntry(auditEntry) {
    try {
        const { error } = await supabase
            .from('fhir_audit_log')
            .insert([auditEntry]);
            
        if (error) {
            logger.error('Failed to store audit entry:', error);
        }
    } catch (error) {
        logger.error('Audit storage exception:', error);
    }
}

/**
 * Privacy audit for sensitive data access
 */
export async function auditDataAccess(userId, resourceType, resourceId, operation, sensitivityLevel = 'normal') {
    try {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            user_id: userId,
            audit_type: 'data_access',
            resource_type: resourceType,
            resource_id: resourceId,
            operation: operation,
            sensitivity_level: sensitivityLevel,
            privacy_impact: calculatePrivacyImpact(resourceType, operation, sensitivityLevel)
        };

        await supabase
            .from('privacy_audit_log')
            .insert([auditEntry]);

    } catch (error) {
        logger.error('Privacy audit failed:', error);
    }
}

/**
 * Calculate privacy impact score for Ministry compliance
 */
function calculatePrivacyImpact(resourceType, operation, sensitivityLevel) {
    const baseScores = {
        'Patient': 5,
        'Condition': 4,
        'Observation': 3,
        'Bundle': 4,
        'CodeSystem': 1,
        'ConceptMap': 1,
        'ValueSet': 1
    };

    const operationMultipliers = {
        'create': 1.5,
        'update': 1.3,
        'delete': 2.0,
        'read': 1.0,
        'search': 1.2,
        'translate': 1.1,
        'expand': 1.0
    };

    const sensitivityMultipliers = {
        'low': 0.8,
        'normal': 1.0,
        'high': 1.5,
        'restricted': 2.0
    };

    const baseScore = baseScores[resourceType] || 2;
    const opMultiplier = operationMultipliers[operation] || 1.0;
    const sensMultiplier = sensitivityMultipliers[sensitivityLevel] || 1.0;

    return Math.round(baseScore * opMultiplier * sensMultiplier);
}

/**
 * Consent verification for data access
 */
export async function verifyConsent(req, res, next) {
    try {
        const consentId = req.headers['x-abha-consent-id'];
        const purposeOfUse = req.headers['x-purpose-of-use'];
        
        if (!consentId && req.originalUrl.includes('/patient/')) {
            return res.status(403).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "forbidden",
                    diagnostics: "Patient data access requires valid ABHA consent ID"
                }]
            });
        }

        // In production, verify consent with ABHA consent manager
        if (consentId) {
            // Mock consent verification - replace with actual ABHA consent API
            const consentValid = await mockConsentVerification(consentId);
            
            if (!consentValid) {
                return res.status(403).json({
                    resourceType: "OperationOutcome",
                    issue: [{
                        severity: "error",
                        code: "forbidden",
                        diagnostics: "Invalid or expired consent for data access"
                    }]
                });
            }
        }

        req.consent = {
            consentId: consentId,
            purposeOfUse: purposeOfUse || 'treatment',
            verified: true
        };

        next();

    } catch (error) {
        logger.error('Consent verification error:', error);
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "exception",
                diagnostics: "Consent verification service error"
            }]
        });
    }
}

/**
 * Mock consent verification (replace with actual ABHA implementation)
 */
async function mockConsentVerification(consentId) {
    // Mock implementation - in production, call ABHA consent manager API
    return consentId && consentId.startsWith('CONSENT-');
}