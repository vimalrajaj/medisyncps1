-- FHIR Audit Tables for Ministry of AYUSH Compliance
-- Date: September 28, 2025
-- Purpose: Audit trails for FHIR operations and ABHA authentication

-- FHIR Audit Log Table
CREATE TABLE IF NOT EXISTS fhir_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR(255),
    abha_id VARCHAR(50),
    abha_address VARCHAR(255),
    healthcare_provider_id VARCHAR(100),
    facility_id VARCHAR(100),
    method VARCHAR(10),
    url TEXT,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    consent_version VARCHAR(50),
    data_version VARCHAR(50),
    abha_consent_id VARCHAR(100),
    purpose_of_use VARCHAR(50),
    response_time_ms INTEGER,
    status_code INTEGER,
    response_size INTEGER,
    fhir_operation VARCHAR(50),
    resource_type VARCHAR(50),
    terminology_system TEXT,
    ayush_operation VARCHAR(50),
    traditional_medicine_system VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Audit Log Table
CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR(255),
    audit_type VARCHAR(50),
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    operation VARCHAR(50),
    sensitivity_level VARCHAR(20),
    privacy_impact INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ABHA Authentication Log Table
CREATE TABLE IF NOT EXISTS abha_auth_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    abha_id VARCHAR(50),
    abha_address VARCHAR(255),
    authentication_result VARCHAR(20), -- success, failed, expired
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    token_expiry TIMESTAMP WITH TIME ZONE,
    roles TEXT[], -- Array of roles
    scopes TEXT[], -- Array of scopes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FHIR Bundle Processing Log
CREATE TABLE IF NOT EXISTS fhir_bundle_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id VARCHAR(255),
    user_id VARCHAR(255),
    abha_consent_id VARCHAR(100),
    bundle_type VARCHAR(50),
    entry_count INTEGER,
    dual_coded_count INTEGER,
    processing_status VARCHAR(20), -- success, failed, partial
    processing_errors JSONB,
    snomed_mappings_applied INTEGER DEFAULT 0,
    loinc_mappings_applied INTEGER DEFAULT 0,
    icd11_mappings_applied INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terminology Mapping Usage Stats
CREATE TABLE IF NOT EXISTS terminology_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    source_system VARCHAR(50), -- NAMASTE, ICD-11, SNOMED-CT, LOINC
    target_system VARCHAR(50),
    operation_type VARCHAR(30), -- search, translate, expand, validate
    usage_count INTEGER DEFAULT 1,
    unique_users INTEGER DEFAULT 1,
    avg_response_time_ms DECIMAL(10,2),
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, source_system, target_system, operation_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fhir_audit_log_timestamp ON fhir_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_fhir_audit_log_user_id ON fhir_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_fhir_audit_log_abha_id ON fhir_audit_log(abha_id);
CREATE INDEX IF NOT EXISTS idx_fhir_audit_log_operation ON fhir_audit_log(fhir_operation);
CREATE INDEX IF NOT EXISTS idx_fhir_audit_log_resource_type ON fhir_audit_log(resource_type);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_timestamp ON privacy_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_resource_type ON privacy_audit_log(resource_type);

CREATE INDEX IF NOT EXISTS idx_abha_auth_log_timestamp ON abha_auth_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_abha_auth_log_abha_id ON abha_auth_log(abha_id);
CREATE INDEX IF NOT EXISTS idx_abha_auth_log_result ON abha_auth_log(authentication_result);

CREATE INDEX IF NOT EXISTS idx_fhir_bundle_log_timestamp ON fhir_bundle_log(created_at);
CREATE INDEX IF NOT EXISTS idx_fhir_bundle_log_user_id ON fhir_bundle_log(user_id);
CREATE INDEX IF NOT EXISTS idx_fhir_bundle_log_status ON fhir_bundle_log(processing_status);

CREATE INDEX IF NOT EXISTS idx_terminology_usage_stats_date ON terminology_usage_stats(date);
CREATE INDEX IF NOT EXISTS idx_terminology_usage_stats_systems ON terminology_usage_stats(source_system, target_system);

-- Enable RLS (Row Level Security) for audit tables
ALTER TABLE fhir_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE abha_auth_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_bundle_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit tables
-- Admin users can view all audit logs
CREATE POLICY "Admin users can view all audit logs" ON fhir_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON fhir_audit_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs" ON fhir_audit_log
    FOR INSERT TO service_role
    USING (true);

-- Similar policies for other audit tables
CREATE POLICY "Admin users can view all privacy audit logs" ON privacy_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Service can insert privacy audit logs" ON privacy_audit_log
    FOR INSERT TO service_role
    USING (true);

CREATE POLICY "Admin users can view ABHA auth logs" ON abha_auth_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Service can insert ABHA auth logs" ON abha_auth_log
    FOR INSERT TO service_role
    USING (true);

CREATE POLICY "Service can manage bundle logs" ON fhir_bundle_log
    FOR ALL TO service_role
    USING (true);

CREATE POLICY "Service can manage usage stats" ON terminology_usage_stats
    FOR ALL TO service_role
    USING (true);

-- Create a view for audit summary
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as audit_date,
    COUNT(*) as total_operations,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT abha_id) as unique_abha_users,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) FILTER (WHERE status_code < 400) as successful_operations,
    COUNT(*) FILTER (WHERE status_code >= 400) as failed_operations,
    COUNT(*) FILTER (WHERE fhir_operation = 'expand') as valueset_expansions,
    COUNT(*) FILTER (WHERE fhir_operation = 'translate') as translations,
    COUNT(*) FILTER (WHERE fhir_operation = 'create-bundle') as bundle_creations
FROM fhir_audit_log 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY audit_date DESC;

-- Comments for documentation
COMMENT ON TABLE fhir_audit_log IS 'Comprehensive audit trail for all FHIR operations with ABHA authentication details';
COMMENT ON TABLE privacy_audit_log IS 'Privacy-specific audit trail for sensitive data access';
COMMENT ON TABLE abha_auth_log IS 'ABHA authentication attempts and results';
COMMENT ON TABLE fhir_bundle_log IS 'Detailed logging for FHIR Bundle processing with dual coding statistics';
COMMENT ON TABLE terminology_usage_stats IS 'Aggregated usage statistics for terminology operations';
COMMENT ON VIEW audit_summary IS 'Daily summary of audit activities for dashboard reporting';