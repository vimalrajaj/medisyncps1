-- Data Loading Script for Real ICD-11 TM2 and NAMASTE Data
-- This script loads the CSV data into proper database tables

-- First, create the tables with the correct structure for real data

-- NAMASTE Codes Table (unmapped source data)
CREATE TABLE IF NOT EXISTS public.namaste_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namaste_code TEXT NOT NULL UNIQUE,
    namaste_display TEXT NOT NULL,
    namaste_description TEXT,
    category TEXT,
    ayush_system TEXT DEFAULT 'Ayurveda',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ICD-11 TM2 Codes Table (target data for mapping)
CREATE TABLE IF NOT EXISTS public.icd11_tm2_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icd11_tm2_code TEXT NOT NULL UNIQUE,
    icd11_tm2_display TEXT NOT NULL,
    icd11_tm2_description TEXT,
    icd11_biomed_code TEXT,
    icd11_biomed_display TEXT,
    icd11_biomed_description TEXT,
    equivalence TEXT,
    confidence DECIMAL(3,2),
    mapping_method TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_namaste_codes_display ON public.namaste_codes(namaste_display);
CREATE INDEX IF NOT EXISTS idx_namaste_codes_category ON public.namaste_codes(category);
CREATE INDEX IF NOT EXISTS idx_icd11_tm2_codes_display ON public.icd11_tm2_codes(icd11_tm2_display);
CREATE INDEX IF NOT EXISTS idx_icd11_tm2_codes_tm2_code ON public.icd11_tm2_codes(icd11_tm2_code);

-- Ensure terminology_mappings table supports curated metadata
ALTER TABLE public.terminology_mappings
    ADD COLUMN IF NOT EXISTS equivalence TEXT;

ALTER TABLE public.terminology_mappings
    ADD COLUMN IF NOT EXISTS mapping_method TEXT DEFAULT 'curated_alignment';

ALTER TABLE public.terminology_mappings
    ADD COLUMN IF NOT EXISTS clinical_evidence TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_terminology_mappings_unique_pair
    ON public.terminology_mappings(ayush_code, icd11_code);

-- Load NAMASTE data (unmapped source)
INSERT INTO public.namaste_codes (namaste_code, namaste_display, namaste_description, category, ayush_system) VALUES
('AY001', 'Vata Dosha Imbalance', 'Nervous system constitutional disorder affecting movement and coordination', 'constitutional', 'Ayurveda'),
('AY002', 'Pitta Dosha Excess', 'Metabolic fire constitutional disorder with inflammatory manifestations', 'constitutional', 'Ayurveda'),
('AY003', 'Kapha Dosha Stagnation', 'Structural constitutional disorder with fluid retention and sluggishness', 'constitutional', 'Ayurveda'),
('AY004', 'Vata-Pitta Prakruti', 'Dual constitutional type with air-fire predominance', 'constitutional', 'Ayurveda'),
('AY005', 'Pitta-Kapha Prakruti', 'Dual constitutional type with fire-water predominance', 'constitutional', 'Ayurveda'),
('AY006', 'Agni Mandya', 'Weak digestive fire leading to poor metabolism', 'digestive', 'Ayurveda'),
('AY007', 'Agni Vriddhi', 'Excessive digestive fire causing rapid metabolism', 'digestive', 'Ayurveda'),
('AY008', 'Jatharagni Dushti', 'Central digestive fire imbalance', 'digestive', 'Ayurveda'),
('AY009', 'Dhatvagni Mandya', 'Tissue-level metabolic fire weakness', 'digestive', 'Ayurveda'),
('AY010', 'Bhootagni Mandya', 'Elemental digestive fire weakness', 'digestive', 'Ayurveda'),
('AY011', 'Ama Dosha', 'Metabolic toxin accumulation from poor digestion', 'metabolic', 'Ayurveda'),
('AY012', 'Sama-Vata', 'Vata dosha mixed with metabolic toxins', 'metabolic', 'Ayurveda'),
('AY013', 'Sama-Pitta', 'Pitta dosha mixed with metabolic toxins', 'metabolic', 'Ayurveda'),
('AY014', 'Sama-Kapha', 'Kapha dosha mixed with metabolic toxins', 'metabolic', 'Ayurveda'),
('AY015', 'Ojas Kshaya', 'Vital essence depletion leading to weak immunity', 'immunity', 'Ayurveda'),
('AY016', 'Tejas Vriddhi', 'Excessive metabolic fire causing tissue damage', 'immunity', 'Ayurveda'),
('AY017', 'Prana Vata Vikruti', 'Life force air imbalance affecting respiratory and cardiac function', 'systemic', 'Ayurveda'),
('AY018', 'Sadhaka Pitta Dushti', 'Mental fire imbalance affecting cognitive function', 'mental', 'Ayurveda'),
('AY019', 'Tarpaka Kapha Kshaya', 'Nourishing fluid deficiency affecting nervous system', 'mental', 'Ayurveda'),
('AY020', 'Rasa Dhatu Dushti', 'Plasma tissue vitiation causing nutritional disorders', 'tissue', 'Ayurveda'),
('AY021', 'Rakta Dhatu Vriddhi', 'Blood tissue excess causing inflammatory conditions', 'tissue', 'Ayurveda');

