"use client";

import { useRef } from "react";
import type { ParameterScore, RemediationItem } from "@/features/dashboard/types";

export type RemediationFilter = {
  parameterId: string | null;
  subparameterId: string | null;
};

type Props = {
  parameters: ParameterScore[];
  remediations: RemediationItem[];
  filter: RemediationFilter;
  onFilterChange: (filter: RemediationFilter) => void;
};

export function RemediationsCard({ parameters, remediations, filter, onFilterChange }: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const selectedParameter = parameters.find((parameter) => parameter.id === filter.parameterId);
  const selectedSubparameter = selectedParameter?.subparameters.find((subparameter) => subparameter.id === filter.subparameterId);
  const filterLabel = selectedSubparameter?.name ?? selectedParameter?.name ?? "All parameters";
  const filteredRemediations = remediations.filter((item) => {
    if (filter.parameterId === null) return true;
    if (item.parameterId !== filter.parameterId) return false;
    return filter.subparameterId === null || item.subparameterId === filter.subparameterId;
  });

  function chooseFilter(nextFilter: RemediationFilter) {
    onFilterChange(nextFilter);
    if (menuRef.current) menuRef.current.open = false;
  }

  return (
    <section aria-labelledby="remediations-heading" className="mt-4 rounded-md border border-itri-200 bg-white/80 p-2 shadow-sm sm:p-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="remediations-heading" className="flex items-center gap-2 text-base font-bold text-itri-700">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-itri-600 text-white">
            <ClipboardIcon />
          </span>
          Remediations &amp; Next Steps
        </h2>

        <details ref={menuRef} className="relative text-xs">
          <summary className="flex min-w-36 cursor-pointer list-none items-center justify-between gap-3 rounded border border-itri-200 bg-white px-2.5 py-1.5 text-itri-800 hover:bg-itri-50 [&::-webkit-details-marker]:hidden">
            <span className="max-w-40 truncate">{filterLabel}</span>
            <ChevronIcon />
          </summary>
          <div className="absolute right-0 z-30 mt-1 max-h-80 min-w-64 overflow-y-auto rounded-md border border-itri-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => chooseFilter({ parameterId: null, subparameterId: null })}
              className={`w-full rounded px-2 py-1.5 text-left hover:bg-itri-50 ${filter.parameterId === null ? "font-semibold text-itri-800" : "text-itri-700"}`}
            >
              All parameters
            </button>
            <div className="my-1 border-t border-itri-100" />
            {parameters.map((parameter) => (
              <div key={parameter.id} className="rounded">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => chooseFilter({ parameterId: parameter.id, subparameterId: null })}
                    className={`min-w-0 flex-1 truncate text-left ${filter.parameterId === parameter.id && filter.subparameterId === null ? "font-semibold text-itri-800" : "text-itri-700"}`}
                  >
                    {parameter.name}
                  </button>
                  <details className="group">
                    <summary aria-label={`Show ${parameter.name} subparameters`} className="cursor-pointer list-none p-1 text-itri-500 [&::-webkit-details-marker]:hidden">
                      <span className="block -rotate-90 transition-transform group-open:rotate-0"><ChevronIcon /></span>
                    </summary>
                    <div className="ml-1 border-l border-itri-100 pl-2">
                      {parameter.subparameters.map((subparameter) => (
                        <button
                          key={subparameter.id}
                          type="button"
                          onClick={() => chooseFilter({ parameterId: parameter.id, subparameterId: subparameter.id })}
                          className={`block w-full truncate rounded px-2 py-1.5 text-left hover:bg-itri-50 ${filter.subparameterId === subparameter.id ? "font-semibold text-itri-800" : "text-itri-600"}`}
                        >
                          {subparameter.name}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </details>
      </header>

      <div className="remediation-table-scroll max-h-[220px] overflow-auto rounded-md border border-itri-200">
        <table className="w-full min-w-[680px] table-fixed border-collapse text-xs text-itri-700">
          <colgroup>
            <col className="w-8" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-itri-50 text-itri-700">
            <tr className="h-8 border-b border-itri-200 text-left">
              <th scope="col" aria-label="Priority" />
              <th scope="col" className="px-2 font-semibold">Parameter</th>
              <th scope="col" className="border-l border-itri-200 px-2 font-semibold">Subparameter</th>
              <th scope="col" className="border-l border-itri-200 px-2 font-semibold">Remediation</th>
            </tr>
          </thead>
          <tbody>
            {filteredRemediations.length > 0 ? filteredRemediations.map((item) => {
              const parameter = parameters.find((entry) => entry.id === item.parameterId);
              const subparameter = parameter?.subparameters.find((entry) => entry.id === item.subparameterId);
              return (
                <tr key={item.id} className="h-8 border-b border-itri-100 last:border-b-0">
                  <td className="px-2 text-center"><PriorityDot priority={item.priority} /></td>
                  <td className="truncate px-2" title={item.title}>{item.title}</td>
                  <td className="border-l border-itri-100 px-2">{subparameter?.name ?? "—"}</td>
                  <td className="border-l border-itri-100 px-2">{item.remediation}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-3 py-5 text-center text-itri-600">No remediation items for this selection.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriorityDot({ priority }: { priority: RemediationItem["priority"] }) {
  const tone = priority === "high" ? "bg-score-bad" : priority === "medium" ? "bg-score-okay" : "bg-score-good";
  return <span aria-label={`${priority} priority`} className={`inline-block size-2.5 rounded-full ${tone}`} title={`${priority} priority`} />;
}

function ClipboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M8.5 9h7M8.5 13h7M8.5 17h4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
