import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1712448000000 implements MigrationInterface {
  name = 'InitialSchema1712448000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================================================
    // Extensions
    // ========================================================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

    // ========================================================================
    // ENUMs
    // ========================================================================
    await queryRunner.query(
      `CREATE TYPE "user_role" AS ENUM ('admin','issuer','candidate','recruiter')`,
    );
    await queryRunner.query(
      `CREATE TYPE "account_status" AS ENUM ('active','inactive','suspended','pending_verification')`,
    );
    await queryRunner.query(
      `CREATE TYPE "approval_status" AS ENUM ('pending','approved','rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "credential_status" AS ENUM ('pending','issued','revoked','reissued')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tx_status" AS ENUM ('queued','submitted','confirmed','failed','retrying')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tx_type" AS ENUM ('issue_credential','revoke_credential','add_issuer','remove_issuer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "application_status" AS ENUM ('applied','reviewing','shortlisted','interview','offered','rejected','withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TYPE "job_status" AS ENUM ('draft','open','closed','expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "batch_status" AS ENUM ('uploading','validating','processing','completed','failed','partially_completed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "credential_category" AS ENUM ('degree','it_certificate','language_certificate','award','professional_certificate','other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "verification_result" AS ENUM ('valid','invalid','revoked','not_found','error')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_type" AS ENUM (
        'credential_issued','credential_revoked','credential_reissued',
        'application_received','application_status_changed','job_recommendation',
        'institution_approved','institution_rejected','system_announcement'
      )`,
    );

    // ========================================================================
    // Generic updated_at trigger function
    // ========================================================================
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trustlink_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ========================================================================
    // Group 1: Identity & Access
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "user_role" NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20),
        "avatar_url" VARCHAR(500),
        "status" "account_status" NOT NULL DEFAULT 'active',
        "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users"("role")`);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users"("status")`);

    await queryRunner.query(`
      CREATE TABLE "institutions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "name" VARCHAR(500) NOT NULL,
        "name_en" VARCHAR(500),
        "abbreviation" VARCHAR(50),
        "institution_type" VARCHAR(100) NOT NULL,
        "tax_code" VARCHAR(50),
        "website" VARCHAR(500),
        "logo_url" VARCHAR(500),
        "address" TEXT,
        "city" VARCHAR(100),
        "country" VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
        "description" TEXT,
        "approval_status" "approval_status" NOT NULL DEFAULT 'pending',
        "approved_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "rejection_reason" TEXT,
        "blockchain_address" VARCHAR(42),
        "did_identifier" VARCHAR(500),
        "signing_public_key" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_institutions_approval_status" ON "institutions"("approval_status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "candidate_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "date_of_birth" DATE,
        "gender" VARCHAR(20),
        "bio" TEXT,
        "resume_url" VARCHAR(500),
        "linkedin_url" VARCHAR(500),
        "github_url" VARCHAR(500),
        "portfolio_url" VARCHAR(500),
        "years_of_experience" SMALLINT NOT NULL DEFAULT 0,
        "desired_position" VARCHAR(255),
        "desired_salary_min" INTEGER,
        "desired_salary_max" INTEGER,
        "preferred_locations" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "is_open_to_work" BOOLEAN NOT NULL DEFAULT TRUE,
        "profile_completeness" SMALLINT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "recruiter_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "company_name" VARCHAR(500) NOT NULL,
        "company_name_en" VARCHAR(500),
        "company_logo_url" VARCHAR(500),
        "industry" VARCHAR(255),
        "company_size" VARCHAR(50),
        "company_website" VARCHAR(500),
        "company_address" TEXT,
        "city" VARCHAR(100),
        "country" VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
        "description" TEXT,
        "tax_code" VARCHAR(50),
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(255) NOT NULL UNIQUE,
        "device_info" VARCHAR(500),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(255) NOT NULL UNIQUE,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id")`,
    );

    // ========================================================================
    // Group 2: Hybrid RBAC
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "actions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" VARCHAR(100) NOT NULL UNIQUE,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "module" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_actions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "role" "user_role" NOT NULL,
        "action_id" UUID NOT NULL REFERENCES "actions"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_role_actions_role_action" UNIQUE ("role","action_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_action_overrides" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "action_id" UUID NOT NULL REFERENCES "actions"("id") ON DELETE CASCADE,
        "is_enabled" BOOLEAN NOT NULL,
        "reason" TEXT,
        "overridden_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_user_action_overrides_user_action" UNIQUE ("user_id","action_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_user_action_overrides_disabled" ON "user_action_overrides"("user_id","action_id") WHERE "is_enabled" = FALSE`,
    );

    // ========================================================================
    // Group 3: Credential Management
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "credential_types" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "category" "credential_category" NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "name_en" VARCHAR(255),
        "description" TEXT,
        "field_schema" JSONB NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "batch_imports" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "institution_id" UUID REFERENCES "institutions"("id") ON DELETE SET NULL,
        "initiated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "credential_type_id" UUID REFERENCES "credential_types"("id") ON DELETE SET NULL,
        "original_filename" VARCHAR(500) NOT NULL,
        "file_url" VARCHAR(500),
        "status" "batch_status" NOT NULL DEFAULT 'uploading',
        "total_rows" INTEGER NOT NULL DEFAULT 0,
        "processed_rows" INTEGER NOT NULL DEFAULT 0,
        "success_count" INTEGER NOT NULL DEFAULT 0,
        "error_count" INTEGER NOT NULL DEFAULT 0,
        "error_report" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_batch_imports_institution_id" ON "batch_imports"("institution_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_batch_imports_status" ON "batch_imports"("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "credentials" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "credential_number" VARCHAR(100) NOT NULL,
        "credential_type_id" UUID REFERENCES "credential_types"("id") ON DELETE SET NULL,
        "institution_id" UUID REFERENCES "institutions"("id") ON DELETE SET NULL,
        "candidate_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "title" VARCHAR(500) NOT NULL,
        "issued_date" DATE NOT NULL,
        "expiry_date" DATE,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "extracted_skills" TEXT[] NOT NULL DEFAULT '{}',
        "status" "credential_status" NOT NULL DEFAULT 'pending',
        "credential_hash" VARCHAR(66),
        "blockchain_tx_hash" VARCHAR(66),
        "blockchain_block_number" BIGINT,
        "blockchain_timestamp" TIMESTAMPTZ,
        "vc_jwt" TEXT,
        "vc_json" JSONB,
        "issuer_did" VARCHAR(500),
        "digital_signature" TEXT,
        "revoked_at" TIMESTAMPTZ,
        "revocation_reason" TEXT,
        "reissued_from_id" UUID REFERENCES "credentials"("id") ON DELETE SET NULL,
        "reissued_to_id" UUID REFERENCES "credentials"("id") ON DELETE SET NULL,
        "batch_import_id" UUID REFERENCES "batch_imports"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_credentials_number_institution" UNIQUE ("credential_number","institution_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_credentials_candidate_id" ON "credentials"("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_credentials_institution_id" ON "credentials"("institution_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_credentials_status" ON "credentials"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_credentials_credential_hash" ON "credentials"("credential_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_credentials_extracted_skills" ON "credentials" USING GIN ("extracted_skills")`,
    );

    await queryRunner.query(`
      CREATE TABLE "verification_cache" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "credential_id" UUID REFERENCES "credentials"("id") ON DELETE CASCADE,
        "credential_hash" VARCHAR(66) NOT NULL,
        "result" "verification_result" NOT NULL,
        "on_chain_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "vc_signature_valid" BOOLEAN NOT NULL DEFAULT FALSE,
        "issuer_authorized" BOOLEAN NOT NULL DEFAULT FALSE,
        "verification_details" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "verified_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "verified_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_verification_cache_credential_id" ON "verification_cache"("credential_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_verification_cache_expires_at" ON "verification_cache"("expires_at")`,
    );

    // ========================================================================
    // Group 4: Blockchain
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "blockchain_transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "transaction_type" "tx_type" NOT NULL,
        "status" "tx_status" NOT NULL DEFAULT 'queued',
        "credential_id" UUID REFERENCES "credentials"("id") ON DELETE SET NULL,
        "institution_id" UUID REFERENCES "institutions"("id") ON DELETE SET NULL,
        "initiated_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "tx_hash" VARCHAR(66),
        "block_number" BIGINT,
        "gas_used" BIGINT,
        "gas_price" BIGINT,
        "nonce" INTEGER,
        "contract_method" VARCHAR(100) NOT NULL,
        "contract_params" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "retry_count" SMALLINT NOT NULL DEFAULT 0,
        "max_retries" SMALLINT NOT NULL DEFAULT 3,
        "error_message" TEXT,
        "last_error_at" TIMESTAMPTZ,
        "queued_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "submitted_at" TIMESTAMPTZ,
        "confirmed_at" TIMESTAMPTZ,
        "failed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_status" ON "blockchain_transactions"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_tx_hash" ON "blockchain_transactions"("tx_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_credential_id" ON "blockchain_transactions"("credential_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_queued" ON "blockchain_transactions"("queued_at") WHERE status = 'queued'`,
    );

    // ========================================================================
    // Group 5: AI Matching
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "candidate_skills" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "skill_name" VARCHAR(255) NOT NULL,
        "skill_name_normalized" VARCHAR(255) NOT NULL,
        "proficiency_level" VARCHAR(50),
        "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "source_credential_id" UUID REFERENCES "credentials"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_candidate_skills_candidate_skill" UNIQUE ("candidate_id","skill_name_normalized")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_candidate_skills_candidate_id" ON "candidate_skills"("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_candidate_skills_skill_name_normalized" ON "candidate_skills"("skill_name_normalized")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_candidate_skills_verified" ON "candidate_skills"("is_verified") WHERE "is_verified" = TRUE`,
    );

    await queryRunner.query(`
      CREATE TABLE "candidate_embeddings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "source_text" TEXT NOT NULL,
        "embedding" vector(384) NOT NULL,
        "model_version" VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
        "credentials_hash" VARCHAR(64),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_candidate_embeddings_vector" ON "candidate_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100)`,
    );

    // jobs (defined here so job_embeddings can FK it)
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recruiter_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT NOT NULL,
        "requirements" TEXT,
        "benefits" TEXT,
        "job_type" VARCHAR(50) NOT NULL DEFAULT 'full_time',
        "experience_level" VARCHAR(50),
        "industry" VARCHAR(255),
        "location" VARCHAR(255),
        "city" VARCHAR(100),
        "is_remote" BOOLEAN NOT NULL DEFAULT FALSE,
        "salary_min" INTEGER,
        "salary_max" INTEGER,
        "salary_visible" BOOLEAN NOT NULL DEFAULT TRUE,
        "required_skills" TEXT[] NOT NULL DEFAULT '{}',
        "preferred_skills" TEXT[] NOT NULL DEFAULT '{}',
        "required_credential_types" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "status" "job_status" NOT NULL DEFAULT 'draft',
        "application_deadline" DATE,
        "max_applications" INTEGER,
        "view_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_jobs_recruiter_id" ON "jobs"("recruiter_id")`);
    await queryRunner.query(`CREATE INDEX "idx_jobs_status" ON "jobs"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_jobs_city" ON "jobs"("city")`);
    await queryRunner.query(
      `CREATE INDEX "idx_jobs_required_skills" ON "jobs" USING GIN ("required_skills")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_jobs_title_trgm" ON "jobs" USING GIN ("title" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_institutions_name_trgm" ON "institutions" USING GIN ("name" gin_trgm_ops)`,
    );

    await queryRunner.query(`
      CREATE TABLE "job_embeddings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_id" UUID NOT NULL UNIQUE REFERENCES "jobs"("id") ON DELETE CASCADE,
        "source_text" TEXT NOT NULL,
        "embedding" vector(384) NOT NULL,
        "model_version" VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
        "content_hash" VARCHAR(64),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_job_embeddings_vector" ON "job_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 50)`,
    );

    // ========================================================================
    // Group 6: Recruitment (applications + match_scores)
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "candidate_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "cover_letter" TEXT,
        "resume_url" VARCHAR(500),
        "match_score" NUMERIC(5,2),
        "keyword_score" NUMERIC(5,2),
        "semantic_score" NUMERIC(5,2),
        "verified_bonus" NUMERIC(5,2),
        "score_breakdown" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "status" "application_status" NOT NULL DEFAULT 'applied',
        "status_changed_at" TIMESTAMPTZ,
        "recruiter_notes" TEXT,
        "credentials_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "verified_credential_ids" UUID[] NOT NULL DEFAULT '{}'::uuid[],
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_applications_job_candidate" UNIQUE ("job_id","candidate_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_applications_job_id" ON "applications"("job_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_applications_candidate_id" ON "applications"("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_applications_status" ON "applications"("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "match_scores" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "keyword_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "semantic_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "verified_bonus" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "total_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "is_stale" BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT "uq_match_scores_candidate_job" UNIQUE ("candidate_id","job_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_match_scores_total_score" ON "match_scores"("total_score")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_match_scores_is_stale" ON "match_scores"("is_stale")`,
    );

    // ========================================================================
    // Group 7: System
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "notification_type" NOT NULL,
        "title" VARCHAR(500) NOT NULL,
        "message" TEXT NOT NULL,
        "reference_type" VARCHAR(50),
        "reference_id" UUID,
        "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_type" ON "notifications"("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id","is_read") WHERE "is_read" = FALSE`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "action" VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" UUID,
        "old_values" JSONB,
        "new_values" JSONB,
        "ip_address" INET,
        "user_agent" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type","entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action")`,
    );

    // ========================================================================
    // updated_at triggers — attach to every table that has the column
    // ========================================================================
    const tablesWithUpdatedAt = [
      'users',
      'institutions',
      'candidate_profiles',
      'recruiter_profiles',
      'user_action_overrides',
      'credential_types',
      'credentials',
      'batch_imports',
      'blockchain_transactions',
      'candidate_skills',
      'candidate_embeddings',
      'job_embeddings',
      'jobs',
      'applications',
    ];
    for (const table of tablesWithUpdatedAt) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW
        EXECUTE FUNCTION trustlink_set_updated_at();
      `);
    }

    // ========================================================================
    // Verification cache invalidation trigger
    // When credential.status changes, drop any cached verification rows for it.
    // ========================================================================
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trustlink_invalidate_verification_cache()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
          DELETE FROM "verification_cache" WHERE "credential_id" = NEW.id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_credentials_invalidate_verification_cache
      AFTER UPDATE OF status ON "credentials"
      FOR EACH ROW
      EXECUTE FUNCTION trustlink_invalidate_verification_cache();
    `);

    // ========================================================================
    // Match scores staleness trigger
    // When credentials or candidate_skills change for a candidate, mark all
    // their cached match_scores as stale.
    // ========================================================================
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trustlink_mark_match_scores_stale()
      RETURNS TRIGGER AS $$
      DECLARE
        v_candidate_id UUID;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          v_candidate_id := OLD.candidate_id;
        ELSE
          v_candidate_id := NEW.candidate_id;
        END IF;

        IF v_candidate_id IS NOT NULL THEN
          UPDATE "match_scores"
            SET "is_stale" = TRUE
            WHERE "candidate_id" = v_candidate_id AND "is_stale" = FALSE;
        END IF;

        IF (TG_OP = 'DELETE') THEN
          RETURN OLD;
        ELSE
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_credentials_match_scores_stale
      AFTER INSERT OR UPDATE OR DELETE ON "credentials"
      FOR EACH ROW
      EXECUTE FUNCTION trustlink_mark_match_scores_stale();
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_candidate_skills_match_scores_stale
      AFTER INSERT OR UPDATE OR DELETE ON "candidate_skills"
      FOR EACH ROW
      EXECUTE FUNCTION trustlink_mark_match_scores_stale();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_candidate_skills_match_scores_stale ON "candidate_skills"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_credentials_match_scores_stale ON "credentials"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS trustlink_mark_match_scores_stale()`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_credentials_invalidate_verification_cache ON "credentials"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS trustlink_invalidate_verification_cache()`,
    );

    const tablesWithUpdatedAt = [
      'users',
      'institutions',
      'candidate_profiles',
      'recruiter_profiles',
      'user_action_overrides',
      'credential_types',
      'credentials',
      'batch_imports',
      'blockchain_transactions',
      'candidate_skills',
      'candidate_embeddings',
      'job_embeddings',
      'jobs',
      'applications',
    ];
    for (const table of tablesWithUpdatedAt) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS trg_${table}_updated_at ON "${table}"`,
      );
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS trustlink_set_updated_at()`);

    // Tables (reverse dependency order)
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "match_scores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_embeddings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidate_embeddings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidate_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blockchain_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_cache"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credentials"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "batch_imports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_action_overrides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recruiter_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "candidate_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "institutions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Enums
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verification_result"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_category"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "batch_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "application_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tx_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tx_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
