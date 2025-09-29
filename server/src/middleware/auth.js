/**
 * OAuth 2.0 Authentication with ABHA Integration
 * Compliant with India's 2016 EHR Standards
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

// Logger utility (create if not exists)
const logger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || '')
};

// ABHA Configuration (replace with actual ABHA endpoints)
const ABHA_CONFIG = {
    tokenValidationUrl: process.env.ABHA_TOKEN_VALIDATION_URL || 'https://abhaaddress.abdm.gov.in/api/v1/auth/verify',
    clientId: process.env.ABHA_CLIENT_ID,
    clientSecret: process.env.ABHA_CLIENT_SECRET,
    scope: ['terminology.read', 'terminology.write', 'bundle.create', 'bundle.read']
};

/**
 * OAuth 2.0 middleware with ABHA token validation
 */
export async function authenticateOAuth2(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "login",
                    diagnostics: "Authorization header with Bearer token required for ABHA authentication"
                }]
            });
        }

        const token = authHeader.substring(7);
        
        // Validate ABHA token
        const tokenValidation = await validateABHAToken(token);
        
        if (!tokenValidation.valid) {
            return res.status(401).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "invalid",
                    diagnostics: `Invalid or expired ABHA token: ${tokenValidation.error}`
                }]
            });
        }

        // Add user context to request for audit trails
        req.user = {
            id: tokenValidation.userId,
            abhaId: tokenValidation.abhaId,
            abhaAddress: tokenValidation.abhaAddress,
            roles: tokenValidation.roles || [],
            scope: tokenValidation.scope || [],
            healthcareProviderId: tokenValidation.healthcareProviderId,
            facilityId: tokenValidation.facilityId
        };

        // Log authentication success for audit
        logger.info('ABHA authentication successful', {
            userId: req.user.id,
            abhaId: req.user.abhaId,
            endpoint: req.originalUrl,
            ip: req.ip
        });

        next();

    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "exception",
                diagnostics: "Authentication service error"
            }]
        });
    }
}

/**
 * Validate ABHA token with actual ABHA service
 */
async function validateABHAToken(token) {
    try {
        // For demo purposes, we'll use a mock validation
        // In production, replace with actual ABHA API calls
        
        if (process.env.NODE_ENV === 'development') {
            return mockABHAValidation(token);
        }

        // Production ABHA validation
        const response = await axios.post(ABHA_CONFIG.tokenValidationUrl, {
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': ABHA_CONFIG.clientId,
                'X-Client-Secret': ABHA_CONFIG.clientSecret
            },
            timeout: 5000
        });

        if (response.status === 200 && response.data.valid) {
            return {
                valid: true,
                userId: response.data.user_id,
                abhaId: response.data.abha_id,
                abhaAddress: response.data.abha_address,
                roles: response.data.roles || ['healthcare_provider'],
                scope: response.data.scope?.split(' ') || ABHA_CONFIG.scope,
                healthcareProviderId: response.data.healthcare_provider_id,
                facilityId: response.data.facility_id
            };
        }

        return { 
            valid: false, 
            error: response.data.error || 'Token validation failed' 
        };

    } catch (error) {
        logger.error('ABHA token validation error:', error);
        return { 
            valid: false, 
            error: error.message || 'Token validation service unavailable' 
        };
    }
}

/**
 * Mock ABHA validation for development/demo
 */
function mockABHAValidation(token) {
    try {
        const decoded = jwt.decode(token);
        
        if (!decoded) {
            return { valid: false, error: 'Invalid token format' };
        }

        // Mock ABHA validation - accepts any valid JWT structure
        return {
            valid: true,
            userId: decoded.sub || 'demo-user-123',
            abhaId: decoded.abha_id || '14-1234-5678-9012',
            abhaAddress: decoded.abha_address || 'demo.user@sbx',
            roles: decoded.roles || ['healthcare_provider', 'ayush_practitioner'],
            scope: decoded.scope?.split(' ') || ['terminology.read', 'terminology.write', 'bundle.create'],
            healthcareProviderId: decoded.hpr_id || 'HPR-12345',
            facilityId: decoded.facility_id || 'FAC-67890'
        };

    } catch (error) {
        logger.error('Mock token validation error:', error);
        return { valid: false, error: 'Token parsing failed' };
    }
}

/**
 * Role-based access control for Ministry of AYUSH
 */
export function requireRole(role) {
    return (req, res, next) => {
        if (!req.user?.roles?.includes(role)) {
            return res.status(403).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "forbidden",
                    diagnostics: `Required role: ${role}. User roles: ${req.user?.roles?.join(', ')}`
                }]
            });
        }
        next();
    };
}

/**
 * Scope-based access control for FHIR operations
 */
export function requireScope(scope) {
    return (req, res, next) => {
        if (!req.user?.scope?.includes(scope)) {
            return res.status(403).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "forbidden",
                    diagnostics: `Required scope: ${scope}. User scopes: ${req.user?.scope?.join(', ')}`
                }]
            });
        }
        next();
    };
}

/**
 * Healthcare provider validation for AYUSH practitioners
 */
export function requireAyushProvider(req, res, next) {
    const validRoles = ['ayush_practitioner', 'ayurveda_doctor', 'siddha_doctor', 'unani_doctor', 'healthcare_provider'];
    const hasValidRole = req.user?.roles?.some(role => validRoles.includes(role));
    
    if (!hasValidRole) {
        return res.status(403).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "forbidden",
                diagnostics: `AYUSH healthcare provider role required. Valid roles: ${validRoles.join(', ')}`
            }]
        });
    }
    
    next();
}