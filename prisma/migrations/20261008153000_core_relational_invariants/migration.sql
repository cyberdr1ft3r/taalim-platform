-- Strengthen Issue #3 cross-entity invariants found during final review.

-- Composite keys make "belongs to the same class/learner" enforceable in PostgreSQL.
CREATE UNIQUE INDEX "class_price_versions_id_class_id_key"
  ON "class_price_versions"("id", "class_id");

CREATE UNIQUE INDEX "subscriptions_id_learner_user_id_class_id_key"
  ON "subscriptions"("id", "learner_user_id", "class_id");

-- A class may only select one of its own price versions as current.
ALTER TABLE "class_offerings"
  ADD CONSTRAINT "class_offerings_current_price_belongs_to_class_fkey"
  FOREIGN KEY ("current_price_version_id", "id")
  REFERENCES "class_price_versions"("id", "class_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- A subscription may only use a price version owned by the subscribed class.
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_price_belongs_to_class_fkey"
  FOREIGN KEY ("price_version_id", "class_id")
  REFERENCES "class_price_versions"("id", "class_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrollment identity must exactly match the learner/class on its subscription.
ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_identity_matches_subscription_fkey"
  FOREIGN KEY ("subscription_id", "learner_user_id", "class_id")
  REFERENCES "subscriptions"("id", "learner_user_id", "class_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Price versions become append-only for commercial fields after first subscription reference.
CREATE OR REPLACE FUNCTION taalim_guard_referenced_price_version_update()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "subscriptions" s WHERE s."price_version_id" = OLD."id"
  ) AND (
    NEW."amount_minor" IS DISTINCT FROM OLD."amount_minor"
    OR NEW."currency" IS DISTINCT FROM OLD."currency"
    OR NEW."effective_from" IS DISTINCT FROM OLD."effective_from"
    OR NEW."effective_to" IS DISTINCT FROM OLD."effective_to"
    OR NEW."class_id" IS DISTINCT FROM OLD."class_id"
  ) THEN
    RAISE EXCEPTION 'referenced class price versions are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "class_price_versions_referenced_immutable"
BEFORE UPDATE ON "class_price_versions"
FOR EACH ROW
EXECUTE FUNCTION taalim_guard_referenced_price_version_update();
