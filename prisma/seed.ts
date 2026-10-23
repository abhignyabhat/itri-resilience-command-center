import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const parameterSeeds = [
  { id: "availability", name: "Availability", label: ["Availability"], baseWeight: 12, score: 82, source: "SolarWinds", children: ["Uptime", "Disaster recovery", "Performance", "Failover readiness", "Capacity planning"] },
  { id: "security", name: "Security", label: ["Security"], baseWeight: 10, score: 76, source: "Splunk", children: ["Access", "Threat detection", "Compliance", "Vulnerability mgmt.", "Incident response", "Security training"] },
  { id: "integrity", name: "Integrity", label: ["Integrity"], baseWeight: 10, score: 70, source: "Datadog", children: ["Data quality", "Application controls", "Change validation", "Backup validation", "Audit trails"] },
  { id: "governance", name: "Governance", label: ["Governance"], baseWeight: 8, score: 68, source: "Weighted Avg", children: ["Policy", "Risk mgmt.", "Audit", "Ownership", "Oversight"] },
  { id: "reliability", name: "Reliability & Monitoring", label: ["Reliability &", "Monitoring"], baseWeight: 12, score: 80, source: "Datadog", children: ["Infrastructure", "Application health", "Monitoring", "Alert response", "Service uptime", "Incident review"] },
  { id: "business-continuity", name: "Business Continuity", label: ["Business", "Continuity"], baseWeight: 10, score: 75, source: "Manual", children: ["Disaster recovery", "BIA", "Recovery tests", "Continuity plans", "Crisis response"] },
  { id: "modularity", name: "Modularity & Flexibility", label: ["Modularity &", "Flexibility"], baseWeight: 10, score: 72, source: "Splunk", children: ["Compute", "Storage", "Network", "Architecture", "Integration"] },
  { id: "scalability", name: "Scalability", label: ["Scalability"], baseWeight: 6, score: 69, source: "Datadog", children: ["Data growth", "Application load", "Infrastructure", "Elastic capacity", "Demand planning"] },
  { id: "others", name: "Others", label: ["Others"], baseWeight: 6, score: 69, source: "Manual", children: ["Cost", "Vendor", "Environment", "Skills", "Documentation"] },
];


const parameterDescriptions: Record<string, string> = {
  availability: "Measures whether critical systems and services remain accessible and recover within agreed service targets.",
  security: "Measures safeguards that protect services, infrastructure, and information from security threats.",
  integrity: "Measures the accuracy, consistency, and traceability of business and operational data.",
  governance: "Measures whether resilience responsibilities, policies, risks, and oversight are clearly established.",
  reliability: "Measures service stability and the ability to detect, respond to, and learn from operational failures.",
  "business-continuity": "Measures preparedness to sustain critical operations and restore them after disruption.",
  modularity: "Measures how independently systems can be changed, maintained, and integrated.",
  scalability: "Measures whether systems can handle changing demand without unacceptable service degradation.",
  others: "Measures supporting capabilities that contribute to resilient and sustainable service delivery.",
};

const subparameterDescriptions: Record<string, string> = {
  "availability-1": "Tracks the percentage of time systems deliver the required service during the assessment period.",
  "availability-2": "Assesses whether recovery plans restore critical services within approved recovery objectives.",
  "availability-3": "Assesses response time, throughput, and resource headroom under normal and peak load.",
  "availability-4": "Assesses whether redundant components can take over successfully when a primary component fails.",
  "availability-5": "Assesses whether capacity forecasts anticipate demand and trigger timely scaling actions.",
  "security-1": "Assesses whether access is authorized, least-privileged, and reviewed on a regular schedule.",
  "security-2": "Assesses how promptly relevant threats are detected, triaged, and escalated.",
  "security-3": "Assesses the coverage and timeliness of required security control and compliance evidence.",
  "security-4": "Assesses whether vulnerabilities are identified, prioritized, and remediated within target times.",
  "security-5": "Counts priority-one incidents that directly affect the business service or its users during the assessment period.",
  "security-6": "Assesses workforce completion and effectiveness of role-appropriate security training.",
};

const genericCriteria = [
  { description: "80 or above", operator: "GTE" as const, value: 80, upperValue: null, score: 5 },
  { description: "60 to under 80", operator: "BETWEEN" as const, value: 60, upperValue: 80, score: 4 },
  { description: "40 to under 60", operator: "BETWEEN" as const, value: 40, upperValue: 60, score: 3 },
  { description: "20 to under 40", operator: "BETWEEN" as const, value: 20, upperValue: 40, score: 2 },
  { description: "Below 20", operator: "LT" as const, value: 20, upperValue: null, score: 1 },
];

