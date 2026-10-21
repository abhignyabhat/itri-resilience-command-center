"use client";

import { useMemo, useState } from "react";
import { downloadHistory, type DownloadHistoryEntry } from "@/features/history/data/download-history";

type RangeFilter = "30" | "90" | "365" | "all";
type SortKey = "reportName" | "downloadedAt" | "user";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const PAGE_SIZE = 20;

export function DownloadHistory() {
  const [range, setRange] = useState<RangeFilter>("30");
  const [sort, setSort] = useState<SortState>({ key: "downloadedAt", direction: "desc" });
  const [page, setPage] = useState(1);

  const sortedEntries = useMemo(() => {
    const now = new Date();
    const cutoff = range === "all" ? null : new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    return downloadHistory
      .filter((entry) => cutoff === null || new Date(entry.downloadedAt) >= cutoff)
      .sort((a, b) => {
        const aValue = sort.key === "downloadedAt" ? new Date(a.downloadedAt).getTime() : a[sort.key].toLocaleLowerCase();
        const bValue = sort.key === "downloadedAt" ? new Date(b.downloadedAt).getTime() : b[sort.key].toLocaleLowerCase();
        const result = typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
        return sort.direction === "asc" ? result : -result;
      });
  }, [range, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleEntries = sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = sortedEntries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, sortedEntries.length);

  function changeRange(nextRange: RangeFilter) {
    setRange(nextRange);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  }

  return (
    <div className="h-full min-h-0 w-full px-3 py-4 sm:px-5">
      <section aria-labelledby="downloads-heading" className="flex h-full min-h-0 w-full flex-col rounded-lg border border-itri-200 bg-white/80 p-3 shadow-sm sm:p-5">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 id="downloads-heading" className="flex items-center gap-3 text-xl font-bold text-itri-800 sm:text-2xl">
            <span className="grid size-10 place-items-center rounded-lg bg-itri-50 text-itri-700">
              <DownloadTrayIcon />
            </span>
            Report Downloads
          </h1>

          <label className="relative flex items-center gap-2 rounded-md border border-itri-200 bg-white px-3 py-2 text-sm text-itri-800 shadow-sm focus-within:ring-2 focus-within:ring-itri-500/30">
            <CalendarIcon />
            <span className="sr-only">Filter downloads by date</span>
            <select
              value={range}
              onChange={(event) => changeRange(event.target.value as RangeFilter)}
              className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <ChevronIcon />
          </label>
        </header>

        <div className="history-table-scroll min-h-0 flex-1 overflow-auto rounded-lg border border-itri-200">
          <table className="w-full min-w-[680px] table-fixed border-collapse text-sm text-itri-800">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[32%]" />
              <col />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-itri-50 text-left text-itri-900">
              <tr className="h-12 border-b border-itri-200">
                <th scope="col" className="px-4">
                  <SortButton label="Report Name" active={sort.key === "reportName"} direction={sort.direction} onClick={() => toggleSort("reportName")} />
                </th>
                <th scope="col" className="border-l border-itri-200 px-4">
                  <SortButton label="Date & Time" active={sort.key === "downloadedAt"} direction={sort.direction} onClick={() => toggleSort("downloadedAt")} />
                </th>
                <th scope="col" className="border-l border-itri-200 px-4">
                  <SortButton label="User" active={sort.key === "user"} direction={sort.direction} onClick={() => toggleSort("user")} />
                </th>
                <th scope="col" aria-label="Download report" className="border-l border-itri-200" />
              </tr>
            </thead>
            <tbody>
              {visibleEntries.length > 0 ? visibleEntries.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              )) : (
                <tr>
                  <td colSpan={4} className="h-28 px-4 text-center text-itri-600">No reports found for this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 pt-4 text-sm text-itri-700">
          <nav aria-label="Download history pages" className="flex items-center gap-1">
            <PageButton ariaLabel="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronIcon direction="left" />
            </PageButton>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-current={currentPage === pageNumber ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
                className={`grid size-9 place-items-center rounded-md border text-sm ${currentPage === pageNumber ? "border-itri-700 bg-itri-700 font-semibold text-white" : "border-itri-200 bg-white text-itri-800 hover:bg-itri-50"}`}
              >
                {pageNumber}
              </button>
            ))}
            <PageButton ariaLabel="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
              <ChevronIcon direction="right" />
            </PageButton>
          </nav>
          <p aria-live="polite">Showing {firstResult}–{lastResult} of {sortedEntries.length} reports</p>
        </footer>
      </section>
    </div>
  );
}

function HistoryRow({ entry }: { entry: DownloadHistoryEntry }) {
  return (
    <tr className="h-[52px] border-b border-itri-100 last:border-b-0 hover:bg-itri-50/70">
      <td className="truncate px-4 font-medium" title={entry.reportName}>{entry.reportName}</td>
      <td className="whitespace-nowrap border-l border-itri-100 px-4">{formatDate(entry.downloadedAt)}</td>
      <td className="truncate border-l border-itri-100 px-4" title={entry.user}>{entry.user}</td>
      <td className="border-l border-itri-100 text-center">
        <button
          type="button"
          aria-label={`Download ${entry.reportName} from ${formatDate(entry.downloadedAt)}`}
          title="Download report"
          onClick={() => downloadReport(entry)}
          className="inline-grid size-9 place-items-center rounded-md text-itri-700 transition hover:bg-itri-100 hover:text-itri-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-itri-600"
        >
          <DownloadIcon />
        </button>
      </td>
    </tr>
  );
}

function downloadReport(entry: DownloadHistoryEntry) {
  const rows = [
    ["Report", entry.reportName],
    ["Downloaded at", formatDate(entry.downloadedAt)],
    ["Downloaded by", entry.user],
    ["IT Resilience Index", "78/100"],
    ["Status", "Good"],
    ["Note", "Sample report generated by the front-end demo."],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${entry.reportName.toLowerCase().replaceAll(" ", "-")}-${entry.id}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

function SortButton({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortState["direction"]; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 font-semibold hover:text-itri-600">
      {label}
      <SortIcon active={active} direction={direction} />
    </button>
  );
}

function PageButton({ children, ariaLabel, disabled, onClick }: { children: React.ReactNode; ariaLabel: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={ariaLabel} disabled={disabled} onClick={onClick} className="grid size-9 place-items-center rounded-md border border-itri-200 bg-white text-itri-800 hover:bg-itri-50 disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortState["direction"] }) {
  return <span aria-hidden="true" className={`text-[10px] leading-none ${active ? "text-itri-700" : "text-itri-500"}`}>{active ? (direction === "asc" ? "▲" : "▼") : "↕"}</span>;
}

function DownloadTrayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v5h14v-5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v5h14v-5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 text-itri-700" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="13" rx="2" />
      <path d="M6.5 2.5v4M13.5 2.5v4M3 8h14" />
    </svg>
  );
}

function ChevronIcon({ direction = "down" }: { direction?: "down" | "left" | "right" }) {
  const rotation = direction === "left" ? "rotate-90" : direction === "right" ? "-rotate-90" : "";
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-3.5 text-itri-700 ${rotation}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
