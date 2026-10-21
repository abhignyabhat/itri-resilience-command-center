import type { DashboardKpiData, RemediationItem } from "@/features/dashboard/types";

function parameter(
  id: string,
  name: string,
  chartLabel: string[],
  score: number,
  weight: number,
  change: number,
  subparameterNames: string[],
) {
  const weights = subparameterNames.length === 6
    ? [20, 20, 15, 15, 15, 15]
    : Array(subparameterNames.length).fill(100 / subparameterNames.length);

  return {
    id,
    name,
    chartLabel,
    score,
    weight,
    change,
    subparameters: subparameterNames.map((subparameterName, index) => ({
      id: `${id}-${index + 1}`,
      name: subparameterName,
      weightage: weights[index],
      score: Math.max(0, Math.min(100, score + ((index % 3) - 1) * 4 + (index % 2))),
      trend: [2, 1, -1, 3, 0, 2][index % 6],
    })),
  };
}

// Display fixture based on the supplied dashboard mockup. Replace this object
// with the dashboard response when the data source is connected.
export const dashboardKpiData: DashboardKpiData = {
  currentIndex: {
    periodId: "2027-H2",
    periodLabel: "H2 ’27",
    score: 78,
    status: "good",
  },
  comparisons: [
    { periodId: "2026-H1", periodLabel: "H1 ’26", change: 6 },
    { periodId: "2026-H2", periodLabel: "H2 ’26", change: 4 },
  ],
  parameterScores: [
    parameter("availability", "Availability", ["Availability"], 82, 12, 6, ["Uptime", "Disaster recovery", "Performance", "Failover readiness", "Capacity planning"]),
    parameter("security", "Security", ["Security"], 76, 10, 4, ["Access", "Threat detection", "Compliance", "Vulnerability mgmt.", "Incident response", "Security training"]),
    parameter("integrity", "Integrity", ["Integrity"], 70, 10, 2, ["Data quality", "Application controls", "Change validation", "Backup validation", "Audit trails"]),
    parameter("governance", "Governance", ["Governance"], 68, 8, 1, ["Policy", "Risk mgmt.", "Audit", "Ownership", "Oversight"]),
    parameter("reliability", "Reliability & Monitoring", ["Reliability &", "Monitoring"], 80, 12, 6, ["Infrastructure", "Application health", "Monitoring", "Alert response", "Service uptime", "Incident review"]),
    parameter("business-continuity", "Business Continuity", ["Business", "Continuity"], 75, 10, 2, ["Disaster recovery", "BIA", "Recovery tests", "Continuity plans", "Crisis response"]),
    parameter("modularity", "Modularity & Flexibility", ["Modularity &", "Flexibility"], 72, 10, 2, ["Compute", "Storage", "Network", "Architecture", "Integration"]),
    parameter("scalability", "Scalability", ["Scalability"], 69, 6, 6, ["Data growth", "Application load", "Infrastructure", "Elastic capacity", "Demand planning"]),
    parameter("others", "Others", ["Others"], 69, 6, 4, ["Cost", "Vendor", "Environment", "Skills", "Documentation"]),
  ],
  indexHistory: {
    cadence: "half-yearly",
    points: [
      { periodId: "2026-H1", periodLabel: "H1 ’26", score: 68 },
      { periodId: "2026-H2", periodLabel: "H2 ’26", score: 72 },
      { periodId: "2027-H1", periodLabel: "H1 ’27", score: 76 },
      { periodId: "2027-H2", periodLabel: "H2 ’27", score: 78 },
    ],
  },
  changeSummary: {
    comparedToPeriodId: "2026-H2",
    netChange: 6,
    contributors: [
      { parameterId: "availability", change: 2.4 },
      { parameterId: "security", change: 1.8 },
      { parameterId: "reliability", change: 1.2 },
      { parameterId: "business-continuity", change: 0.3 },
      { parameterId: "integrity", change: 0.3 },
    ],
  },
};

