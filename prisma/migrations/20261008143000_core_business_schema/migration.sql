-- Issue #3 core business schema.
-- Keeps provider-specific storage/payment concerns behind generic identifiers.

CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'PAYER', 'TEACHER', 'ADMIN');
CREATE TYPE "RelationshipType" AS ENUM ('GUARDIAN', 'PAYER', 'GUARDIAN_AND_PAYER');
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE "VerificationCaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ApprovalScopeStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "ClassLifecycleState" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED_TO_RENEWAL', 'ENDED');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "StoredObjectStatus" AS ENUM ('ACTIVE', 'QUARANTINED', 'DELETED');
CREATE TYPE "SubscriptionState" AS ENUM ('PENDING', 'ACTIVE', 'GRACE', 'CANCEL_SCHEDULED', 'ENDED');
CREATE TYPE "EnrollmentState" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');
CREATE TYPE "EntitlementState" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED');
CREATE TYPE "PaymentAttemptState" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "RefundState" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "PayoutState" AS ENUM ('PENDING', 'HELD', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED');

CREATE TABLE "user_accounts" (
  "id" TEXT NOT NULL,
  "clerk_subject" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_accounts_clerk_subject_key" ON "user_accounts"("clerk_subject");

CREATE TABLE "role_assignments" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "role_assignments_user_id_role_key" ON "role_assignments"("user_id","role");

CREATE TABLE "guardian_learner_relationships" (
  "id" TEXT NOT NULL,
  "guardian_payer_user_id" TEXT NOT NULL,
  "learner_user_id" TEXT NOT NULL,
  "relationship_type" "RelationshipType" NOT NULL,
  "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guardian_learner_relationships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardian_learner_distinct_users" CHECK ("guardian_payer_user_id" <> "learner_user_id")
);
CREATE UNIQUE INDEX "guardian_learner_relationships_guardian_payer_user_id_learner_user_id_relationship_type_key"
  ON "guardian_learner_relationships"("guardian_payer_user_id","learner_user_id","relationship_type");
CREATE INDEX "guardian_learner_relationships_learner_user_id_status_idx"
  ON "guardian_learner_relationships"("learner_user_id","status");

CREATE TABLE "teacher_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

CREATE TABLE "teacher_verification_cases" (
  "id" TEXT NOT NULL,
  "teacher_profile_id" TEXT NOT NULL,
  "status" "VerificationCaseStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_user_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_verification_cases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "teacher_verification_cases_teacher_profile_id_status_idx"
  ON "teacher_verification_cases"("teacher_profile_id","status");

CREATE TABLE "curricula" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "curricula_code_key" ON "curricula"("code");

CREATE TABLE "education_levels" (
  "id" TEXT NOT NULL,
  "curriculum_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "education_levels_curriculum_id_code_key" ON "education_levels"("curriculum_id","code");

CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

CREATE TABLE "subject_levels" (
  "id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "education_level_id" TEXT NOT NULL,
  CONSTRAINT "subject_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subject_levels_subject_id_education_level_id_key" ON "subject_levels"("subject_id","education_level_id");

CREATE TABLE "teacher_approval_scopes" (
  "id" TEXT NOT NULL,
  "teacher_profile_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "education_level_id" TEXT NOT NULL,
  "status" "ApprovalScopeStatus" NOT NULL DEFAULT 'ACTIVE',
  "approved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_approval_scopes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "teacher_approval_scopes_teacher_profile_id_subject_id_education_level_id_key"
  ON "teacher_approval_scopes"("teacher_profile_id","subject_id","education_level_id");
CREATE INDEX "teacher_approval_scopes_status_idx" ON "teacher_approval_scopes"("status");

CREATE TABLE "class_offerings" (
  "id" TEXT NOT NULL,
  "teacher_profile_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "education_level_id" TEXT NOT NULL,
  "lifecycle_state" "ClassLifecycleState" NOT NULL DEFAULT 'DRAFT',
  "capacity" INTEGER,
  "current_price_version_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_offerings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_offerings_capacity_check" CHECK ("capacity" IS NULL OR "capacity" >= 0)
);
CREATE UNIQUE INDEX "class_offerings_current_price_version_id_key" ON "class_offerings"("current_price_version_id");
CREATE INDEX "class_offerings_lifecycle_state_subject_id_education_level_id_idx"
  ON "class_offerings"("lifecycle_state","subject_id","education_level_id");

CREATE TABLE "class_price_versions" (
  "id" TEXT NOT NULL,
  "class_id" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_price_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_price_versions_amount_check" CHECK ("amount_minor" >= 0),
  CONSTRAINT "class_price_versions_period_check" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
);
CREATE INDEX "class_price_versions_class_id_effective_from_idx" ON "class_price_versions"("class_id","effective_from");

CREATE TABLE "class_sessions" (
  "id" TEXT NOT NULL,
  "class_id" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
  "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_sessions_period_check" CHECK ("ends_at" > "starts_at")
);
CREATE INDEX "class_sessions_class_id_starts_at_idx" ON "class_sessions"("class_id","starts_at");

CREATE TABLE "stored_objects" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "original_filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "checksum" TEXT,
  "created_by_user_id" TEXT,
  "status" "StoredObjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "retention_until" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stored_objects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stored_objects_size_check" CHECK ("size_bytes" >= 0)
);
CREATE UNIQUE INDEX "stored_objects_provider_storage_key_key" ON "stored_objects"("provider","storage_key");
CREATE INDEX "stored_objects_status_retention_until_idx" ON "stored_objects"("status","retention_until");

CREATE TABLE "verification_documents" (
  "id" TEXT NOT NULL,
  "verification_case_id" TEXT NOT NULL,
  "stored_object_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "verification_documents_verification_case_id_stored_object_id_key"
  ON "verification_documents"("verification_case_id","stored_object_id");

CREATE TABLE "commission_versions" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "basis_points" INTEGER NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commission_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commission_versions_basis_points_check" CHECK ("basis_points" BETWEEN 0 AND 10000),
  CONSTRAINT "commission_versions_period_check" CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from")
);
CREATE INDEX "commission_versions_effective_from_idx" ON "commission_versions"("effective_from");

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "payer_user_id" TEXT NOT NULL,
  "learner_user_id" TEXT NOT NULL,
  "class_id" TEXT NOT NULL,
  "price_version_id" TEXT NOT NULL,
  "state" "SubscriptionState" NOT NULL DEFAULT 'PENDING',
  "agreed_amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "original_billing_day" INTEGER NOT NULL,
  "current_period_start_at" TIMESTAMP(3),
  "current_period_end_at" TIMESTAMP(3),
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_amount_check" CHECK ("agreed_amount_minor" >= 0),
  CONSTRAINT "subscriptions_anchor_day_check" CHECK ("original_billing_day" BETWEEN 1 AND 31),
  CONSTRAINT "subscriptions_period_check" CHECK ("current_period_end_at" IS NULL OR "current_period_start_at" IS NULL OR "current_period_end_at" > "current_period_start_at")
);
CREATE INDEX "subscriptions_payer_user_id_class_id_state_idx" ON "subscriptions"("payer_user_id","class_id","state");
CREATE INDEX "subscriptions_learner_user_id_class_id_state_idx" ON "subscriptions"("learner_user_id","class_id","state");
CREATE UNIQUE INDEX "subscriptions_one_open_per_learner_class"
  ON "subscriptions"("learner_user_id","class_id")
  WHERE "state" IN ('PENDING','ACTIVE','GRACE','CANCEL_SCHEDULED');

CREATE TABLE "enrollments" (
  "id" TEXT NOT NULL,
  "subscription_id" TEXT NOT NULL,
  "learner_user_id" TEXT NOT NULL,
  "class_id" TEXT NOT NULL,
  "state" "EnrollmentState" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "enrollments_subscription_id_key" ON "enrollments"("subscription_id");
CREATE INDEX "enrollments_learner_user_id_class_id_state_idx" ON "enrollments"("learner_user_id","class_id","state");

CREATE TABLE "payment_attempts" (
  "id" TEXT NOT NULL,
  "subscription_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_attempt_id" TEXT,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "state" "PaymentAttemptState" NOT NULL DEFAULT 'CREATED',
  "idempotency_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_attempts_amount_check" CHECK ("amount_minor" >= 0)
);
CREATE UNIQUE INDEX "payment_attempts_idempotency_key_key" ON "payment_attempts"("idempotency_key");
CREATE UNIQUE INDEX "payment_attempts_provider_provider_attempt_id_key" ON "payment_attempts"("provider","provider_attempt_id");
CREATE INDEX "payment_attempts_subscription_id_state_idx" ON "payment_attempts"("subscription_id","state");

CREATE TABLE "payment_events" (
  "id" TEXT NOT NULL,
  "payment_attempt_id" TEXT,
  "provider" TEXT NOT NULL,
  "provider_event_id" TEXT NOT NULL,
  "normalized_type" TEXT NOT NULL,
  "payload_hash" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider","provider_event_id");
CREATE INDEX "payment_events_payment_attempt_id_received_at_idx" ON "payment_events"("payment_attempt_id","received_at");

CREATE TABLE "entitlements" (
  "id" TEXT NOT NULL,
  "enrollment_id" TEXT NOT NULL,
  "source_payment_event_id" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "state" "EntitlementState" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "entitlements_period_check" CHECK ("ends_at" > "starts_at")
);
CREATE UNIQUE INDEX "entitlements_source_payment_event_id_key" ON "entitlements"("source_payment_event_id");
CREATE UNIQUE INDEX "entitlements_enrollment_id_starts_at_ends_at_key" ON "entitlements"("enrollment_id","starts_at","ends_at");
CREATE INDEX "entitlements_enrollment_id_state_ends_at_idx" ON "entitlements"("enrollment_id","state","ends_at");

CREATE TABLE "financial_events" (
  "id" TEXT NOT NULL,
  "subscription_id" TEXT,
  "payment_attempt_id" TEXT,
  "commission_version_id" TEXT,
  "event_type" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "gross_minor" INTEGER NOT NULL,
  "platform_commission_minor" INTEGER,
  "teacher_payable_minor" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "financial_events_nonnegative_check" CHECK (
    "gross_minor" >= 0
    AND ("platform_commission_minor" IS NULL OR "platform_commission_minor" >= 0)
    AND ("teacher_payable_minor" IS NULL OR "teacher_payable_minor" >= 0)
  ),
  CONSTRAINT "financial_events_split_check" CHECK (
    ("platform_commission_minor" IS NULL AND "teacher_payable_minor" IS NULL)
    OR (
      "platform_commission_minor" IS NOT NULL
      AND "teacher_payable_minor" IS NOT NULL
      AND "platform_commission_minor" + "teacher_payable_minor" = "gross_minor"
    )
  )
);
CREATE UNIQUE INDEX "financial_events_source_type_source_id_event_type_key" ON "financial_events"("source_type","source_id","event_type");
CREATE INDEX "financial_events_subscription_id_created_at_idx" ON "financial_events"("subscription_id","created_at");

CREATE TABLE "refund_records" (
  "id" TEXT NOT NULL,
  "financial_event_id" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "state" "RefundState" NOT NULL DEFAULT 'REQUESTED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refund_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refund_records_amount_check" CHECK ("amount_minor" >= 0)
);
CREATE INDEX "refund_records_financial_event_id_state_idx" ON "refund_records"("financial_event_id","state");

CREATE TABLE "payout_records" (
  "id" TEXT NOT NULL,
  "financial_event_id" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "state" "PayoutState" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "provider_payout_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payout_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payout_records_amount_check" CHECK ("amount_minor" >= 0)
);
CREATE UNIQUE INDEX "payout_records_provider_provider_payout_id_key" ON "payout_records"("provider","provider_payout_id");
CREATE INDEX "payout_records_financial_event_id_state_idx" ON "payout_records"("financial_event_id","state");

ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_learner_relationships" ADD CONSTRAINT "guardian_learner_relationships_guardian_payer_user_id_fkey"
  FOREIGN KEY ("guardian_payer_user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_learner_relationships" ADD CONSTRAINT "guardian_learner_relationships_learner_user_id_fkey"
  FOREIGN KEY ("learner_user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_verification_cases" ADD CONSTRAINT "teacher_verification_cases_teacher_profile_id_fkey"
  FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_verification_cases" ADD CONSTRAINT "teacher_verification_cases_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "education_levels" ADD CONSTRAINT "education_levels_curriculum_id_fkey"
  FOREIGN KEY ("curriculum_id") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subject_levels" ADD CONSTRAINT "subject_levels_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_levels" ADD CONSTRAINT "subject_levels_education_level_id_fkey"
  FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_approval_scopes" ADD CONSTRAINT "teacher_approval_scopes_teacher_profile_id_fkey"
  FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_approval_scopes" ADD CONSTRAINT "teacher_approval_scopes_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_approval_scopes" ADD CONSTRAINT "teacher_approval_scopes_education_level_id_fkey"
  FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_offerings" ADD CONSTRAINT "class_offerings_teacher_profile_id_fkey"
  FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_offerings" ADD CONSTRAINT "class_offerings_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_offerings" ADD CONSTRAINT "class_offerings_education_level_id_fkey"
  FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_price_versions" ADD CONSTRAINT "class_price_versions_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_offerings" ADD CONSTRAINT "class_offerings_current_price_version_id_fkey"
  FOREIGN KEY ("current_price_version_id") REFERENCES "class_price_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stored_objects" ADD CONSTRAINT "stored_objects_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "user_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verification_case_id_fkey"
  FOREIGN KEY ("verification_case_id") REFERENCES "teacher_verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_stored_object_id_fkey"
  FOREIGN KEY ("stored_object_id") REFERENCES "stored_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payer_user_id_fkey"
  FOREIGN KEY ("payer_user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_learner_user_id_fkey"
  FOREIGN KEY ("learner_user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_price_version_id_fkey"
  FOREIGN KEY ("price_version_id") REFERENCES "class_price_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_attempt_id_fkey"
  FOREIGN KEY ("payment_attempt_id") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_enrollment_id_fkey"
  FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_source_payment_event_id_fkey"
  FOREIGN KEY ("source_payment_event_id") REFERENCES "payment_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_payment_attempt_id_fkey"
  FOREIGN KEY ("payment_attempt_id") REFERENCES "payment_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_commission_version_id_fkey"
  FOREIGN KEY ("commission_version_id") REFERENCES "commission_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_records" ADD CONSTRAINT "refund_records_financial_event_id_fkey"
  FOREIGN KEY ("financial_event_id") REFERENCES "financial_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payout_records" ADD CONSTRAINT "payout_records_financial_event_id_fkey"
  FOREIGN KEY ("financial_event_id") REFERENCES "financial_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