function criteriaFor(code: string) {
  if (code === "availability-1") return [
    { description: "Uptime > 99.99%", operator: "GT" as const, value: 99.99, upperValue: null, score: 5 },
    { description: "Uptime from 99.9% to under 99.99%", operator: "BETWEEN" as const, value: 99.9, upperValue: 99.99, score: 4 },
    { description: "Uptime from 99% to under 99.9%", operator: "BETWEEN" as const, value: 99, upperValue: 99.9, score: 3 },
    { description: "Uptime from 95% to under 99%", operator: "BETWEEN" as const, value: 95, upperValue: 99, score: 2 },
    { description: "Uptime < 95%", operator: "LT" as const, value: 95, upperValue: null, score: 1 },
  ];
  if (code === "security-5") return [
    { description: "Zero P1 incidents", operator: "EQ" as const, value: 0, upperValue: null, score: 5 },
    { description: "1 P1 incident", operator: "EQ" as const, value: 1, upperValue: null, score: 4 },
    { description: "2 P1 incidents", operator: "EQ" as const, value: 2, upperValue: null, score: 3 },
    { description: "3 P1 incidents", operator: "EQ" as const, value: 3, upperValue: null, score: 2 },
    { description: "More than 3 P1 incidents", operator: "GT" as const, value: 3, upperValue: null, score: 1 },
  ];
  return genericCriteria;
}

function measurementFor(code: string, name: string) {
  if (code === "availability-1") return "Measured as the uptime percentage recorded for the systems over the assessment period.";
  if (code === "security-5") return "Measured as the number of P1 incidents that directly impacted the business service or its users during the assessment period.";
  return `Measured as a normalized 0–100 performance value against the approved target and service requirements; customize criteria to use a different unit or scale.`;
}