// Display fixtures for the Remediations & Next Steps dashboard widget.
export const dashboardRemediations: RemediationItem[] = [
  {
    id: "remediation-1",
    parameterId: "availability",
    subparameterId: "availability-2",
    priority: "high",
    title: "Address DR test failures",
    remediation: "Complete DR testing for core systems and validate recovery time objectives.",
  },
  {
    id: "remediation-2",
    parameterId: "availability",
    subparameterId: "availability-3",
    priority: "medium",
    title: "Optimize database queries",
    remediation: "Review resource utilization and plan scaling to improve performance.",
  },
  {
    id: "remediation-3",
    parameterId: "integrity",
    subparameterId: "integrity-2",
    priority: "medium",
    title: "Resolve integration errors",
    remediation: "Investigate and fix recurring API integration failures affecting partner systems.",
  },
  {
    id: "remediation-4",
    parameterId: "security",
    subparameterId: "security-1",
    priority: "low",
    title: "Implement access control improvements",
    remediation: "Enforce least privilege and review access logs for anomalies.",
  },
  {
    id: "remediation-5",
    parameterId: "reliability",
    subparameterId: "reliability-3",
    priority: "medium",
    title: "Tune monitoring alert thresholds",
    remediation: "Reduce noisy alerts and document escalation ownership for critical services.",
  },
  {
    id: "remediation-6",
    parameterId: "business-continuity",
    subparameterId: "business-continuity-1",
    priority: "high",
    title: "Validate disaster recovery runbooks",
    remediation: "Update recovery procedures and confirm system owners can execute each step.",
  },
  {
    id: "remediation-7",
    parameterId: "availability",
    subparameterId: "availability-1",
    priority: "low",
    title: "Review uptime targets",
    remediation: "Confirm service-level objectives reflect current business requirements.",
  },
  {
    id: "remediation-8",
    parameterId: "availability",
    subparameterId: "availability-4",
    priority: "medium",
    title: "Improve failover readiness",
    remediation: "Run failover exercises and document dependencies that need manual intervention.",
  },
  {
    id: "remediation-9",
    parameterId: "security",
    subparameterId: "security-2",
    priority: "high",
    title: "Close critical threat alerts",
    remediation: "Assign owners to open critical alerts and record evidence of resolution.",
  },
  {
    id: "remediation-10",
    parameterId: "security",
    subparameterId: "security-4",
    priority: "medium",
    title: "Prioritize overdue vulnerabilities",
    remediation: "Remediate internet-facing critical findings and track approved exceptions.",
  },
  {
    id: "remediation-11",
    parameterId: "integrity",
    subparameterId: "integrity-1",
    priority: "medium",
    title: "Improve data quality checks",
    remediation: "Add validation rules for required fields and reconcile failed records daily.",
  },
  {
    id: "remediation-12",
    parameterId: "governance",
    subparameterId: "governance-2",
    priority: "low",
    title: "Refresh the resilience risk register",
    remediation: "Review risk owners, treatment plans, and target dates with each service lead.",
  },
  {
    id: "remediation-13",
    parameterId: "reliability",
    subparameterId: "reliability-1",
    priority: "medium",
    title: "Remove infrastructure single points of failure",
    remediation: "Document critical dependencies and schedule redundancy improvements.",
  },
  {
    id: "remediation-14",
    parameterId: "modularity",
    subparameterId: "modularity-4",
    priority: "low",
    title: "Document service boundaries",
    remediation: "Map system interfaces and assign owners for high-impact integrations.",
  },
  {
    id: "remediation-15",
    parameterId: "scalability",
    subparameterId: "scalability-4",
    priority: "medium",
    title: "Set elastic capacity thresholds",
    remediation: "Tune autoscaling triggers using recent peak demand and load test results.",
  },
  {
    id: "remediation-16",
    parameterId: "others",
    subparameterId: "others-2",
    priority: "low",
    title: "Review critical vendor resilience plans",
    remediation: "Request updated continuity evidence and track supplier remediation dates.",
  },
];
