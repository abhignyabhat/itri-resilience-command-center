ALTER TABLE "Parameter" ADD COLUMN "measurement" TEXT NOT NULL DEFAULT '';
UPDATE "Parameter" SET "measurement" = 'Calculated as the weighted average of its subparameter scores using their configured weights.';
