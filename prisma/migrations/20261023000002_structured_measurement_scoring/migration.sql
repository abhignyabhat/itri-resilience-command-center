CREATE TYPE "MeasurementOperator" AS ENUM ('GT', 'GTE', 'EQ', 'LT', 'LTE', 'BETWEEN');

ALTER TABLE "MeasurementCriterion"
  ADD COLUMN "operator" "MeasurementOperator" NOT NULL DEFAULT 'BETWEEN',
  ADD COLUMN "value" DECIMAL(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN "upperValue" DECIMAL(12,4);

ALTER TABLE "AssessmentInput"
  ADD COLUMN "measuredValue" DECIMAL(12,4);

-- Give existing criteria usable numeric rules while preserving their scores.
UPDATE "MeasurementCriterion" AS c
SET "operator" = CASE
      WHEN c."score" = 5 THEN 'GTE'::"MeasurementOperator"
      WHEN c."score" IN (4, 3, 2) THEN 'BETWEEN'::"MeasurementOperator"
      ELSE 'LT'::"MeasurementOperator"
    END,
    "value" = CASE c."score" WHEN 5 THEN 80 WHEN 4 THEN 60 WHEN 3 THEN 40 WHEN 2 THEN 20 ELSE 20 END,
    "upperValue" = CASE c."score" WHEN 4 THEN 80 WHEN 3 THEN 60 WHEN 2 THEN 40 ELSE NULL END;

-- Uptime percentage: upper bounds are exclusive, lower bounds inclusive for ranges.
UPDATE "MeasurementCriterion" AS c
SET "operator" = CASE c."score" WHEN 5 THEN 'GT'::"MeasurementOperator" WHEN 4 THEN 'BETWEEN'::"MeasurementOperator" WHEN 3 THEN 'BETWEEN'::"MeasurementOperator" WHEN 2 THEN 'BETWEEN'::"MeasurementOperator" ELSE 'LT'::"MeasurementOperator" END,
    "value" = CASE c."score" WHEN 5 THEN 99.99 WHEN 4 THEN 99.9 WHEN 3 THEN 99 WHEN 2 THEN 95 ELSE 95 END,
    "upperValue" = CASE c."score" WHEN 4 THEN 99.99 WHEN 3 THEN 99.9 WHEN 2 THEN 99 ELSE NULL END
FROM "Subparameter" AS s
WHERE c."subparameterId" = s."id" AND s."code" = 'availability-1';

-- P1 incident count scoring uses exact counts and a final greater-than rule.
UPDATE "MeasurementCriterion" AS c
SET "operator" = CASE c."score" WHEN 5 THEN 'EQ'::"MeasurementOperator" WHEN 4 THEN 'EQ'::"MeasurementOperator" WHEN 3 THEN 'EQ'::"MeasurementOperator" WHEN 2 THEN 'EQ'::"MeasurementOperator" ELSE 'GT'::"MeasurementOperator" END,
    "value" = CASE c."score" WHEN 5 THEN 0 WHEN 4 THEN 1 WHEN 3 THEN 2 WHEN 2 THEN 3 ELSE 3 END,
    "upperValue" = NULL
FROM "Subparameter" AS s
WHERE c."subparameterId" = s."id" AND s."code" = 'security-5';
