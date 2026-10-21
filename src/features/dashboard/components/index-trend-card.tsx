import type { DashboardKpiData } from "@/features/dashboard/types";

type Props = { history: DashboardKpiData["indexHistory"] };

const viewWidth = 330;
const viewHeight = 270;
const left = 12;
const right = 336;
const top = 14;
const bottom = 238;

// 🟢 The gap (in pixels) between the Y-axis line and where the graph line actually starts/ends
const chartPaddingX = 16;

function yForScore(score: number) {
  return bottom - ((score - 50) / 50) * (bottom - top);
}

export function IndexTrendCard({ history }: Props) {
  // 🟢 Calculate actual boundaries for the graph line using the padding
  const graphLeft = left + chartPaddingX;
  const graphRight = right - chartPaddingX;

  const points = history.points.map((point, index) => ({
    ...point,
    // 🟢 Points now map between graphLeft and graphRight instead of absolute grid lines
    x: graphLeft + (index / Math.max(1, history.points.length - 1)) * (graphRight - graphLeft),
    y: yForScore(point.score),
  }));

  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  // 🟢 Fixed area points to drop down to the bottom baseline cleanly
  const areaPoints = `${points[0]?.x ?? graphLeft},${bottom} ${linePoints} ${points[points.length - 1]?.x ?? graphRight},${bottom}`;

  return (
    <article className="flex h-[244px] min-w-0 flex-col rounded-md border border-itri-200 bg-white/80 p-2 shadow-sm sm:p-3">
      <h2 className="sr-only">Index Trend</h2>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`ITRI scores: ${points.map(({ periodLabel, score }) => `\({periodLabel}\){score}`).join(", ")}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#44d3af" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#44d3af" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[50, 60, 70, 80, 90, 100].map((tick) => {
          const y = yForScore(tick);
          return (
            <g key={tick}>
              {/* Axis grid lines still stretch all the way from left to right */}
              <line x1={left} y1={y} x2={right} y2={y} stroke="#c5edf6" strokeWidth="1" />
              <text x={left - 10} y={y + 4} textAnchor="end" fontSize="11" className="fill-itri-700">{tick}</text>
            </g>
          );
        })}
        {/* 🟢 Vertical grid lines now match up with the separated graph points */}
        {points.map(({ x }, index) => <line key={`grid-${index}`} x1={x} y1={top} x2={x} y2={bottom} stroke="#d9f3f8" strokeWidth="1" />)}
        <polygon points={areaPoints} fill="url(#trend-fill)" />
        <polyline points={linePoints} fill="none" stroke="#08a779" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(({ periodId, periodLabel, score, x, y }) => (
          <g key={periodId}>
            <circle cx={x} cy={y} r="5.8" fill="#08aeb3" stroke="white" strokeWidth="2" />
            <text x={x} y={y - 13} textAnchor="middle" fontSize="14" fontWeight="700" className="fill-itri-800">{score}</text>
            <text x={x} y={bottom + 20} textAnchor="middle" fontSize="11" className="fill-itri-800">{periodLabel}</text>
          </g>
        ))}
      </svg>
    </article>
  );
}
