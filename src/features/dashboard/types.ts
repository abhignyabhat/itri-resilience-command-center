export type IndexStatus = "good" | "okay" | "bad";

export type ParameterScore = {
  id: string;
  name: string;
  chartLabel: string[];
  score: number;
  weight: number;
  change: number;
  subparameters: Array<{
    id: string;
    name: string;
    weightage: number | null;
    score: number | null;
    trend: number | null;
  }>;
};

export type DashboardKpiData = {
  currentIndex: {
    periodId: string;
    periodLabel: string;
    score: number;
    status: IndexStatus;
  };
  comparisons: Array<{
    periodId: string;
    periodLabel: string;
    change: number;
  }>;
  parameterScores: ParameterScore[];
  indexHistory: {
    cadence: "half-yearly";
    points: Array<{
      periodId: string;
      periodLabel: string;
      score: number;
    }>;
  };
  changeSummary: {
    comparedToPeriodId: string;
    netChange: number;
    contributors: Array<{
      parameterId: string;
      change: number;
    }>;
  };
};

export type RemediationItem = {
  id: string;
  parameterId: string;
  subparameterId: string;
  priority: "high" | "medium" | "low";
  title: string;
  remediation: string;
};
