


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."api_client_status" AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE "public"."api_client_status" OWNER TO "postgres";


CREATE TYPE "public"."terminology_status" AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."terminology_status" OWNER TO "postgres";


CREATE TYPE "public"."upload_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."upload_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'doctor',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_terminology"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role IN ('admin', 'doctor') 
    AND up.is_active = true
)
$$;


ALTER FUNCTION "public"."can_manage_terminology"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin' AND up.is_active = true
)
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "client_key" "text" NOT NULL,
    "organization" "text",
    "contact_email" "text" NOT NULL,
    "status" "public"."api_client_status" DEFAULT 'active'::"public"."api_client_status",
    "rate_limit" integer DEFAULT 1000,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."api_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "response_time_ms" integer,
    "status_code" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."api_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fhir_bundles" (
    "id" integer NOT NULL,
    "bundle_id" character varying(255) NOT NULL,
    "bundle_type" character varying(50) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fhir_bundles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fhir_bundles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fhir_bundles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fhir_bundles_id_seq" OWNED BY "public"."fhir_bundles"."id";



CREATE TABLE IF NOT EXISTS "public"."fhir_conditions" (
    "id" integer NOT NULL,
    "resource_id" character varying(255) NOT NULL,
    "patient_id" character varying(255),
    "status" character varying(50),
    "namaste_code" character varying(50),
    "namaste_display" "text",
    "icd11_code" character varying(50),
    "icd11_display" "text",
    "recorded_date" timestamp with time zone,
    "content" "jsonb" NOT NULL,
    "bundle_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fhir_conditions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fhir_conditions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fhir_conditions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fhir_conditions_id_seq" OWNED BY "public"."fhir_conditions"."id";



CREATE TABLE IF NOT EXISTS "public"."fhir_observations" (
    "id" integer NOT NULL,
    "resource_id" character varying(255) NOT NULL,
    "patient_id" character varying(255),
    "status" character varying(50),
    "code" character varying(50),
    "value_type" character varying(50),
    "value_data" "jsonb",
    "effective_date" timestamp with time zone,
    "content" "jsonb" NOT NULL,
    "bundle_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fhir_observations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fhir_observations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fhir_observations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fhir_observations_id_seq" OWNED BY "public"."fhir_observations"."id";



CREATE TABLE IF NOT EXISTS "public"."fhir_patients" (
    "id" integer NOT NULL,
    "resource_id" character varying(255) NOT NULL,
    "identifier" character varying(255),
    "name" character varying(255),
    "content" "jsonb" NOT NULL,
    "bundle_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fhir_patients" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."fhir_patients_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."fhir_patients_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."fhir_patients_id_seq" OWNED BY "public"."fhir_patients"."id";



CREATE TABLE IF NOT EXISTS "public"."file_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" "text" NOT NULL,
    "file_size" bigint,
    "file_type" "text",
    "upload_status" "public"."upload_status" DEFAULT 'pending'::"public"."upload_status",
    "uploaded_by" "uuid",
    "processed_records" integer DEFAULT 0,
    "total_records" integer DEFAULT 0,
    "error_message" "text",
    "file_path" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."file_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."icd11_tm2_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "icd11_tm2_code" "text" NOT NULL,
    "icd11_tm2_display" "text" NOT NULL,
    "icd11_tm2_description" "text",
    "icd11_biomed_code" "text",
    "icd11_biomed_display" "text",
    "icd11_biomed_description" "text",
    "equivalence" "text",
    "confidence" numeric(3,2),
    "mapping_method" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."icd11_tm2_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."namaste_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "namaste_code" "text" NOT NULL,
    "namaste_display" "text" NOT NULL,
    "namaste_description" "text",
    "category" "text",
    "ayush_system" "text" DEFAULT 'Ayurveda'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."namaste_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "user_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."system_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."terminology_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ayush_code" "text" NOT NULL,
    "ayush_term" "text" NOT NULL,
    "icd11_code" "text",
    "icd11_term" "text",
    "mapping_confidence" numeric(3,2),
    "status" "public"."terminology_status" DEFAULT 'draft'::"public"."terminology_status",
    "created_by" "uuid",
    "approved_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "equivalence" "text",
    "mapping_method" "text" DEFAULT 'curated_alignment'::"text",
    "clinical_evidence" "text",
    CONSTRAINT "terminology_mappings_mapping_confidence_check" CHECK ((("mapping_confidence" >= 0.0) AND ("mapping_confidence" <= 1.0)))
);


ALTER TABLE "public"."terminology_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role",
    "organization" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."fhir_bundles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fhir_bundles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fhir_conditions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fhir_conditions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fhir_observations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fhir_observations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."fhir_patients" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."fhir_patients_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_clients"
    ADD CONSTRAINT "api_clients_client_key_key" UNIQUE ("client_key");



ALTER TABLE ONLY "public"."api_clients"
    ADD CONSTRAINT "api_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_bundles"
    ADD CONSTRAINT "fhir_bundles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_conditions"
    ADD CONSTRAINT "fhir_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_conditions"
    ADD CONSTRAINT "fhir_conditions_resource_id_key" UNIQUE ("resource_id");



ALTER TABLE ONLY "public"."fhir_observations"
    ADD CONSTRAINT "fhir_observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_observations"
    ADD CONSTRAINT "fhir_observations_resource_id_key" UNIQUE ("resource_id");



ALTER TABLE ONLY "public"."fhir_patients"
    ADD CONSTRAINT "fhir_patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fhir_patients"
    ADD CONSTRAINT "fhir_patients_resource_id_key" UNIQUE ("resource_id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."icd11_tm2_codes"
    ADD CONSTRAINT "icd11_tm2_codes_icd11_tm2_code_key" UNIQUE ("icd11_tm2_code");



ALTER TABLE ONLY "public"."icd11_tm2_codes"
    ADD CONSTRAINT "icd11_tm2_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."namaste_codes"
    ADD CONSTRAINT "namaste_codes_namaste_code_key" UNIQUE ("namaste_code");



ALTER TABLE ONLY "public"."namaste_codes"
    ADD CONSTRAINT "namaste_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_notifications"
    ADD CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."terminology_mappings"
    ADD CONSTRAINT "terminology_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "fhir_bundles_bundle_id_idx" ON "public"."fhir_bundles" USING "btree" ("bundle_id");



CREATE INDEX "fhir_bundles_timestamp_idx" ON "public"."fhir_bundles" USING "btree" ("timestamp");



CREATE INDEX "fhir_conditions_icd11_code_idx" ON "public"."fhir_conditions" USING "btree" ("icd11_code");



CREATE INDEX "fhir_conditions_namaste_code_idx" ON "public"."fhir_conditions" USING "btree" ("namaste_code");



CREATE INDEX "fhir_conditions_patient_id_idx" ON "public"."fhir_conditions" USING "btree" ("patient_id");



CREATE INDEX "fhir_conditions_resource_id_idx" ON "public"."fhir_conditions" USING "btree" ("resource_id");



CREATE INDEX "fhir_observations_code_idx" ON "public"."fhir_observations" USING "btree" ("code");



CREATE INDEX "fhir_observations_patient_id_idx" ON "public"."fhir_observations" USING "btree" ("patient_id");



CREATE INDEX "fhir_observations_resource_id_idx" ON "public"."fhir_observations" USING "btree" ("resource_id");



CREATE INDEX "fhir_patients_identifier_idx" ON "public"."fhir_patients" USING "btree" ("identifier");



CREATE INDEX "fhir_patients_resource_id_idx" ON "public"."fhir_patients" USING "btree" ("resource_id");



CREATE INDEX "idx_api_clients_client_key" ON "public"."api_clients" USING "btree" ("client_key");



CREATE INDEX "idx_api_clients_status" ON "public"."api_clients" USING "btree" ("status");



CREATE INDEX "idx_api_usage_logs_client_id" ON "public"."api_usage_logs" USING "btree" ("client_id");



CREATE INDEX "idx_api_usage_logs_created_at" ON "public"."api_usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_file_uploads_status" ON "public"."file_uploads" USING "btree" ("upload_status");



CREATE INDEX "idx_file_uploads_uploaded_by" ON "public"."file_uploads" USING "btree" ("uploaded_by");



CREATE INDEX "idx_icd11_tm2_codes_code" ON "public"."icd11_tm2_codes" USING "btree" ("icd11_tm2_code");



CREATE INDEX "idx_icd11_tm2_codes_display" ON "public"."icd11_tm2_codes" USING "btree" ("icd11_tm2_display");



CREATE INDEX "idx_namaste_codes_category" ON "public"."namaste_codes" USING "btree" ("category");



CREATE INDEX "idx_namaste_codes_code" ON "public"."namaste_codes" USING "btree" ("namaste_code");



CREATE INDEX "idx_namaste_codes_display" ON "public"."namaste_codes" USING "btree" ("namaste_display");



CREATE INDEX "idx_system_notifications_is_read" ON "public"."system_notifications" USING "btree" ("is_read");



CREATE INDEX "idx_system_notifications_user_id" ON "public"."system_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_terminology_mappings_ayush_code" ON "public"."terminology_mappings" USING "btree" ("ayush_code");



CREATE INDEX "idx_terminology_mappings_created_by" ON "public"."terminology_mappings" USING "btree" ("created_by");



CREATE INDEX "idx_terminology_mappings_icd11_code" ON "public"."terminology_mappings" USING "btree" ("icd11_code");



CREATE INDEX "idx_terminology_mappings_status" ON "public"."terminology_mappings" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_terminology_mappings_unique_pair" ON "public"."terminology_mappings" USING "btree" ("ayush_code", "icd11_code");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "update_api_clients_updated_at" BEFORE UPDATE ON "public"."api_clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_file_uploads_updated_at" BEFORE UPDATE ON "public"."file_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_terminology_mappings_updated_at" BEFORE UPDATE ON "public"."terminology_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."api_clients"
    ADD CONSTRAINT "api_clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fhir_conditions"
    ADD CONSTRAINT "fhir_conditions_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "public"."fhir_bundles"("id");



ALTER TABLE ONLY "public"."fhir_observations"
    ADD CONSTRAINT "fhir_observations_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "public"."fhir_bundles"("id");



ALTER TABLE ONLY "public"."fhir_patients"
    ADD CONSTRAINT "fhir_patients_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "public"."fhir_bundles"("id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_notifications"
    ADD CONSTRAINT "system_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terminology_mappings"
    ADD CONSTRAINT "terminology_mappings_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."terminology_mappings"
    ADD CONSTRAINT "terminology_mappings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "admins_can_delete_terminology_mappings" ON "public"."terminology_mappings" FOR DELETE TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "admins_create_system_notifications" ON "public"."system_notifications" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admins_manage_api_clients" ON "public"."api_clients" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admins_view_all_api_usage_logs" ON "public"."api_usage_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



ALTER TABLE "public"."api_clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_usage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_can_create_terminology_mappings" ON "public"."terminology_mappings" FOR INSERT TO "authenticated" WITH CHECK (("public"."can_manage_terminology"() AND ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."file_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."icd11_tm2_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."namaste_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_can_read_icd11_tm2_codes" ON "public"."icd11_tm2_codes" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_can_read_namaste_codes" ON "public"."namaste_codes" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_can_read_terminology_mappings" ON "public"."terminology_mappings" FOR SELECT USING (("status" = 'approved'::"public"."terminology_status"));



ALTER TABLE "public"."system_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."terminology_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_update_own_terminology_mappings" ON "public"."terminology_mappings" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR "public"."is_admin_user"())) WITH CHECK ((("created_by" = "auth"."uid"()) OR "public"."is_admin_user"()));



CREATE POLICY "users_manage_own_file_uploads" ON "public"."file_uploads" TO "authenticated" USING ((("uploaded_by" = "auth"."uid"()) OR "public"."is_admin_user"())) WITH CHECK ((("uploaded_by" = "auth"."uid"()) OR "public"."is_admin_user"()));



CREATE POLICY "users_manage_own_system_notifications" ON "public"."system_notifications" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_user_profiles" ON "public"."user_profiles" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."can_manage_terminology"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_terminology"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_terminology"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."api_clients" TO "anon";
GRANT ALL ON TABLE "public"."api_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."api_clients" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."fhir_bundles" TO "anon";
GRANT ALL ON TABLE "public"."fhir_bundles" TO "authenticated";
GRANT ALL ON TABLE "public"."fhir_bundles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fhir_bundles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fhir_bundles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fhir_bundles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fhir_conditions" TO "anon";
GRANT ALL ON TABLE "public"."fhir_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."fhir_conditions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fhir_conditions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fhir_conditions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fhir_conditions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fhir_observations" TO "anon";
GRANT ALL ON TABLE "public"."fhir_observations" TO "authenticated";
GRANT ALL ON TABLE "public"."fhir_observations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fhir_observations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fhir_observations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fhir_observations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fhir_patients" TO "anon";
GRANT ALL ON TABLE "public"."fhir_patients" TO "authenticated";
GRANT ALL ON TABLE "public"."fhir_patients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fhir_patients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fhir_patients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fhir_patients_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."file_uploads" TO "anon";
GRANT ALL ON TABLE "public"."file_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."file_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."icd11_tm2_codes" TO "anon";
GRANT ALL ON TABLE "public"."icd11_tm2_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."icd11_tm2_codes" TO "service_role";



GRANT ALL ON TABLE "public"."namaste_codes" TO "anon";
GRANT ALL ON TABLE "public"."namaste_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."namaste_codes" TO "service_role";



GRANT ALL ON TABLE "public"."system_notifications" TO "anon";
GRANT ALL ON TABLE "public"."system_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."system_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."terminology_mappings" TO "anon";
GRANT ALL ON TABLE "public"."terminology_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."terminology_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
