-- Migration: Add SNOMED CT and LOINC Support
-- Created: 2025-01-01
-- Purpose: Extend terminology system to support SNOMED CT and LOINC mappings

-- 1. Create SNOMED CT reference table
CREATE TABLE IF NOT EXISTS public.snomed_ct_codes (
    id SERIAL PRIMARY KEY,
    snomed_code VARCHAR(20) NOT NULL UNIQUE,
    snomed_term TEXT NOT NULL,
    semantic_tag VARCHAR(100),
    definition TEXT,
    module_id VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    effective_time DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SNOMED CT
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_code ON public.snomed_ct_codes(snomed_code);
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_term ON public.snomed_ct_codes USING gin(to_tsvector('english', snomed_term));
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_semantic_tag ON public.snomed_ct_codes(semantic_tag);
CREATE INDEX IF NOT EXISTS idx_snomed_ct_codes_active ON public.snomed_ct_codes(is_active) WHERE is_active = true;

-- 2. Create LOINC reference table
CREATE TABLE IF NOT EXISTS public.loinc_codes (
    id SERIAL PRIMARY KEY,
    loinc_code VARCHAR(20) NOT NULL UNIQUE,
    loinc_term TEXT NOT NULL,
    component VARCHAR(255),
    property VARCHAR(100),
    time_aspect VARCHAR(100),
    system VARCHAR(255),
    scale_type VARCHAR(100),
    method_type VARCHAR(255),
    class VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for LOINC
CREATE INDEX IF NOT EXISTS idx_loinc_codes_code ON public.loinc_codes(loinc_code);
CREATE INDEX IF NOT EXISTS idx_loinc_codes_term ON public.loinc_codes USING gin(to_tsvector('english', loinc_term));
CREATE INDEX IF NOT EXISTS idx_loinc_codes_component ON public.loinc_codes USING gin(to_tsvector('english', component));
CREATE INDEX IF NOT EXISTS idx_loinc_codes_class ON public.loinc_codes(class);
CREATE INDEX IF NOT EXISTS idx_loinc_codes_status ON public.loinc_codes(status) WHERE status = 'ACTIVE';

-- 3. Add SNOMED CT and LOINC columns to terminology_mappings table
ALTER TABLE public.terminology_mappings 
ADD COLUMN IF NOT EXISTS snomed_ct_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS snomed_ct_term TEXT,
ADD COLUMN IF NOT EXISTS loinc_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS loinc_term TEXT,
ADD COLUMN IF NOT EXISTS semantic_tag VARCHAR(100),
ADD COLUMN IF NOT EXISTS cross_validated BOOLEAN DEFAULT false;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_terminology_mappings_snomed_ct ON public.terminology_mappings(snomed_ct_code) WHERE snomed_ct_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_terminology_mappings_loinc ON public.terminology_mappings(loinc_code) WHERE loinc_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_terminology_mappings_cross_validated ON public.terminology_mappings(cross_validated) WHERE cross_validated = true;

-- 4. Create mapping statistics view
CREATE OR REPLACE VIEW public.mapping_statistics_view AS
SELECT 
    COUNT(*) as total_mappings,
    COUNT(CASE WHEN icd11_code IS NOT NULL THEN 1 END) as icd11_mappings,
    COUNT(CASE WHEN snomed_ct_code IS NOT NULL THEN 1 END) as snomed_mappings,
    COUNT(CASE WHEN loinc_code IS NOT NULL THEN 1 END) as loinc_mappings,
    COUNT(CASE WHEN cross_validated = true THEN 1 END) as cross_validated_mappings,
    ROUND(AVG(mapping_confidence), 2) as avg_confidence,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_mappings,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_mappings
FROM public.terminology_mappings
WHERE status IN ('approved', 'pending');

-- 5. Add foreign key constraints
ALTER TABLE public.terminology_mappings 
ADD CONSTRAINT IF NOT EXISTS fk_terminology_mappings_snomed_ct 
    FOREIGN KEY (snomed_ct_code) REFERENCES public.snomed_ct_codes(snomed_code) ON DELETE SET NULL;

ALTER TABLE public.terminology_mappings 
ADD CONSTRAINT IF NOT EXISTS fk_terminology_mappings_loinc 
    FOREIGN KEY (loinc_code) REFERENCES public.loinc_codes(loinc_code) ON DELETE SET NULL;

-- 6. Create audit trigger for SNOMED CT codes
CREATE OR REPLACE FUNCTION public.update_snomed_ct_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_snomed_ct_updated_at
    BEFORE UPDATE ON public.snomed_ct_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_snomed_ct_updated_at();

-- 7. Create audit trigger for LOINC codes
CREATE OR REPLACE FUNCTION public.update_loinc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_loinc_updated_at
    BEFORE UPDATE ON public.loinc_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_loinc_updated_at();

-- 8. Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.snomed_ct_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loinc_codes TO authenticated;
GRANT SELECT ON public.mapping_statistics_view TO authenticated;

-- Add RLS policies for SNOMED CT
ALTER TABLE public.snomed_ct_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SNOMED CT codes are viewable by authenticated users" ON public.snomed_ct_codes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add RLS policies for LOINC
ALTER TABLE public.loinc_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LOINC codes are viewable by authenticated users" ON public.loinc_codes
    FOR SELECT USING (auth.role() = 'authenticated');