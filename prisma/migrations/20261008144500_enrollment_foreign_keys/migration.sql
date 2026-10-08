ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_learner_user_id_fkey"
  FOREIGN KEY ("learner_user_id") REFERENCES "user_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
