"use client";

import { useState } from "react";
import { dashboardKpiData, dashboardRemediations } from "@/features/dashboard/data/kpi-data";
import { KpiRow } from "@/features/dashboard/components/kpi-row";
import { ParameterCardGrid } from "@/features/dashboard/components/parameter-card-grid";
import { RemediationsCard, type RemediationFilter } from "@/features/dashboard/components/remediations-card";

export function DashboardScreen() {
  const [filter, setFilter] = useState<RemediationFilter>({ parameterId: null, subparameterId: null });

  return (
    <div aria-label="Dashboard screen" className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">
      <KpiRow />
      <ParameterCardGrid
        parameters={dashboardKpiData.parameterScores}
        onSelectFilter={(parameterId, subparameterId) => setFilter({ parameterId, subparameterId: subparameterId ?? null })}
      />
      <RemediationsCard
        parameters={dashboardKpiData.parameterScores}
        remediations={dashboardRemediations}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
}
