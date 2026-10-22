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
          subparameters: {
            create: parameter.children.map((name, subIndex) => ({
              code: `${parameter.id}-${subIndex + 1}`,
              name,
              weight: parameter.children.length === 6 ? [20, 20, 15, 15, 15, 15][subIndex] : Number((100 / parameter.children.length).toFixed(2)),
              sortOrder: subIndex,
              source: parameter.source,
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
