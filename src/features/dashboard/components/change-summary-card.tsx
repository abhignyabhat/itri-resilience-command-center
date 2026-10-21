"use client";

import type { DashboardKpiData } from "@/features/dashboard/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  summary: DashboardKpiData["changeSummary"];
};

const parameterNames: Record<string, string> = {
  availability: "Availability",
  security: "Security",
  integrity: "Integrity",
  governance: "Governance",
  reliability: "Reliability",
  "business-continuity": "Business Continuity",
  modularity: "Modularity & Flexibility",
  scalability: "Scalability",
  others: "Others",
};

export function ChangeSummaryCard({ summary }: Props) {
  const contributorsRef = useRef<HTMLUListElement>(null);
  const [scrollbar, setScrollbar] = useState({ visible: false, thumbHeight: 0, thumbOffset: 0 });

  useEffect(() => {
    const list = contributorsRef.current;
    if (!list) return;

    const updateScrollbar = () => {
      const viewportHeight = list.clientHeight;
      const contentHeight = list.scrollHeight;
      const maxScroll = contentHeight - viewportHeight;
      const thumbHeight = maxScroll > 0
        ? Math.max(30, (viewportHeight * viewportHeight) / contentHeight)
        : viewportHeight;
      const maxThumbOffset = Math.max(0, viewportHeight - thumbHeight);
      const thumbOffset = maxScroll > 0 ? (list.scrollTop / maxScroll) * maxThumbOffset : 0;

      setScrollbar({ visible: maxScroll > 0, thumbHeight, thumbOffset });
    };

    updateScrollbar();
    list.addEventListener("scroll", updateScrollbar, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollbar);
    resizeObserver.observe(list);

    return () => {
      list.removeEventListener("scroll", updateScrollbar);
      resizeObserver.disconnect();
    };
  }, [summary.contributors.length]);

  return (
    <article className="flex h-[244px] min-w-0 flex-col overflow-hidden rounded-md border border-itri-200 bg-white/80 p-4 shadow-sm">
      <h2 className="mb-2 shrink-0 text-lg font-bold leading-tight text-itri-800">Why did ITRI change?</h2>
      <div className="flex shrink-0 items-center gap-3 border-b border-itri-100 pb-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${summary.netChange >= 0 ? "bg-score-good-soft text-score-good" : "bg-score-bad-soft text-score-bad"}`}>
          <span aria-hidden="true" className="text-2xl font-bold leading-none">{summary.netChange >= 0 ? "↑" : "↓"}</span>
        </span>
        <span className={`text-2xl font-bold ${summary.netChange >= 0 ? "text-score-good" : "text-score-bad"}`}>
          {summary.netChange > 0 ? "+" : ""}{summary.netChange}
        </span>
        <span className="text-xs leading-tight text-itri-700">vs. previous half-year</span>
      </div>
      <div className="relative mt-1 min-h-0 flex-1">
        <ul ref={contributorsRef} className="dashboard-scrollbar h-full overflow-y-auto pr-3 divide-y divide-itri-100">
          {summary.contributors.map((contributor) => (
            <li key={contributor.parameterId} className="flex min-h-10 items-center justify-between gap-3 text-sm">
              <span className="truncate text-itri-800">{parameterNames[contributor.parameterId] ?? contributor.parameterId}</span>
              <span className={`shrink-0 font-semibold ${contributor.change >= 0 ? "text-score-good" : "text-score-bad"}`}>
                {contributor.change > 0 ? "+" : ""}{contributor.change.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
        {scrollbar.visible && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1.5 rounded-full bg-itri-100">
            <span
              className="absolute left-0 top-0 w-full rounded-full bg-itri-700"
              style={{ height: `${scrollbar.thumbHeight}px`, transform: `translateY(${scrollbar.thumbOffset}px)` }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