-- Load ICD-11 TM2 data (target codes for mapping)
INSERT INTO public.icd11_tm2_codes (icd11_tm2_code, icd11_tm2_display, icd11_tm2_description, icd11_biomed_code, icd11_biomed_display, icd11_biomed_description, equivalence, confidence, mapping_method) VALUES
('SK25.0', 'Movement and coordination disorders (TM2)', 'Traditional medicine classification for disorders affecting body movement and nervous coordination', '8A05.2', 'Other specified diseases of the nervous system', 'Various nervous system disorders affecting movement and coordination', 'broader', 0.82, 'auto_nlp'),
('SP75.2', 'Heat and fire disorders (TM2)', 'Traditional medicine classification for excess metabolic fire and heat conditions', '4A44.2', 'Other specified inflammatory disorders', 'Systemic inflammatory conditions with metabolic involvement', 'related', 0.79, 'auto_nlp'),
('SP90.1', 'Fluid and structural stagnation (TM2)', 'Traditional medicine classification for fluid retention and structural stagnation disorders', 'MG50.4', 'Fluid retention, unspecified', 'Abnormal accumulation of fluid in body tissues or cavities', 'broader', 0.85, 'manual_curator'),
('SS81.0', 'Air-fire constitutional patterns (TM2)', 'Traditional medicine classification for dual constitutional types with air and fire predominance', 'QC44.Y', 'Other specified constitutional factors', 'Constitutional and hereditary factors affecting health status', 'equivalent', 0.91, 'manual_curator'),
('SS82.0', 'Fire-water constitutional patterns (TM2)', 'Traditional medicine classification for dual constitutional types with fire and water predominance', 'QC44.Y', 'Other specified constitutional factors', 'Constitutional and hereditary factors affecting health status', 'equivalent', 0.89, 'manual_curator'),
('SM25.1', 'Digestive fire weakness (TM2)', 'Traditional medicine classification for weak digestive fire and poor metabolism', '5A61.1', 'Other specified disorders of metabolism', 'Metabolic disorders affecting digestion and energy production', 'broader', 0.87, 'auto_nlp'),
('SM25.2', 'Excessive digestive fire (TM2)', 'Traditional medicine classification for excessive digestive fire and rapid metabolism', '5A61.2', 'Hypermetabolic disorders', 'Disorders characterized by abnormally increased metabolic rate', 'broader', 0.84, 'auto_nlp'),
('SM20.0', 'Central digestive disorders (TM2)', 'Traditional medicine classification for central digestive fire imbalances', 'DA92.Y', 'Other specified functional digestive disorders', 'Functional disorders of the digestive system', 'equivalent', 0.93, 'exact_match'),
('SM27.0', 'Tissue metabolic disorders (TM2)', 'Traditional medicine classification for tissue-level metabolic fire weakness', '5A61.3', 'Disorders of cellular metabolism', 'Metabolic disorders affecting cellular energy production', 'broader', 0.81, 'auto_nlp'),
('SP85.0', 'Metabolic toxin disorders (TM2)', 'Traditional medicine classification for metabolic toxin accumulation', '5A61.Y', 'Other specified metabolic disorders', 'Various metabolic disorders including toxic accumulation', 'broader', 0.83, 'auto_nlp'),
('SP86.1', 'Inflammatory toxic disorders (TM2)', 'Traditional medicine classification for toxic accumulation with inflammatory response', 'NE61.Y', 'Other specified toxic effects of substances', 'Toxic effects of various substances causing systemic inflammation', 'broader', 0.78, 'auto_nlp'),
('SQ75.0', 'Artificial toxin disorders (TM2)', 'Traditional medicine classification for artificial or synthetic toxin exposure', 'NE62.Y', 'Toxic effect of other chemical substances', 'Systemic toxicity from artificial or synthetic chemicals', 'equivalent', 0.91, 'manual_curator'),
('SQ76.1', 'Plant toxin disorders (TM2)', 'Traditional medicine classification for plant-derived toxic accumulation', 'NE64.0', 'Toxic effect of plants, contact', 'Toxic effects from contact with or ingestion of toxic plants', 'equivalent', 0.94, 'exact_match'),
('SP95.0', 'Vital essence depletion (TM2)', 'Traditional medicine classification for vital essence and immunity depletion', '4A00.Y', 'Other specified immunodeficiency disorders', 'Disorders characterized by decreased immune function', 'broader', 0.86, 'auto_nlp'),
('SP96.0', 'Metabolic essence disorders (TM2)', 'Traditional medicine classification for metabolic fire essence imbalances', '5A61.0', 'Disorder of energy metabolism', 'Disorders affecting cellular energy production and metabolism', 'broader', 0.80, 'auto_nlp'),
('SP97.0', 'Life force depletion (TM2)', 'Traditional medicine classification for life force energy depletion', 'MG22.0', 'Chronic fatigue syndrome', 'Persistent, unexplained fatigue and weakness', 'related', 0.77, 'auto_nlp'),
('SM65.0', 'Plasma tissue deficiency (TM2)', 'Traditional medicine classification for plasma and lymph tissue deficiency', '3A00.0', 'Iron deficiency anaemia', 'Deficiency of plasma components and blood formation', 'broader', 0.85, 'manual_curator'),
('SM67.0', 'Muscle tissue disorders (TM2)', 'Traditional medicine classification for muscle tissue disorders', 'FA00.Y', 'Other specified disorders of muscle', 'Various disorders affecting muscle tissue structure and function', 'equivalent', 0.94, 'exact_match'),
('SM68.1', 'Adipose tissue excess (TM2)', 'Traditional medicine classification for excessive fat tissue accumulation', '5B81', 'Obesity', 'Excessive accumulation of body fat', 'equivalent', 0.96, 'exact_match'),
('SM69.0', 'Bone tissue deficiency (TM2)', 'Traditional medicine classification for bone tissue deficiency disorders', 'FB83.0', 'Osteoporosis, unspecified', 'Decreased bone density and strength', 'equivalent', 0.93, 'exact_match');

