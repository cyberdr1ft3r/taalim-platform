ALTER TYPE "StoredObjectStatus" ADD VALUE IF NOT EXISTS 'MISSING';
ALTER TYPE "StoredObjectStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';

ALTER TABLE "stored_objects"
  ADD COLUMN "replaces_object_id" TEXT;

CREATE UNIQUE INDEX "stored_objects_replaces_object_id_key"
  ON "stored_objects"("replaces_object_id");

ALTER TABLE "stored_objects" ADD CONSTRAINT "stored_objects_replaces_object_id_fkey"
  FOREIGN KEY ("replaces_object_id") REFERENCES "stored_objects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
