"use client";

import { useMemo, useState, type ReactNode } from "react";
import { dashboardKpiData } from "@/features/dashboard/data/kpi-data";

type RangeFilter = "30" | "90" | "365" | "all";

const PAGE_SIZE = 10;
const users = ["Abhignya Bhat", "Rahul Nair", "Priya Sharma", "Karan Mehta", "Meera Iyer"];
const changes = [
  "Changed weight from 12% to 14%",
  "Updated manual score from 70 to 76",
  "Added subparameter",
  "Changed weight from 20% to 25%",
  "Updated parameter name",
  "Changed weight from 10% to 12%",
  "Updated manual score from 65 to 72",
  "Removed subparameter",
];
const anchorDate = Date.UTC(2026, 9, 16, 5, 15);

const historyEntries = Array.from({ length: 42 }, (_, index) => {
  const parameter = dashboardKpiData.parameterScores[(index * 3) % dashboardKpiData.parameterScores.length];
  const subparameter = parameter.subparameters[index % parameter.subparameters.length];
  return {
    id: `change-${index + 1}`,
    user: users[index % users.length],
    parameter: parameter.name,
    subparameter: subparameter.name,
    change: changes[index % changes.length],
    changedAt: new Date(anchorDate - index * 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

export function ChangeHistoryTab() {
  const [range, setRange] = useState<RangeFilter>("30");
  const [page, setPage] = useState(1);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const cutoff = range === "all" ? null : new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    return historyEntries.filter((entry) => cutoff === null || new Date(entry.changedAt) >= cutoff);
  }, [range]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = filteredEntries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredEntries.length);

  function changeRange(value: RangeFilter) {
    setRange(value);
    setPage(1);
  }

  return (
    <div aria-label="Change history" className="flex min-h-0 flex-1 flex-col pt-3">
      <div className="mb-3 flex shrink-0 items-center justify-end">
        <label className="flex items-center gap-2 rounded-md border border-itri-200 bg-white px-3 py-2 text-sm text-itri-800 shadow-sm focus-within:ring-2 focus-within:ring-itri-500/30">
          <CalendarIcon />
          <span className="sr-only">Filter changes by date</span>
          <select value={range} onChange={(event) => changeRange(event.target.value as RangeFilter)} className="cursor-pointer appearance-none bg-transparent pr-2 outline-none">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          <ChevronIcon />
        </label>
      </div>

      <div className="model-structure-scroll min-h-0 flex-1 overflow-auto rounded-md border border-itri-200">
        <table className="w-full min-w-[680px] table-fixed border-collapse text-sm text-itri-800">
          <colgroup>
            <col className="w-20" />
            <col className="w-[22%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
            <col />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-itri-50 text-left text-itri-800">
            <tr className="h-11 border-b border-itri-200">
              <th scope="col" className="px-4 font-semibold">Sr No</th>
              <th scope="col" className="border-l border-itri-200 px-4 font-semibold">User</th>
              <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Parameter</th>
              <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Subparameter</th>
              <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.length > 0 ? visibleEntries.map((entry, index) => (
              <tr key={entry.id} className="h-12 border-b border-itri-100 last:border-b-0 hover:bg-itri-50/60">
                <td className="px-4 text-itri-600">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td className="truncate border-l border-itri-100 px-4" title={entry.user}>{entry.user}</td>
                <td className="truncate border-l border-itri-100 px-4" title={entry.parameter}>{entry.parameter}</td>
                <td className="truncate border-l border-itri-100 px-4" title={entry.subparameter}>{entry.subparameter}</td>
                <td className="border-l border-itri-100 px-4">{entry.change}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="h-28 px-4 text-center text-itri-600">No changes found for this date range.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 pt-3 text-sm text-itri-700">
        <nav aria-label="Change history pages" className="flex items-center gap-1">
          <PageButton label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronIcon direction="left" />
          </PageButton>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-current={currentPage === pageNumber ? "page" : undefined}
              onClick={() => setPage(pageNumber)}
              className={`grid size-9 place-items-center rounded-md border ${currentPage === pageNumber ? "border-itri-700 bg-itri-700 font-semibold text-white" : "border-itri-200 bg-white text-itri-800 hover:bg-itri-50"}`}
            >
              {pageNumber}
            </button>
          ))}
          <PageButton label="Next page" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            <ChevronIcon direction="right" />
          </PageButton>
        </nav>
        <p aria-live="polite">Showing {firstResult}–{lastResult} of {filteredEntries.length} changes</p>
      </footer>
    </div>
  );
}

function PageButton({ children, label, disabled, onClick }: { children: ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-9 place-items-center rounded-md border border-itri-200 bg-white text-itri-800 hover:bg-itri-50 disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 text-itri-700" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="14" height="13" rx="2" /><path d="M6.5 2.5v4M13.5 2.5v4M3 8h14" /></svg>;
}

function ChevronIcon({ direction = "down" }: { direction?: "down" | "left" | "right" }) {
  const rotation = direction === "left" ? "rotate-90" : direction === "right" ? "-rotate-90" : "";
  return <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-3.5 text-itri-700 ${rotation}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4" /></svg>;
}