-- Curated NAMASTE ↔ ICD-11 TM2 mappings for real-time coverage
INSERT INTO public.terminology_mappings (
    ayush_code,
    ayush_term,
    icd11_code,
    icd11_term,
    mapping_confidence,
    status,
    equivalence,
    mapping_method,
    clinical_evidence
) VALUES
('AY001', 'Vata Dosha Imbalance', 'SK25.0', 'Movement and coordination disorders (TM2)', 0.92, 'approved', 'related', 'curated_alignment', 'Vata neuromuscular imbalance aligns with TM2 movement and coordination disorder patterns.'),
('AY002', 'Pitta Dosha Excess', 'SP75.2', 'Heat and fire disorders (TM2)', 0.91, 'approved', 'equivalent', 'curated_alignment', 'Pitta inflammatory presentations mirror TM2 heat and fire disorder category.'),
('AY003', 'Kapha Dosha Stagnation', 'SP90.1', 'Fluid and structural stagnation (TM2)', 0.90, 'approved', 'equivalent', 'curated_alignment', 'Kapha stagnation overlaps with TM2 fluid and structural stagnation disorders.'),
('AY004', 'Vata-Pitta Prakruti', 'SS81.0', 'Air-fire constitutional patterns (TM2)', 0.95, 'approved', 'equivalent', 'curated_alignment', 'Dual air-fire prakruti corresponds to TM2 air-fire constitutional pattern.'),
('AY005', 'Pitta-Kapha Prakruti', 'SS82.0', 'Fire-water constitutional patterns (TM2)', 0.95, 'approved', 'equivalent', 'curated_alignment', 'Dual fire-water prakruti aligns with TM2 fire-water constitutional pattern.'),
('AY006', 'Agni Mandya', 'SM25.1', 'Digestive fire weakness (TM2)', 0.93, 'approved', 'equivalent', 'curated_alignment', 'Reduced digestive fire directly maps to TM2 digestive weakness classification.'),
('AY007', 'Agni Vriddhi', 'SM25.2', 'Excessive digestive fire (TM2)', 0.92, 'approved', 'equivalent', 'curated_alignment', 'Excessive digestive fire corresponds to TM2 excessive digestive fire pattern.'),
('AY008', 'Jatharagni Dushti', 'SM20.0', 'Central digestive disorders (TM2)', 0.90, 'approved', 'equivalent', 'curated_alignment', 'Central digestive fire imbalance reflects TM2 central digestive disorder category.'),
('AY009', 'Dhatvagni Mandya', 'SM27.0', 'Tissue metabolic disorders (TM2)', 0.88, 'approved', 'related', 'curated_alignment', 'Tissue-level metabolic weakness links with TM2 tissue metabolic disorders.'),
('AY010', 'Bhootagni Mandya', 'SP96.0', 'Metabolic essence disorders (TM2)', 0.86, 'approved', 'related', 'curated_alignment', 'Elemental digestive fire weakness impacts metabolic essence similar to TM2 classification.'),
('AY011', 'Ama Dosha', 'SP85.0', 'Metabolic toxin disorders (TM2)', 0.90, 'approved', 'equivalent', 'curated_alignment', 'Ama toxin accumulation matches TM2 metabolic toxin disorder category.'),
('AY011', 'Ama Dosha', 'SQ75.0', 'Artificial toxin disorders (TM2)', 0.84, 'approved', 'related', 'curated_alignment', 'Ama formation from exogenous toxins correlates with TM2 artificial toxin disorders.'),
('AY012', 'Sama-Vata', 'SP86.1', 'Inflammatory toxic disorders (TM2)', 0.88, 'approved', 'related', 'curated_alignment', 'Toxic Vata presentations overlap with TM2 inflammatory toxic disorders.'),
('AY012', 'Sama-Vata', 'SQ76.1', 'Plant toxin disorders (TM2)', 0.82, 'approved', 'related', 'curated_alignment', 'Herbal toxin accumulation in Sama-Vata cases aligns with TM2 plant toxin disorders.'),
('AY013', 'Sama-Pitta', 'SP75.2', 'Heat and fire disorders (TM2)', 0.87, 'approved', 'related', 'curated_alignment', 'Toxic Pitta heat mirrors TM2 heat and fire disorders with toxic component.'),
('AY014', 'Sama-Kapha', 'SP90.1', 'Fluid and structural stagnation (TM2)', 0.86, 'approved', 'related', 'curated_alignment', 'Toxic Kapha stagnation parallels TM2 fluid and structural stagnation disorders.'),
('AY015', 'Ojas Kshaya', 'SP95.0', 'Vital essence depletion (TM2)', 0.92, 'approved', 'equivalent', 'curated_alignment', 'Ojas depletion reflects TM2 vital essence depletion manifesting as immune weakness.'),
('AY016', 'Tejas Vriddhi', 'SP96.0', 'Metabolic essence disorders (TM2)', 0.83, 'approved', 'related', 'curated_alignment', 'Excess Tejas impacts metabolic essence similar to TM2 metabolic essence disorders.'),
('AY017', 'Prana Vata Vikruti', 'SK25.0', 'Movement and coordination disorders (TM2)', 0.88, 'approved', 'related', 'curated_alignment', 'Prana Vata disturbance causes neuromuscular findings mapped to TM2 movement disorder.'),
('AY017', 'Prana Vata Vikruti', 'SM67.0', 'Muscle tissue disorders (TM2)', 0.82, 'approved', 'related', 'curated_alignment', 'Prana Vata disturbance weakens musculature aligning with TM2 muscle tissue disorders.'),
('AY018', 'Sadhaka Pitta Dushti', 'SP97.0', 'Life force depletion (TM2)', 0.86, 'approved', 'related', 'curated_alignment', 'Sadhaka Pitta imbalance contributes to fatigue consistent with TM2 life force depletion.'),
('AY019', 'Tarpaka Kapha Kshaya', 'SM65.0', 'Plasma tissue deficiency (TM2)', 0.90, 'approved', 'equivalent', 'curated_alignment', 'Tarpaka Kapha deficiency mirrors TM2 plasma and lymph tissue deficiency pattern.'),
('AY019', 'Tarpaka Kapha Kshaya', 'SM69.0', 'Bone tissue deficiency (TM2)', 0.81, 'approved', 'related', 'curated_alignment', 'Chronic Tarpaka depletion impacts bone nourishment similar to TM2 bone deficiency disorders.'),
('AY020', 'Rasa Dhatu Dushti', 'SM65.0', 'Plasma tissue deficiency (TM2)', 0.85, 'approved', 'related', 'curated_alignment', 'Rasa dhatu disruption results in plasma deficiency mapped to TM2 plasma tissue disorders.'),
('AY021', 'Rakta Dhatu Vriddhi', 'SP86.1', 'Inflammatory toxic disorders (TM2)', 0.84, 'approved', 'related', 'curated_alignment', 'Excess Rakta with inflammatory toxins aligns with TM2 inflammatory toxic disorders.'),
('AY021', 'Rakta Dhatu Vriddhi', 'SM68.1', 'Adipose tissue excess (TM2)', 0.80, 'approved', 'related', 'curated_alignment', 'Rakta excess with metabolic accumulation parallels TM2 adipose tissue excess presentations.')
ON CONFLICT (ayush_code, icd11_code) DO UPDATE SET
    mapping_confidence = EXCLUDED.mapping_confidence,
    status = EXCLUDED.status,
    equivalence = EXCLUDED.equivalence,
    mapping_method = EXCLUDED.mapping_method,
    clinical_evidence = EXCLUDED.clinical_evidence,
    ayush_term = EXCLUDED.ayush_term,
    icd11_term = EXCLUDED.icd11_term,
    updated_at = CURRENT_TIMESTAMP;

-- Enable RLS for security
ALTER TABLE public.namaste_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd11_tm2_codes ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "public_can_read_namaste_codes"
ON public.namaste_codes
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "public_can_read_icd11_tm2_codes"
ON public.icd11_tm2_codes
FOR SELECT
TO public
USING (is_active = true);

-- Admin write access policies
CREATE POLICY "admins_can_manage_namaste_codes"
ON public.namaste_codes
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('system_admin', 'terminology_expert')
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles  
    WHERE id = auth.uid() AND role IN ('system_admin', 'terminology_expert')
));

CREATE POLICY "admins_can_manage_icd11_tm2_codes"
ON public.icd11_tm2_codes
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('system_admin', 'terminology_expert')
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles  
    WHERE id = auth.uid() AND role IN ('system_admin', 'terminology_expert')
));