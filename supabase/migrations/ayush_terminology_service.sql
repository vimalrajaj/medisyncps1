-- Location: supabase/migrations/20250927064425_ayush_terminology_service.sql
-- Schema Analysis: Fresh project - no existing tables found
-- Integration Type: Complete new module - AYUSH Terminology Service 
-- Dependencies: Fresh auth and terminology management system

-- 1. Extensions & Types
CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'viewer');
CREATE TYPE public.terminology_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE public.upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.api_client_status AS ENUM ('active', 'inactive', 'suspended');

-- 2. Core Tables

-- User profiles table (intermediary for auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'viewer'::public.user_role,
    organization TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Terminology mappings - core functionality
CREATE TABLE public.terminology_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ayush_code TEXT NOT NULL,
    ayush_term TEXT NOT NULL,
    icd11_code TEXT,
    icd11_term TEXT,
    mapping_confidence DECIMAL(3,2) CHECK (mapping_confidence >= 0.0 AND mapping_confidence <= 1.0),
    status public.terminology_status DEFAULT 'draft'::public.terminology_status,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- File uploads tracking
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    upload_status public.upload_status DEFAULT 'pending'::public.upload_status,
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    processed_records INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    error_message TEXT,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- API clients for external access
CREATE TABLE public.api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_key TEXT NOT NULL UNIQUE,
    organization TEXT,
    contact_email TEXT NOT NULL,
    status public.api_client_status DEFAULT 'active'::public.api_client_status,
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.api_clients(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System notifications
CREATE TABLE public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, error, success
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_terminology_mappings_ayush_code ON public.terminology_mappings(ayush_code);
CREATE INDEX idx_terminology_mappings_icd11_code ON public.terminology_mappings(icd11_code);
CREATE INDEX idx_terminology_mappings_status ON public.terminology_mappings(status);
CREATE INDEX idx_terminology_mappings_created_by ON public.terminology_mappings(created_by);
CREATE INDEX idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_status ON public.file_uploads(upload_status);
CREATE INDEX idx_api_clients_client_key ON public.api_clients(client_key);
CREATE INDEX idx_api_clients_status ON public.api_clients(status);
CREATE INDEX idx_api_usage_logs_client_id ON public.api_usage_logs(client_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_system_notifications_user_id ON public.system_notifications(user_id);
CREATE INDEX idx_system_notifications_is_read ON public.system_notifications(is_read);

-- 4. Functions (MUST BE BEFORE RLS POLICIES)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin' AND up.is_active = true
)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_terminology()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role IN ('admin', 'doctor') 
    AND up.is_active = true
)
$$;

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'viewer'::public.user_role)
    );
    RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Pattern 1: Core user table (user_profiles) - Simple only, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 4: Public read, admin write for terminology mappings
CREATE POLICY "public_can_read_terminology_mappings"
ON public.terminology_mappings
FOR SELECT
TO public
USING (status = 'approved'::public.terminology_status);

CREATE POLICY "authenticated_can_create_terminology_mappings"
ON public.terminology_mappings
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_terminology() AND created_by = auth.uid());

CREATE POLICY "users_can_update_own_terminology_mappings"
ON public.terminology_mappings
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin_user())
WITH CHECK (created_by = auth.uid() OR public.is_admin_user());

CREATE POLICY "admins_can_delete_terminology_mappings"
ON public.terminology_mappings
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- Pattern 2: Simple user ownership for file uploads
CREATE POLICY "users_manage_own_file_uploads"
ON public.file_uploads
FOR ALL
TO authenticated
USING (uploaded_by = auth.uid() OR public.is_admin_user())
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin_user());

-- Admin-only access for API clients
CREATE POLICY "admins_manage_api_clients"
ON public.api_clients
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Read-only access for API usage logs (admins can see all, users can see their client's logs)
CREATE POLICY "admins_view_all_api_usage_logs"
ON public.api_usage_logs
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Pattern 2: Simple user ownership for notifications
CREATE POLICY "users_manage_own_system_notifications"
ON public.system_notifications
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can create notifications for any user
CREATE POLICY "admins_create_system_notifications"
ON public.system_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- 7. Triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terminology_mappings_updated_at
    BEFORE UPDATE ON public.terminology_mappings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at
    BEFORE UPDATE ON public.file_uploads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_clients_updated_at
    BEFORE UPDATE ON public.api_clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    doctor_uuid UUID := gen_random_uuid();
    viewer_uuid UUID := gen_random_uuid();
    terminology1_uuid UUID := gen_random_uuid();
    terminology2_uuid UUID := gen_random_uuid();
    upload1_uuid UUID := gen_random_uuid();
    client1_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@ayush.gov.in', crypt('Admin@123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Admin User", "role": "admin"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (doctor_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'doctor@ayush.clinic', crypt('Doctor@123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Dr. Ayush Practitioner", "role": "doctor"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (viewer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'viewer@ayush.org', crypt('Viewer@123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Research Viewer", "role": "viewer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create terminology mappings
    INSERT INTO public.terminology_mappings (id, ayush_code, ayush_term, icd11_code, icd11_term, mapping_confidence, status, created_by, notes) VALUES
        (terminology1_uuid, 'AY001', 'Vata Dosha Imbalance', '8B20', 'Constitutional factors affecting health status', 0.85, 'approved'::public.terminology_status, admin_uuid, 'High confidence mapping based on WHO ICD-11 review'),
        (terminology2_uuid, 'AY002', 'Pitta Aggravation', '8B21', 'Lifestyle factors affecting health status', 0.78, 'pending'::public.terminology_status, doctor_uuid, 'Under review for clinical validation');

    -- Create file upload record
    INSERT INTO public.file_uploads (id, filename, file_size, file_type, upload_status, uploaded_by, processed_records, total_records, file_path) VALUES
        (upload1_uuid, 'ayush_terminology_batch_001.csv', 2048576, 'text/csv', 'completed'::public.upload_status, admin_uuid, 150, 150, '/uploads/2024/terminology_batch_001.csv');

    -- Create API client
    INSERT INTO public.api_clients (id, client_name, client_key, organization, contact_email, status, rate_limit, created_by) VALUES
        (client1_uuid, 'AIIMS Delhi Integration', 'ayush_api_key_2024_system_integration', 'All Institute of Medical Sciences', 'tech@aiims.edu', 'active'::public.api_client_status, 5000, admin_uuid);

    -- Create API usage logs
    INSERT INTO public.api_usage_logs (client_id, endpoint, method, request_count, response_time_ms, status_code) VALUES
        (client1_uuid, '/api/v1/terminology/search', 'GET', 25, 120, 200),
        (client1_uuid, '/api/v1/terminology/mappings', 'GET', 15, 95, 200),
        (client1_uuid, '/api/v1/terminology/validate', 'POST', 8, 210, 200);

    -- Create system notifications
    INSERT INTO public.system_notifications (title, message, type, user_id) VALUES
        ('System Maintenance', 'Scheduled maintenance will occur on Sunday 2AM-4AM IST', 'warning', admin_uuid),
        ('New Terminology Batch', 'Successfully processed 150 new terminology mappings', 'success', admin_uuid),
        ('WHO ICD-11 Sync', 'Daily synchronization with WHO ICD-11 database completed successfully', 'info', doctor_uuid);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;