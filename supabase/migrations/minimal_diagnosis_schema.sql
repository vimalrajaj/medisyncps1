-- Minimal AYUSH Terminology Service Database Schema
-- For Clinical Diagnosis Functionality Only

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing conflicting tables if they exist
DROP TABLE IF EXISTS diagnosis_entries CASCADE;
DROP TABLE IF EXISTS diagnosis_sessions CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Patients table
CREATE TABLE patients (
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
CREATE TABLE diagnosis_sessions (
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
CREATE TABLE diagnosis_entries (
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

-- Indexes for performance
CREATE INDEX idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_active ON patients(is_active);
CREATE INDEX idx_diagnosis_sessions_patient ON diagnosis_sessions(patient_id);
CREATE INDEX idx_diagnosis_sessions_date ON diagnosis_sessions(created_at);
CREATE INDEX idx_diagnosis_entries_session ON diagnosis_entries(session_id);

-- Sample test data
INSERT INTO patients (medical_record_number, first_name, last_name, date_of_birth, gender, phone, email) VALUES
('2321', 'vimal', 'raja', '1990-01-01', 'Male', '+91-9876543210', 'vimal.raja@email.com'),
('PAT001', 'Rajesh', 'Kumar', '1975-05-15', 'Male', '+91-9876543211', 'rajesh.kumar@email.com'),
('PAT002', 'Priya', 'Sharma', '1982-11-20', 'Female', '+91-9876543212', 'priya.sharma@email.com')
ON CONFLICT (medical_record_number) DO NOTHING;

-- Comments
COMMENT ON TABLE patients IS 'Patient records for clinical diagnosis tracking';
COMMENT ON TABLE diagnosis_sessions IS 'Clinical diagnosis sessions with NAMASTE-ICD11 mappings';
COMMENT ON TABLE diagnosis_entries IS 'Individual diagnosis entries within sessions';