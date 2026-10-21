import type { DashboardKpiData, IndexStatus } from "@/features/dashboard/types";

type Props = {
  index: DashboardKpiData["currentIndex"];
  comparisons: DashboardKpiData["comparisons"];
};

const statusStyles: Record<IndexStatus, string> = {
  good: "bg-score-good-soft text-score-good",
  okay: "bg-score-okay-soft text-score-okay",
  bad: "bg-score-bad-soft text-score-bad",
};

const statusLabels: Record<IndexStatus, string> = {
  good: "GOOD",
  okay: "OKAY",
  bad: "BAD",
};

export function IndexGaugeCard({ index, comparisons }: Props) {
  const angle = 180 - (Math.max(0, Math.min(100, index.score)) / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const pointerInnerX = 140 + Math.cos(radians) * 96;
  const pointerInnerY = 145 - Math.sin(radians) * 96;
  const pointerOuterX = 140 + Math.cos(radians) * 116;
  const pointerOuterY = 145 - Math.sin(radians) * 116;

  return (
    <article aria-label="IT Resilience Index score" className="flex h-[244px] min-w-0 flex-col rounded-md border border-itri-200 bg-white/80 p-3 shadow-sm sm:p-4">
      <div className="relative mx-auto h-[190px] w-full max-w-[310px] -translate-y-4">
        <svg viewBox="0 0 280 170" role="img" aria-label={`Gauge showing ${index.score} out of 100`} className="absolute inset-x-0 top-0 h-[170px] w-full overflow-visible">
          <defs>
            <linearGradient id="score-spectrum" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc3f53" />
              <stop offset="50%" stopColor="#f1b323" />
              <stop offset="100%" stopColor="#079669" />
            </linearGradient>
          </defs>
          <path d="M 32 145 A 108 108 0 0 1 248 145" fill="none" stroke="url(#score-spectrum)" strokeWidth="17" strokeLinecap="round" />
          <line x1={pointerInnerX} y1={pointerInnerY} x2={pointerOuterX} y2={pointerOuterY} stroke="#073b63" strokeWidth="5" strokeLinecap="round" />
          <circle cx={pointerOuterX} cy={pointerOuterY} r="4" fill="#073b63" stroke="white" strokeWidth="1.5" />
        </svg>
        <div className="absolute left-1/2 top-[75px] flex w-fit -translate-x-1/2 items-baseline justify-center rounded-md bg-white px-1 text-itri-900">
          <span className="text-5xl font-bold leading-none tracking-tight">{index.score}</span>
          <span className="ml-1 text-xl font-semibold">/100</span>
        </div>
        <div className={`absolute left-1/2 top-[130px] -translate-x-1/2 rounded-full px-8 py-1.5 text-sm font-bold tracking-wide ${statusStyles[index.status]}`}>
          {statusLabels[index.status]}
        </div>
      </div>

      <div className="mt-auto flex min-h-11 items-center justify-center divide-x divide-itri-200 border-t border-itri-100 pt-2">
        {comparisons.slice(0, 2).map((comparison) => (
          <div key={comparison.periodId} className="flex flex-1 items-center justify-center gap-2 px-1 text-center">
            <span aria-hidden="true" className={`text-2xl font-semibold leading-none ${comparison.change >= 0 ? "text-score-good" : "text-score-bad"}`}>
              {comparison.change >= 0 ? "↑" : "↓"}
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className={`text-base font-bold ${comparison.change >= 0 ? "text-score-good" : "text-score-bad"}`}>
                {comparison.change > 0 ? "+" : ""}{comparison.change}
              </span>
              <span className="whitespace-nowrap text-xs text-itri-700">vs. {comparison.periodLabel}</span>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
