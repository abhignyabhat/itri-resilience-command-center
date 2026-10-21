import { dashboardKpiData } from "@/features/dashboard/data/kpi-data";
import { ChangeSummaryCard } from "@/features/dashboard/components/change-summary-card";
import { IndexGaugeCard } from "@/features/dashboard/components/index-gauge-card";
import { IndexTrendCard } from "@/features/dashboard/components/index-trend-card";
import { ParameterLandscapeCard } from "@/features/dashboard/components/parameter-landscape-card";

export function KpiRow() {
  const data = dashboardKpiData;

  return (
    <section aria-label="IT Resilience Index overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <IndexGaugeCard index={data.currentIndex} comparisons={data.comparisons} />
      <ParameterLandscapeCard parameters={data.parameterScores} />
      <IndexTrendCard history={data.indexHistory} />
      <ChangeSummaryCard summary={data.changeSummary} />
    </section>
  );
}
