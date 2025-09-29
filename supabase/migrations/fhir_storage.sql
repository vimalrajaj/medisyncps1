-- FHIR Resource Storage Tables
-- This migration creates tables for storing FHIR resources from bundles

-- Table for FHIR bundles
CREATE TABLE IF NOT EXISTS fhir_bundles (
  id SERIAL PRIMARY KEY,
  bundle_id VARCHAR(255) NOT NULL,  -- The FHIR bundle identifier
  bundle_type VARCHAR(50) NOT NULL,  -- transaction, batch, document, etc.
  timestamp TIMESTAMPTZ NOT NULL,  -- When the bundle was created
  content JSONB NOT NULL,  -- The full bundle content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on bundle_id for faster lookups
CREATE INDEX IF NOT EXISTS fhir_bundles_bundle_id_idx ON fhir_bundles(bundle_id);
CREATE INDEX IF NOT EXISTS fhir_bundles_timestamp_idx ON fhir_bundles(timestamp);

-- Table for FHIR patient resources
CREATE TABLE IF NOT EXISTS fhir_patients (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) NOT NULL UNIQUE,  -- The FHIR resource identifier
  identifier VARCHAR(255),  -- Patient's main identifier (MRN)
  name VARCHAR(255),  -- Patient's display name
  content JSONB NOT NULL,  -- The full patient resource content
  bundle_id INTEGER REFERENCES fhir_bundles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fhir_patients_resource_id_idx ON fhir_patients(resource_id);
CREATE INDEX IF NOT EXISTS fhir_patients_identifier_idx ON fhir_patients(identifier);

-- Table for FHIR condition resources (diagnoses)
CREATE TABLE IF NOT EXISTS fhir_conditions (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) NOT NULL UNIQUE,  -- The FHIR resource identifier
  patient_id VARCHAR(255),  -- Reference to the patient resource
  status VARCHAR(50),  -- active, resolved, etc.
  namaste_code VARCHAR(50),  -- NAMASTE terminology code
  namaste_display TEXT,  -- NAMASTE terminology display name
  icd11_code VARCHAR(50),  -- ICD-11 code
  icd11_display TEXT,  -- ICD-11 display name
  recorded_date TIMESTAMPTZ,  -- When the condition was recorded
  content JSONB NOT NULL,  -- The full condition resource content
  bundle_id INTEGER REFERENCES fhir_bundles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fhir_conditions_resource_id_idx ON fhir_conditions(resource_id);
CREATE INDEX IF NOT EXISTS fhir_conditions_patient_id_idx ON fhir_conditions(patient_id);
CREATE INDEX IF NOT EXISTS fhir_conditions_namaste_code_idx ON fhir_conditions(namaste_code);
CREATE INDEX IF NOT EXISTS fhir_conditions_icd11_code_idx ON fhir_conditions(icd11_code);

-- Table for FHIR observation resources
CREATE TABLE IF NOT EXISTS fhir_observations (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) NOT NULL UNIQUE,  -- The FHIR resource identifier
  patient_id VARCHAR(255),  -- Reference to the patient resource
  status VARCHAR(50),  -- final, preliminary, etc.
  code VARCHAR(50),  -- Observation code
  value_type VARCHAR(50),  -- string, quantity, codeableConcept, etc.
  value_data JSONB,  -- The observation value
  effective_date TIMESTAMPTZ,  -- When the observation was made
  content JSONB NOT NULL,  -- The full observation resource content
  bundle_id INTEGER REFERENCES fhir_bundles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fhir_observations_resource_id_idx ON fhir_observations(resource_id);
CREATE INDEX IF NOT EXISTS fhir_observations_patient_id_idx ON fhir_observations(patient_id);
CREATE INDEX IF NOT EXISTS fhir_observations_code_idx ON fhir_observations(code);

-- Add more tables for other FHIR resource types as needed