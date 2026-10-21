import type { ParameterScore } from "@/features/dashboard/types";

type Props = { parameters: ParameterScore[] };

const chartWidth = 340;
const chartHeight = 250;
const centerX = 170;
const centerY = 118;
const radius = 88;
const labelRadius = 105;

function pointAt(index: number, total: number, distance: number, score = 100) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const scaledRadius = distance * (score / 100);
  return {
    x: centerX + Math.cos(angle) * scaledRadius,
    y: centerY + Math.sin(angle) * scaledRadius,
  };
}

function polygonPoints(count: number, distance: number) {
  return Array.from({ length: count }, (_, index) => {
    const { x, y } = pointAt(index, count, distance);
    return `${x},${y}`;
  }).join(" ");
}

export function ParameterLandscapeCard({ parameters }: Props) {
  const scorePoints = parameters.map((parameter, index) => {
    const { x, y } = pointAt(index, parameters.length, radius, parameter.score);
    return `${x},${y}`;
  }).join(" ");

  return (
    <article className="flex h-[244px] min-w-0 flex-col rounded-md border border-itri-200 bg-white/80 p-1 shadow-sm sm:p-2">
      <h2 className="sr-only">Parameter Landscape</h2>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`Parameter scores: ${parameters.map(({ name, score }) => `${name} ${score}`).join(", ")}`} className="h-full w-full overflow-visible">
        {[25, 50, 75, 100].map((level) => (
          <polygon key={level} points={polygonPoints(parameters.length, radius * (level / 100))} fill="none" stroke="#9ee4f5" strokeWidth="0.8" />
        ))}

        {parameters.map((parameter, index) => {
          const end = pointAt(index, parameters.length, radius);
          const label = pointAt(index, parameters.length, labelRadius);
          const angle = -Math.PI / 2 + (index / parameters.length) * Math.PI * 2;
          const anchor = Math.cos(angle) > 0.25 ? "start" : Math.cos(angle) < -0.25 ? "end" : "middle";
          const labelOffset = Math.sin(angle) > 0.55 ? 2 : -3;
          const score = pointAt(index, parameters.length, radius, parameter.score);

          return (
            <g key={parameter.id}>
              <line x1={centerX} y1={centerY} x2={end.x} y2={end.y} stroke="#a5e8f6" strokeWidth="0.8" />
              <circle cx={score.x} cy={score.y} r="3.5" fill="#08a779" stroke="white" strokeWidth="1" />
              <text x={label.x} y={label.y + labelOffset} textAnchor={anchor} className="fill-itri-800" fontSize="11" fontWeight="500">
                {parameter.chartLabel.map((line, lineIndex) => (
                  <tspan key={`${parameter.id}-${line}`} x={label.x} dy={lineIndex === 0 ? 0 : 12}>{line}</tspan>
                ))}
                <tspan x={label.x} dy="13" fontSize="13" fontWeight="700">{parameter.score}</tspan>
              </text>
            </g>
          );
        })}

        <polygon points={scorePoints} fill="#29c99a" fillOpacity="0.17" stroke="#079669" strokeWidth="1.8" />
        {parameters.map((parameter, index) => {
          const point = pointAt(index, parameters.length, radius, parameter.score);
          return <circle key={parameter.id} cx={point.x} cy={point.y} r="3.2" fill="#079669" />;
        })}
      </svg>
    </article>
  );
}
