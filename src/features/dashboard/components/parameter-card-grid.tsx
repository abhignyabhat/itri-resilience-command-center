import type { ParameterScore } from "@/features/dashboard/types";

type Props = {
  parameters: ParameterScore[];
  onSelectFilter: (parameterId: string, subparameterId?: string) => void;
};

const parameterTones: Record<string, { border: string; header: string; icon: string; title: string }> = {
  availability: {
    border: "border-parameter-availability/60",
    header: "bg-parameter-availability/10",
    icon: "bg-parameter-availability",
    title: "text-parameter-availability",
  },
  security: {
    border: "border-parameter-security/60",
    header: "bg-parameter-security/10",
    icon: "bg-parameter-security",
    title: "text-parameter-security",
  },
  integrity: {
    border: "border-parameter-integrity/60",
    header: "bg-parameter-integrity/10",
    icon: "bg-parameter-integrity",
    title: "text-parameter-integrity",
  },
  governance: {
    border: "border-parameter-governance/60",
    header: "bg-parameter-governance/10",
    icon: "bg-parameter-governance",
    title: "text-parameter-governance",
  },
  reliability: {
    border: "border-parameter-reliability/60",
    header: "bg-parameter-reliability/10",
    icon: "bg-parameter-reliability",
    title: "text-parameter-reliability",
  },
  "business-continuity": {
    border: "border-parameter-continuity/60",
    header: "bg-parameter-continuity/10",
    icon: "bg-parameter-continuity",
    title: "text-parameter-continuity",
  },
  modularity: {
    border: "border-parameter-modularity/60",
    header: "bg-parameter-modularity/10",
    icon: "bg-parameter-modularity",
    title: "text-parameter-modularity",
  },
  scalability: {
    border: "border-parameter-scalability/60",
    header: "bg-parameter-scalability/10",
    icon: "bg-parameter-scalability",
    title: "text-parameter-scalability",
  },
  others: {
    border: "border-parameter-other/60",
    header: "bg-parameter-other/10",
    icon: "bg-parameter-other",
    title: "text-parameter-other",
  },
};

export function ParameterCardGrid({ parameters, onSelectFilter }: Props) {
  return (
    <section aria-label="Parameter scores" className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {parameters.map((parameter) => (
        <ParameterCard key={parameter.id} parameter={parameter} onSelectFilter={onSelectFilter} />
      ))}
    </section>
  );
}

function ParameterCard({ parameter, onSelectFilter }: { parameter: ParameterScore; onSelectFilter: Props["onSelectFilter"] }) {
  const tone = parameterTones[parameter.id] ?? parameterTones.others;
  const positiveChange = parameter.change >= 0;

  return (
    <article className={`flex h-[162px] min-w-0 flex-col overflow-hidden rounded-md border bg-white/80 shadow-sm ${tone.border}`}>
      <header className={`flex h-[38px] shrink-0 items-center gap-2 border-b px-3 ${tone.border} ${tone.header}`}>
        <span className={`grid size-6 shrink-0 place-items-center rounded-full text-white ${tone.icon}`}>
          <ParameterIcon type={iconForParameter(parameter.id)} />
        </span>
        <h2 className={`min-w-0 truncate text-sm font-bold ${tone.title}`} title={parameter.name}>
          <button type="button" onClick={() => onSelectFilter(parameter.id)} className="truncate text-left hover:underline focus-visible:underline">
            {parameter.name}
          </button>
        </h2>
        <span aria-label={`${positiveChange ? "Up" : "Down"} ${Math.abs(parameter.change)} points`} className={`flex shrink-0 items-center gap-1 text-sm font-bold ${positiveChange ? "text-score-good" : "text-score-bad"}`}>
          <span aria-hidden="true" className="text-lg leading-none">{positiveChange ? "↑" : "↓"}</span>
          {positiveChange ? "+" : "−"}{Math.abs(parameter.change)}
        </span>
        <div className="ml-auto flex shrink-0 items-baseline gap-1 text-itri-900">
          <span className="text-lg font-bold leading-none">{parameter.score}</span>
          <span className="text-[10px] font-semibold">/100</span>
          <span className="ml-1 text-[10px] text-itri-700">({parameter.weight}%)</span>
        </div>
      </header>

      <div className="parameter-table-scroll min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed border-collapse text-[11px] text-itri-800">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[22%]" />
            <col className="w-[21%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead className={`sticky top-0 z-10 ${tone.header}`}>
            <tr className={`h-[27px] border-b ${tone.border}`}>
              <th scope="col" className="px-3 text-left font-medium">Subparameter</th>
              <th scope="col" className="border-l border-itri-200/80 px-1 text-center font-medium">Weightage</th>
              <th scope="col" className="border-l border-itri-200/80 px-1 text-center font-medium">Score</th>
              <th scope="col" className="border-l border-itri-200/80 px-1 text-center font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {parameter.subparameters.map((subparameter) => (
              <tr key={subparameter.id} className="h-[27px] border-b border-itri-200/70 last:border-b-0">
                <th scope="row" className="truncate px-3 text-left font-normal">
                  <button type="button" onClick={() => onSelectFilter(parameter.id, subparameter.id)} className="max-w-full truncate text-left hover:underline focus-visible:underline">
                    {subparameter.name}
                  </button>
                </th>
                <td className="border-l border-itri-200/70 px-1 text-center">{formatPercent(subparameter.weightage)}</td>
                <td className="border-l border-itri-200/70 px-1 text-center">{formatScore(subparameter.score)}</td>
                <td className={`border-l border-itri-200/70 px-1 text-center font-medium ${trendTone(subparameter.trend)}`}>
                  {formatTrend(subparameter.trend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function iconForParameter(id: string) {
  if (["availability", "security", "business-continuity"].includes(id)) return "shield";
  if (["governance", "others"].includes(id)) return "people";
  if (["reliability", "scalability"].includes(id)) return "chart";
  if (id === "modularity") return "nodes";
  return "document";
}

function ParameterIcon({ type }: { type: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" {...common}>
      {type === "shield" && <><path d="M12 2.8 20 6v5.2c0 5.1-3.4 8.4-8 10-4.6-1.6-8-4.9-8-10V6l8-3.2Z" /><path d="m12 7.5 1.2 2.5 2.8.4-2 1.9.5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-1.9 2.8-.4L12 7.5Z" /></>}
      {type === "people" && <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.2a5.5 5.5 0 0 1 11 0V19" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.4V19" /></>}
      {type === "chart" && <><path d="M4 19V5M4 19h17" /><rect x="7" y="12" width="3" height="5" rx=".6" /><rect x="13" y="9" width="3" height="8" rx=".6" /><rect x="19" y="6" width="2" height="11" rx=".5" /></>}
      {type === "nodes" && <><circle cx="6" cy="7" r="2.2" /><circle cx="18" cy="7" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="m8 8.5 2.7 6.9m5.3-6.9-2.7 6.9M8.2 7h7.6" /></>}
      {type === "document" && <><path d="M6 3.5h8l4 4V20H6z" /><path d="M14 3.5v4h4M9 12h6m-6 3h6" /></>}
    </svg>
  );
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatScore(value: number | null) {
  return value === null ? "—" : value.toFixed(0);
}

function formatTrend(value: number | null) {
  if (value === null) return "—";
  return `${value >= 0 ? "↑" : "↓"} ${Math.abs(value)}`;
}

function trendTone(value: number | null) {
  if (value === null || value === 0) return "text-itri-700";
  return value > 0 ? "text-score-good" : "text-score-bad";
}
