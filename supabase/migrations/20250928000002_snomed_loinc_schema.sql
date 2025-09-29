-- Migration: Add SNOMED CT and LOINC support to terminology system
-- Date: September 28, 2025
-- Purpose: Enhance interoperability with SNOMED CT and LOINC semantics

-- Create SNOMED CT codes table
CREATE TABLE IF NOT EXISTS snomed_ct_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snomed_ct_code VARCHAR(18) NOT NULL UNIQUE,
    snomed_ct_term TEXT NOT NULL,
    snomed_ct_description TEXT,
    semantic_tag VARCHAR(100),
    concept_status VARCHAR(20) DEFAULT 'active',
    active BOOLEAN DEFAULT true,
    effective_time DATE,
    module_id VARCHAR(18),
    definition_status_id VARCHAR(18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create LOINC codes table
CREATE TABLE IF NOT EXISTS loinc_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loinc_code VARCHAR(10) NOT NULL UNIQUE,
    loinc_long_name TEXT NOT NULL,
    loinc_short_name VARCHAR(255),
    component TEXT,
    property VARCHAR(50),
    time_aspect VARCHAR(50),
    system VARCHAR(100),
    scale_type VARCHAR(50),
    method_type VARCHAR(100),
    class VARCHAR(50),
    version_last_changed VARCHAR(10),
    change_type VARCHAR(10),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add SNOMED CT and LOINC columns to terminology_mappings table
ALTER TABLE terminology_mappings 
ADD COLUMN IF NOT EXISTS snomed_ct_code VARCHAR(18),
ADD COLUMN IF NOT EXISTS snomed_ct_term TEXT,
ADD COLUMN IF NOT EXISTS loinc_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS loinc_term TEXT,
ADD COLUMN IF NOT EXISTS semantic_context JSONB,
ADD COLUMN IF NOT EXISTS interoperability_level VARCHAR(20) DEFAULT 'basic';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_code ON snomed_ct_codes(snomed_ct_code);
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_term ON snomed_ct_codes USING gin(to_tsvector('english', snomed_ct_term));
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_semantic_tag ON snomed_ct_codes(semantic_tag);
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_active ON snomed_ct_codes(active);

CREATE INDEX IF NOT EXISTS idx_loinc_codes_code ON loinc_codes(loinc_code);
CREATE INDEX IF NOT EXISTS idx_loinc_codes_long_name ON loinc_codes USING gin(to_tsvector('english', loinc_long_name));
CREATE INDEX IF NOT EXISTS idx_loinc_codes_component ON loinc_codes USING gin(to_tsvector('english', component));
CREATE INDEX IF NOT EXISTS idx_loinc_codes_active ON loinc_codes(active);

CREATE INDEX IF NOT EXISTS idx_terminology_mappings_snomed ON terminology_mappings(snomed_ct_code);
CREATE INDEX IF NOT EXISTS idx_terminology_mappings_loinc ON terminology_mappings(loinc_code);

-- Add foreign key constraints
ALTER TABLE terminology_mappings 
ADD CONSTRAINT fk_terminology_mappings_snomed 
FOREIGN KEY (snomed_ct_code) REFERENCES snomed_ct_codes(snomed_ct_code) ON DELETE SET NULL;

ALTER TABLE terminology_mappings 
ADD CONSTRAINT fk_terminology_mappings_loinc 
FOREIGN KEY (loinc_code) REFERENCES loinc_codes(loinc_code) ON DELETE SET NULL;

-- Add RLS policies for security
ALTER TABLE snomed_ct_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loinc_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read access to snomed_ct_codes for authenticated users" 
ON snomed_ct_codes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow read access to loinc_codes for authenticated users" 
ON loinc_codes FOR SELECT 
TO authenticated 
USING (true);

-- Allow admin users to manage terminology data
CREATE POLICY "Allow full access to snomed_ct_codes for admin users" 
ON snomed_ct_codes FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Allow full access to loinc_codes for admin users" 
ON loinc_codes FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Create functions for terminology management
CREATE OR REPLACE FUNCTION get_snomed_hierarchy(concept_code VARCHAR(18))
RETURNS TABLE(
    parent_code VARCHAR(18),
    parent_term TEXT,
    relationship_type VARCHAR(50)
) AS $$
BEGIN
    -- Placeholder for SNOMED CT hierarchy traversal
    -- In production, this would connect to SNOMED CT relationship tables
    RETURN QUERY
    SELECT 
        '138875005'::VARCHAR(18) as parent_code,
        'Clinical finding'::TEXT as parent_term,
        'IS-A'::VARCHAR(50) as relationship_type
    WHERE concept_code IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_loinc_structure(loinc_code VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic LOINC code format validation
    RETURN loinc_code ~ '^[0-9]{1,5}-[0-9]$';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE snomed_ct_codes IS 'SNOMED CT concept codes for clinical terminology';
COMMENT ON TABLE loinc_codes IS 'LOINC codes for laboratory and clinical observations';
COMMENT ON COLUMN terminology_mappings.snomed_ct_code IS 'Mapped SNOMED CT concept code';
COMMENT ON COLUMN terminology_mappings.loinc_code IS 'Mapped LOINC code for observations';
COMMENT ON COLUMN terminology_mappings.semantic_context IS 'Additional semantic context and metadata';
COMMENT ON COLUMN terminology_mappings.interoperability_level IS 'Level of interoperability: basic, enhanced, full';