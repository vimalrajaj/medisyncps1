-- Complete AYUSH Terminology Service Database Schema
-- Supports Patient Records, API Management, Analytics, and File Management

-- ============================================================================
-- PHASE 1: CLINICAL FUNCTIONS
-- ============================================================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Diagnosis sessions
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    session_title VARCHAR(200),
    chief_complaint TEXT,
    clinical_notes TEXT,
    fhir_bundle JSONB,
    total_codes INTEGER DEFAULT 0,
    confidence_score DECIMAL(5,3),
    clinician_name VARCHAR(100),
    clinician_id VARCHAR(50),
    session_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual diagnosis entries within sessions
CREATE TABLE IF NOT EXISTS diagnosis_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
    namaste_code VARCHAR(20),
    namaste_display VARCHAR(200),
    icd11_code VARCHAR(50),
    icd11_display VARCHAR(200),
    confidence_score DECIMAL(5,3),
    mapping_source VARCHAR(50),
    clinical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: API MANAGEMENT
-- ============================================================================

-- API clients registration
CREATE TABLE IF NOT EXISTS api_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(100) NOT NULL,
    client_type VARCHAR(50) NOT NULL, -- 'healthcare', 'research', 'integration', 'personal'
    organization VARCHAR(100),
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    description TEXT,
    website_url VARCHAR(200),
    expected_volume INTEGER DEFAULT 1000,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'revoked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true
);

-- API keys for authenticated access
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES api_clients(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL, -- Hashed key
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    scopes JSONB DEFAULT '["terminology:read"]', -- Permissions array
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES api_clients(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_status INTEGER,
    response_time_ms INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    query_parameters JSONB,
    error_message TEXT
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES api_clients(id) ON DELETE CASCADE,
    time_window TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_count INTEGER DEFAULT 1,
    window_type VARCHAR(20) DEFAULT 'minute', -- 'minute', 'hour', 'day'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: ADMIN & ANALYTICS
-- ============================================================================

-- System activity logging
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100),
    user_name VARCHAR(100),
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'search', 'diagnosis', 'api_call', 'upload'
    activity_description TEXT,
    resource_type VARCHAR(50), -- 'patient', 'api_client', 'terminology'
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type VARCHAR(20) DEFAULT 'admin', -- 'admin', 'user', 'client'
    recipient_id VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
    category VARCHAR(50), -- 'system', 'api', 'security', 'maintenance'
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(200),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- System metrics for analytics
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 4: FILE MANAGEMENT
-- ============================================================================

-- File uploads tracking
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_name VARCHAR(100),
    uploader_email VARCHAR(100),
    original_filename VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'namaste_csv', 'icd11_csv', 'mapping_csv'
    file_size INTEGER,
    file_path VARCHAR(500),
    upload_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File validation results
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    validation_errors JSONB,
    validation_warnings JSONB,
    processing_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing history for uploads
CREATE TABLE IF NOT EXISTS processing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    step_message TEXT,
    records_processed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);

-- Diagnosis indexes
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_patient ON diagnosis_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_date ON diagnosis_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_diagnosis_entries_session ON diagnosis_entries(session_id);

-- API indexes
CREATE INDEX IF NOT EXISTS idx_api_clients_status ON api_clients(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_client ON api_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_usage_client ON api_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(request_timestamp);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(created_at);

-- File upload indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_date ON file_uploads(created_at);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample patients
INSERT INTO patients (medical_record_number, first_name, last_name, date_of_birth, gender, phone, email) VALUES
('PAT001', 'Rajesh', 'Kumar', '1975-05-15', 'Male', '+91-9876543210', 'rajesh.kumar@email.com'),
('PAT002', 'Priya', 'Sharma', '1982-11-20', 'Female', '+91-9876543211', 'priya.sharma@email.com'),
('PAT003', 'Arun', 'Patel', '1968-03-08', 'Male', '+91-9876543212', 'arun.patel@email.com')
ON CONFLICT (medical_record_number) DO NOTHING;

-- Insert sample API clients
INSERT INTO api_clients (client_name, client_type, organization, contact_email, description, status) VALUES
('AIIMS Integration', 'healthcare', 'All India Institute of Medical Sciences', 'integration@aiims.edu', 'Hospital management system integration', 'active'),
('Research Analytics', 'research', 'Indian Council of Medical Research', 'research@icmr.gov.in', 'Medical research data analysis', 'active'),
('Mobile Health App', 'integration', 'HealthTech Solutions', 'dev@healthtech.in', 'Mobile application for practitioners', 'pending')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (title, message, notification_type, category) VALUES
('System Update Complete', 'NAMASTE terminology database has been updated with latest codes', 'success', 'system'),
('High API Usage Alert', 'Client "AIIMS Integration" approaching daily rate limit', 'warning', 'api'),
('New Client Registration', 'Mobile Health App has requested API access', 'info', 'api');

COMMENT ON TABLE patients IS 'Patient records for clinical diagnosis tracking';
COMMENT ON TABLE diagnosis_sessions IS 'Clinical diagnosis sessions with NAMASTE-ICD11 mappings';
COMMENT ON TABLE api_clients IS 'Registered API clients with access credentials';
COMMENT ON TABLE activity_logs IS 'System activity and audit trail';
COMMENT ON TABLE file_uploads IS 'Terminology file upload management';