async function main() {
  await prisma.reportDownload.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.remediation.deleteMany();
  await prisma.subparameterResult.deleteMany();
  await prisma.parameterResult.deleteMany();
  await prisma.scoreSnapshot.deleteMany();
  await prisma.assessmentInput.deleteMany();
  await prisma.assessmentPeriod.deleteMany();
  await prisma.modelVersion.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({ data: { name: "Abhignya Bhat", email: "abhignya@example.com", role: "ADMIN" } });
  const totalWeight = parameterSeeds.reduce((sum, parameter) => sum + parameter.baseWeight, 0);
  const roundedWeights = parameterSeeds.map((parameter, index) => index === parameterSeeds.length - 1
    ? Number((100 - parameterSeeds.slice(0, -1).reduce((sum, item) => sum + Number((item.baseWeight * 100 / totalWeight).toFixed(2)), 0)).toFixed(2))
    : Number((parameter.baseWeight * 100 / totalWeight).toFixed(2)));
  const model = await prisma.modelVersion.create({
    data: {
      version: 1,
      name: "ITRI Demo Model",
      status: "PUBLISHED",
      goodThreshold: 75,
      okayThreshold: 50,
      publishedAt: new Date(),
      parameters: {
        create: parameterSeeds.map((parameter, parameterIndex) => ({
          code: parameter.id,
          name: parameter.name,
          chartLabel: parameter.label,
          weight: roundedWeights[parameterIndex],
          sortOrder: parameterIndex,
          source: parameter.source,
          description: parameterDescriptions[parameter.id] ?? `Measures the resilience capability and outcomes covered by ${parameter.name}.`,
          measurement: "Calculated as the weighted average of its subparameter scores using their configured weights.",
          subparameters: {
            create: parameter.children.map((name, subIndex) => ({
              code: `${parameter.id}-${subIndex + 1}`,
              name,
              weight: parameter.children.length === 6 ? [20, 20, 15, 15, 15, 15][subIndex] : Number((100 / parameter.children.length).toFixed(2)),
              sortOrder: subIndex,
              source: parameter.source,
              description: subparameterDescriptions[`${parameter.id}-${subIndex + 1}`] ?? `Assesses the effectiveness of ${name.toLowerCase()} for ${parameter.name.toLowerCase()}.`,
              measurement: measurementFor(`${parameter.id}-${subIndex + 1}`, name),
              measurementCriteria: { create: criteriaFor(`${parameter.id}-${subIndex + 1}`).map((criterion, criterionIndex) => ({ ...criterion, sortOrder: criterionIndex })) },
            })),
          },
        })),
      },
    },
    include: { parameters: { include: { subparameters: true } } },
  });

  const periods = [
    { code: "2025-H1", label: "H1 ’25", start: "2025-01-01T00:00:00.000Z", end: "2025-06-30T23:59:59.000Z", target: 68 },
    { code: "2025-H2", label: "H2 ’25", start: "2025-07-01T00:00:00.000Z", end: "2025-12-31T23:59:59.000Z", target: 70 },
    { code: "2026-H1", label: "H1 ’26", start: "2026-01-01T00:00:00.000Z", end: "2026-06-30T23:59:59.000Z", target: 72 },
    { code: "2026-H2", label: "H2 ’26", start: "2026-07-01T00:00:00.000Z", end: "2026-12-31T23:59:59.000Z", target: null },
  ];
  const baseIndex = parameterSeeds.reduce((sum, parameter, index) => sum + parameter.score * roundedWeights[index] / 100, 0);
  for (const periodData of periods) {
    const period = await prisma.assessmentPeriod.create({ data: { code: periodData.code, label: periodData.label, startsAt: new Date(periodData.start), endsAt: new Date(periodData.end), status: "COMPLETE" } });
    const delta = periodData.target === null ? 0 : periodData.target - baseIndex;
    const scoresByParameter = new Map(parameterSeeds.map((parameter) => [parameter.id, Math.max(0, Math.min(100, Number((parameter.score + delta).toFixed(2))))]));
    const inputs = parameterSeeds.flatMap((parameter) => {
      const parameterRecord = model.parameters.find((item) => item.code === parameter.id)!;
      return parameterRecord.subparameters.map((subparameter) => ({
      assessmentPeriodId: period.id,
      subparameterId: subparameter.id,
      score: scoresByParameter.get(parameter.id) ?? parameter.score,
      recordedById: user.id,
      source: "MANUAL" as const,
      }));
    });
    await prisma.assessmentInput.createMany({ data: inputs });
    const score = parameterSeeds.reduce((sum, parameter, index) => sum + (scoresByParameter.get(parameter.id) ?? parameter.score) * roundedWeights[index] / 100, 0);
    const snapshot = await prisma.scoreSnapshot.create({ data: { assessmentPeriodId: period.id, modelVersionId: model.id, score, provisionalEstimate: score, isProvisional: false, scoredCount: inputs.length, requiredCount: inputs.length } });
    for (const parameterSeed of parameterSeeds) {
      const parameterId = parameterSeed.id;
      const parameter = parameterSeeds.find((item) => item.id === parameterId)!;
      const parameterRecord = model.parameters.find((item) => item.code === parameterId)!;
      const parameterScore = scoresByParameter.get(parameterId) ?? parameter.score;
      const result = await prisma.parameterResult.create({ data: { snapshotId: snapshot.id, parameterId: parameterRecord.id, score: parameterScore, isProvisional: false } });
      await prisma.subparameterResult.createMany({ data: parameterRecord.subparameters.map((subparameter) => ({ parameterResultId: result.id, subparameterId: subparameter.id, score: parameterScore })) });
    }
  }

  const remediationSeeds = [
    ["availability-2", "Address DR test failures", "Complete DR testing for core systems and validate recovery objectives.", "HIGH"],
    ["availability-3", "Optimize database queries", "Review resource utilization and plan scaling to improve performance.", "MEDIUM"],
    ["integrity-2", "Resolve integration errors", "Investigate recurring API integration failures affecting partner systems.", "MEDIUM"],
    ["security-1", "Improve access controls", "Enforce least privilege and review access logs for anomalies.", "LOW"],
    ["reliability-3", "Tune monitoring alerts", "Reduce noisy alerts and document escalation ownership.", "MEDIUM"],
    ["business-continuity-3", "Validate recovery runbooks", "Update recovery procedures and confirm owners can execute each step.", "HIGH"],
    ["security-4", "Prioritize overdue vulnerabilities", "Remediate critical findings and track approved exceptions.", "HIGH"],
    ["scalability-4", "Set elastic capacity thresholds", "Tune autoscaling triggers using demand and load-test results.", "LOW"],
  ] as const;
  await prisma.remediation.createMany({ data: remediationSeeds.map(([code, title, description, priority]) => ({ subparameterId: model.parameters.flatMap((parameter) => parameter.subparameters).find((subparameter) => subparameter.code === code)!.id, title, description, priority })) });
  await prisma.auditEvent.create({ data: { userId: user.id, action: "DEMO_DATA_SEEDED", entityType: "ModelVersion", entityId: model.id, summary: "Created the initial ITRI demo model, sample assessment periods, manual scores, and remediation actions." } });
  console.log(`Seeded model version ${model.version}, ${parameterSeeds.length} parameters, ${periods.length} assessment periods, and ${remediationSeeds.length} remediations.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
