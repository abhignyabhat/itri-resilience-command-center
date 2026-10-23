ALTER TABLE "Parameter" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Subparameter" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Subparameter" ADD COLUMN "measurement" TEXT NOT NULL DEFAULT '';

CREATE TABLE "MeasurementCriterion" (
    "id" TEXT NOT NULL,
    "subparameterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeasurementCriterion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MeasurementCriterion_subparameterId_sortOrder_idx" ON "MeasurementCriterion"("subparameterId", "sortOrder");
ALTER TABLE "MeasurementCriterion" ADD CONSTRAINT "MeasurementCriterion_subparameterId_fkey" FOREIGN KEY ("subparameterId") REFERENCES "Subparameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Parameter" SET "description" = CASE "code"
  WHEN 'availability' THEN 'Measures whether critical systems and services remain accessible and recover within agreed service targets.'
  WHEN 'security' THEN 'Measures the safeguards that protect services, infrastructure, and information from security threats.'
  WHEN 'integrity' THEN 'Measures the accuracy, consistency, and traceability of business and operational data.'
  WHEN 'governance' THEN 'Measures whether resilience responsibilities, policies, risks, and oversight are clearly established.'
  WHEN 'reliability' THEN 'Measures service stability and the ability to detect, respond to, and learn from operational failures.'
  WHEN 'business-continuity' THEN 'Measures preparedness to sustain critical operations and restore them after disruption.'
  WHEN 'modularity' THEN 'Measures how independently systems can be changed, maintained, and integrated.'
  WHEN 'scalability' THEN 'Measures whether systems can handle changing demand without unacceptable service degradation.'
  WHEN 'others' THEN 'Measures supporting capabilities that contribute to resilient and sustainable service delivery.'
  ELSE 'Measures the resilience capability and outcomes covered by ' || "name" || '.'
END;

UPDATE "Subparameter" s SET
  "description" = CASE s."code"
    WHEN 'availability-1' THEN 'Tracks the percentage of time the systems deliver the required service during the assessment period.'
    WHEN 'availability-2' THEN 'Assesses whether recovery plans restore critical services within approved recovery objectives.'
    WHEN 'availability-3' THEN 'Assesses response time, throughput, and resource headroom under normal and peak load.'
    WHEN 'availability-4' THEN 'Assesses whether redundant components can take over successfully when a primary component fails.'
    WHEN 'availability-5' THEN 'Assesses whether capacity forecasts anticipate demand and trigger timely scaling actions.'
    WHEN 'security-1' THEN 'Assesses whether access is authorized, least-privileged, and reviewed on a regular schedule.'
    WHEN 'security-2' THEN 'Assesses how promptly relevant threats are detected, triaged, and escalated.'
    WHEN 'security-3' THEN 'Assesses the coverage and timeliness of required security control and compliance evidence.'
    WHEN 'security-4' THEN 'Assesses whether vulnerabilities are identified, prioritized, and remediated within target times.'
    WHEN 'security-5' THEN 'Counts priority-one security or operational incidents that directly affect the business service during the assessment period.'
    WHEN 'security-6' THEN 'Assesses workforce completion and effectiveness of role-appropriate security training.'
    WHEN 'integrity-1' THEN 'Assesses the completeness, accuracy, and validity of data used by critical services.'
    WHEN 'integrity-2' THEN 'Assesses whether application controls prevent or detect unauthorized or invalid changes.'
    WHEN 'integrity-3' THEN 'Assesses whether changes are reviewed, tested, approved, and traceable before release.'
    WHEN 'integrity-4' THEN 'Assesses whether backups are verified and can restore consistent, usable data.'
    WHEN 'integrity-5' THEN 'Assesses whether important actions and data changes are recorded in reviewable audit trails.'
    WHEN 'governance-1' THEN 'Assesses whether current resilience policies are approved, communicated, and followed.'
    WHEN 'governance-2' THEN 'Assesses whether resilience risks are identified, owned, and tracked through treatment.'
    WHEN 'governance-3' THEN 'Assesses whether independent reviews identify issues and verify corrective actions.'
    WHEN 'governance-4' THEN 'Assesses whether accountable owners are assigned for critical services and controls.'
    WHEN 'governance-5' THEN 'Assesses whether leaders review resilience performance, risks, and actions at planned intervals.'
    WHEN 'reliability-1' THEN 'Assesses the health, redundancy, and maintenance state of infrastructure supporting critical services.'
    WHEN 'reliability-2' THEN 'Assesses application availability, error rates, and service-level objective performance.'
    WHEN 'reliability-3' THEN 'Assesses monitoring coverage and whether alerts provide actionable early warning.'
    WHEN 'reliability-4' THEN 'Assesses how quickly incidents are acknowledged, escalated, and mitigated.'
    WHEN 'reliability-5' THEN 'Assesses achieved service uptime against the agreed availability target.'
    WHEN 'reliability-6' THEN 'Assesses whether incidents result in documented reviews and completed corrective actions.'
    WHEN 'business-continuity-1' THEN 'Assesses whether recovery capabilities meet the approved disaster recovery objectives.'
    WHEN 'business-continuity-2' THEN 'Assesses whether business impact analyses are current and identify critical dependencies.'
    WHEN 'business-continuity-3' THEN 'Assesses the completion and success of planned recovery exercises.'
    WHEN 'business-continuity-4' THEN 'Assesses whether continuity plans are current, actionable, and available to responsible teams.'
    WHEN 'business-continuity-5' THEN 'Assesses whether crisis roles, communications, and decisions are exercised and understood.'
    WHEN 'modularity-1' THEN 'Assesses the ability to provision, change, or recover compute resources independently.'
    WHEN 'modularity-2' THEN 'Assesses the ability to scale, replace, and recover storage without disrupting services.'
    WHEN 'modularity-3' THEN 'Assesses whether network components and routes can be changed or recovered independently.'
    WHEN 'modularity-4' THEN 'Assesses separation of system components and the impact of changes across boundaries.'
    WHEN 'modularity-5' THEN 'Assesses the stability and recoverability of integrations between services and external systems.'
    WHEN 'scalability-1' THEN 'Assesses whether data volume growth is forecast and handled within performance targets.'
    WHEN 'scalability-2' THEN 'Assesses whether applications can handle rising workload while meeting service objectives.'
    WHEN 'scalability-3' THEN 'Assesses whether infrastructure can expand or contract to meet workload demand.'
    WHEN 'scalability-4' THEN 'Assesses whether automated capacity controls respond safely to workload changes.'
    WHEN 'scalability-5' THEN 'Assesses whether demand forecasts and load tests inform capacity plans.'
    WHEN 'others-1' THEN 'Assesses whether service costs are monitored and sustainable resilience choices are made.'
    WHEN 'others-2' THEN 'Assesses supplier resilience, dependency visibility, and contingency arrangements.'
    WHEN 'others-3' THEN 'Assesses whether environmental conditions and dependencies are monitored and managed.'
    WHEN 'others-4' THEN 'Assesses whether teams have the skills and coverage required to operate and recover services.'
    WHEN 'others-5' THEN 'Assesses whether operational procedures and system knowledge are complete and maintained.'
    ELSE 'Assesses the effectiveness of ' || lower(s."name") || ' for the associated resilience capability.'
  END,
  "measurement" = CASE s."code"
    WHEN 'availability-1' THEN 'Measured as the uptime percentage recorded for the systems over the assessment period.'
    WHEN 'security-5' THEN 'Measured as the number of P1 incidents that directly impacted the business service or its users during the assessment period.'
    ELSE 'Measured using documented evidence for ' || lower(s."name") || ' across the assessment period, compared with the approved target and service requirements.'
  END;

INSERT INTO "MeasurementCriterion" ("id", "subparameterId", "description", "score", "sortOrder", "updatedAt")
SELECT gen_random_uuid()::text, s."id",
  CASE
    WHEN s."code" = 'availability-1' AND c.score = 5 THEN 'Uptime > 99.99%'
    WHEN s."code" = 'availability-1' AND c.score = 4 THEN 'Uptime between 99.9% and 99.99%'
    WHEN s."code" = 'availability-1' AND c.score = 3 THEN 'Uptime between 99% and 99.9%'
    WHEN s."code" = 'availability-1' AND c.score = 2 THEN 'Uptime between 95% and 99%'
    WHEN s."code" = 'availability-1' AND c.score = 1 THEN 'Uptime < 95%'
    WHEN s."code" = 'security-5' AND c.score = 5 THEN 'Zero P1 incidents'
    WHEN s."code" = 'security-5' AND c.score = 4 THEN '1 P1 incident'
    WHEN s."code" = 'security-5' AND c.score = 3 THEN '2 P1 incidents'
    WHEN s."code" = 'security-5' AND c.score = 2 THEN '3 P1 incidents'
    WHEN s."code" = 'security-5' AND c.score = 1 THEN 'More than 3 P1 incidents'
    WHEN c.score = 5 THEN 'Consistently exceeds the approved target; no material gaps'
    WHEN c.score = 4 THEN 'Meets the approved target with only minor exceptions'
    WHEN c.score = 3 THEN 'Partially meets the target; some improvement is needed'
    WHEN c.score = 2 THEN 'Frequently misses the target; significant gaps remain'
    ELSE 'Does not meet the target or lacks effective evidence'
  END,
  c.score, 6 - c.score, CURRENT_TIMESTAMP
FROM "Subparameter" s
CROSS JOIN (VALUES (5), (4), (3), (2), (1)) AS c(score);
