"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dashboardKpiData } from "@/features/dashboard/data/kpi-data";
import type { ModelConfiguration, ModelParameter, ModelSubparameter } from "@/features/configure/types";
import { ChangeHistoryTab } from "@/features/configure/components/change-history-tab";

type ConfigureTab = "model" | "history";

const STORAGE_KEY = "itri-model-configuration";
const parameterSources: Record<string, string> = {
  availability: "SolarWinds",
  security: "Splunk",
  integrity: "Datadog",
  governance: "Weighted Avg",
  reliability: "Datadog",
  "business-continuity": "Manual",
  modularity: "Splunk",
  scalability: "Datadog",
  others: "Manual",
};

const initialModel: ModelConfiguration = {
  parameters: dashboardKpiData.parameterScores.map((parameter) => ({
    id: parameter.id,
    name: parameter.name,
    weight: parameter.weight,
    score: parameter.score,
    source: parameterSources[parameter.id] ?? "Weighted Avg",
    subparameters: parameter.subparameters.map((subparameter, index) => ({
      id: subparameter.id,
      name: subparameter.name,
      weight: subparameter.weightage ?? 0,
      score: subparameter.score ?? 0,
      source: (parameter.id === "availability" && index === 1)
        || (parameter.id === "integrity" && index === 1)
        || (parameter.id === "business-continuity" && index === 2)
        ? "Manual"
        : parameterSources[parameter.id] ?? "Weighted Avg",
    })),
  })),
};

export function ConfigureScreen() {
  const [tab, setTab] = useState<ConfigureTab>("model");
  const [editing, setEditing] = useState(false);
  const [model, setModel] = useState<ModelConfiguration>(initialModel);
  const [expanded, setExpanded] = useState<string[]>(["availability", "security"]);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ModelConfiguration;
      if (Array.isArray(parsed.parameters)) setModel(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function saveChanges() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    setEditing(false);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  }

  function updateParameter(parameterId: string, changes: Partial<ModelParameter>) {
    setModel((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.id === parameterId ? { ...parameter, ...changes } : parameter),
    }));
  }

  function updateSubparameter(parameterId: string, subparameterId: string, changes: Partial<ModelSubparameter>) {
    setModel((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.id === parameterId
        ? { ...parameter, subparameters: parameter.subparameters.map((subparameter) => subparameter.id === subparameterId ? { ...subparameter, ...changes } : subparameter) }
        : parameter),
    }));
  }

  function addParameter() {
    const id = `parameter-${crypto.randomUUID()}`;
    setModel((current) => ({
      ...current,
      parameters: [...current.parameters, { id, name: "New Parameter", weight: 0, score: 0, source: "Manual", subparameters: [] }],
    }));
    setExpanded((current) => [...current, id]);
  }

  function addSubparameter(parameterId: string) {
    const id = `subparameter-${crypto.randomUUID()}`;
    setModel((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.id === parameterId
        ? { ...parameter, subparameters: [...parameter.subparameters, { id, name: "New Subparameter", weight: 0, score: 0, source: "Manual" }] }
        : parameter),
    }));
    setExpanded((current) => current.includes(parameterId) ? current : [...current, parameterId]);
  }

  function removeParameter(parameterId: string) {
    setModel((current) => ({
      ...current,
      parameters: current.parameters.filter((parameter) => parameter.id !== parameterId),
    }));
    setExpanded((current) => current.filter((id) => id !== parameterId));
  }

  function removeSubparameter(parameterId: string, subparameterId: string) {
    setModel((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.id === parameterId
        ? { ...parameter, subparameters: parameter.subparameters.filter((subparameter) => subparameter.id !== subparameterId) }
        : parameter),
    }));
  }

  function toggleExpanded(parameterId: string) {
    setExpanded((current) => current.includes(parameterId) ? current.filter((id) => id !== parameterId) : [...current, parameterId]);
  }

  return (
    <div className="h-full min-h-0 w-full px-3 py-4 sm:px-5">
      <section aria-label="Configuration editor" className="flex h-full min-h-0 flex-col rounded-lg border border-itri-200 bg-white/80 p-3 shadow-sm sm:p-4">
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-itri-200 pb-3">
          <div role="tablist" aria-label="Configuration sections" className="flex min-w-0 flex-1 items-center gap-2">
            <TabButton active={tab === "model"} onClick={() => setTab("model")}>
              <ModelIcon />
              Model Structure
            </TabButton>
            <TabButton active={tab === "history"} onClick={() => setTab("history")}>
              <HistoryIcon />
              Change History
            </TabButton>
          </div>
          {tab === "model" && (
            <div className="flex shrink-0 items-center gap-3">
              {savedNotice && <span role="status" className="hidden text-xs text-score-good sm:inline">Saved on this device</span>}
              <button
                type="button"
                onClick={editing ? saveChanges : () => setEditing(true)}
                className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition ${editing ? "border-itri-700 bg-itri-700 text-white hover:bg-itri-800" : "border-itri-200 bg-white text-itri-800 hover:bg-itri-50"}`}
              >
                {editing ? <SaveIcon /> : <EditIcon />}
                {editing ? "Save" : "Edit"}
              </button>
            </div>
          )}
        </header>

        {tab === "model" ? (
          <div className="flex min-h-0 flex-1 flex-col pt-3">
            <div className="model-structure-scroll min-h-0 flex-1 overflow-auto rounded-t-md border border-itri-200">
              <table className="w-full min-w-[700px] table-fixed border-collapse text-sm text-itri-800">
                <colgroup>
                  <col className="w-[44%]" />
                  <col className="w-[15%]" />
                  <col className="w-[17%]" />
                  <col />
                </colgroup>
                <thead className="sticky top-0 z-20 bg-itri-50 text-left text-itri-800">
                  <tr className="h-11 border-b border-itri-200">
                    <th scope="col" className="px-4 font-semibold">Name</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Weight %</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Score</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-12 border-b border-itri-200 bg-white/50 font-semibold">
                    <th scope="row" className="px-4 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-itri-600">⌄</span>
                        <span className="grid size-8 place-items-center rounded-full bg-score-good text-white"><RootIcon /></span>
                        <span>ITRI</span>
                      </div>
                    </th>
                    <td className="border-l border-itri-200 px-4">100%</td>
                    <td className="border-l border-itri-200 px-4">{dashboardKpiData.currentIndex.score}</td>
                    <td className="border-l border-itri-200 px-4 text-itri-600">—</td>
                  </tr>
                  {model.parameters.map((parameter) => (
                    <ParameterRows
                      key={parameter.id}
                      parameter={parameter}
                      expanded={expanded.includes(parameter.id)}
                      editing={editing}
                      onToggle={() => toggleExpanded(parameter.id)}
                      onUpdateParameter={(changes) => updateParameter(parameter.id, changes)}
                      onUpdateSubparameter={(subparameterId, changes) => updateSubparameter(parameter.id, subparameterId, changes)}
                      onAddSubparameter={() => addSubparameter(parameter.id)}
                      onRemoveParameter={() => removeParameter(parameter.id)}
                      onRemoveSubparameter={(subparameterId) => removeSubparameter(parameter.id, subparameterId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {editing && (
              <button type="button" onClick={addParameter} className="flex shrink-0 items-center gap-2 rounded-b-md border-x border-b border-itri-200 bg-itri-50/70 px-5 py-3 text-sm font-semibold text-score-good hover:bg-score-good-soft">
                <PlusIcon /> Add Parameter
              </button>
            )}
          </div>
        ) : (
          <ChangeHistoryTab />
        )}
      </section>
    </div>
  );
}

function ParameterRows({
  parameter,
  expanded,
  editing,
  onToggle,
  onUpdateParameter,
  onUpdateSubparameter,
  onAddSubparameter,
  onRemoveParameter,
  onRemoveSubparameter,
}: {
  parameter: ModelParameter;
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onUpdateParameter: (changes: Partial<ModelParameter>) => void;
  onUpdateSubparameter: (id: string, changes: Partial<ModelSubparameter>) => void;
  onAddSubparameter: () => void;
  onRemoveParameter: () => void;
  onRemoveSubparameter: (id: string) => void;
}) {
  return (
    <>
      <tr className="h-12 border-b border-itri-200 bg-white/35">
        <th scope="row" className="px-4 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${parameter.name}`} aria-expanded={expanded} onClick={onToggle} className="grid size-4 shrink-0 place-items-center text-itri-600">
              <ChevronIcon open={expanded} />
            </button>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-parameter-availability text-white"><ParameterIcon /></span>
            <EditableText value={parameter.name} editing={editing} label="Parameter name" onChange={(name) => onUpdateParameter({ name })} strong />
            {editing && (
              <button type="button" onClick={onAddSubparameter} className="ml-3 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-score-good hover:text-score-good/75">
                <PlusIcon /> Add Subparameter
              </button>
            )}
            {editing && (
              <button type="button" aria-label={`Remove ${parameter.name}`} title="Remove parameter" onClick={onRemoveParameter} className="ml-auto grid size-8 shrink-0 place-items-center rounded text-score-bad hover:bg-score-bad-soft focus-visible:outline-2 focus-visible:outline-score-bad">
                <TrashIcon />
              </button>
            )}
          </div>
        </th>
        <td className="border-l border-itri-200 px-4 font-semibold"><EditableWeight value={parameter.weight} editing={editing} label={`${parameter.name} weight`} onChange={(weight) => onUpdateParameter({ weight })} /></td>
        <td className="border-l border-itri-200 px-4 font-semibold">{parameter.score}</td>
        <td className="border-l border-itri-200 px-4">{parameter.source}</td>
      </tr>
      {expanded && parameter.subparameters.map((subparameter, index) => (
        <tr key={subparameter.id} className="h-12 border-b border-itri-100 bg-white/20">
          <th scope="row" className="px-4 text-left font-normal">
            <div className="ml-10 flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="w-6 shrink-0 border-t border-itri-200" />
              <span className="text-itri-700"><SubparameterIcon index={index} /></span>
              <EditableText value={subparameter.name} editing={editing} label="Subparameter name" onChange={(name) => onUpdateSubparameter(subparameter.id, { name })} />
              {editing && (
                <button type="button" aria-label={`Remove ${subparameter.name}`} title="Remove subparameter" onClick={() => onRemoveSubparameter(subparameter.id)} className="ml-auto grid size-8 shrink-0 place-items-center rounded text-score-bad hover:bg-score-bad-soft focus-visible:outline-2 focus-visible:outline-score-bad">
                  <TrashIcon />
                </button>
              )}
            </div>
          </th>
          <td className="border-l border-itri-200 px-4"><EditableWeight value={subparameter.weight} editing={editing} label={`${subparameter.name} weight`} onChange={(weight) => onUpdateSubparameter(subparameter.id, { weight })} /></td>
          <td className="border-l border-itri-200 px-4">
            {editing && subparameter.source === "Manual"
              ? <NumberInput value={subparameter.score} label={`${subparameter.name} score`} onChange={(score) => onUpdateSubparameter(subparameter.id, { score })} />
              : subparameter.score}
          </td>
          <td className="border-l border-itri-200 px-4">{subparameter.source}</td>
        </tr>
      ))}
    </>
  );
}

function EditableText({ value, editing, label, onChange, strong = false }: { value: string; editing: boolean; label: string; onChange: (value: string) => void; strong?: boolean }) {
  if (!editing) return <span className={`min-w-0 truncate ${strong ? "font-semibold" : ""}`}>{value}</span>;
  return <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={`min-w-0 flex-1 rounded border border-itri-200 bg-white px-2 py-1 outline-none focus:border-itri-500 focus:ring-2 focus:ring-itri-500/20 ${strong ? "font-semibold" : ""}`} />;
}

function EditableWeight({ value, editing, label, onChange }: { value: number; editing: boolean; label: string; onChange: (value: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {editing ? <NumberInput value={value} label={label} onChange={onChange} /> : <>{formatNumber(value)}%</>}
      {editing && <span aria-hidden="true" className="text-itri-500"><EditIcon /></span>}
    </span>
  );
}

function NumberInput({ value, label, onChange }: { value: number; label: string; onChange: (value: number) => void }) {
  return <input type="number" min="0" max="100" step="0.1" aria-label={label} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-20 rounded border border-itri-200 bg-white px-2 py-1 outline-none focus:border-itri-500 focus:ring-2 focus:ring-itri-500/20" />;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold transition sm:px-5 ${active ? "bg-score-good-soft text-itri-700" : "text-itri-700 hover:bg-itri-50"}`}>
      {children}
    </button>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 transition-transform ${open ? "rotate-90" : "-rotate-90"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4" /></svg>;
}

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3v14M3 10h14" /></svg>;
}

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m13.8 3.2 3 3M4 16l1-.2 9.5-9.5a2.1 2.1 0 0 0-3-3L2 12l-.5 4.5L4 16Z" /></svg>;
}

function SaveIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h12l2 2v12H3z" /><path d="M6 3v5h8V3M6 17v-6h8v6" /></svg>;
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 5.5h13M8 5.5V3.2h4v2.3m-6.5 0 .7 11h7.6l.7-11M8 8.5v5.5m4-5.5v5.5" /></svg>;
}

function ModelIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="m11 7-4 8.5M13 7l4 8.5M8.5 18h7" /></svg>;
}

function HistoryIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9L3.5 8.5" /><path d="M3.5 3.5v5h5M12 7v5l3.5 2" /></svg>;
}

function RootIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 7 3v5c0 4.5-2.8 7.6-7 9-4.2-1.4-7-4.5-7-9V6l7-3Z" /><path d="m9.5 11.5 1.7 1.7 3.5-3.8" /></svg>;
}

function ParameterIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.3" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></svg>;
}

function SubparameterIcon({ index }: { index: number }) {
  const icons = [
    <svg key="screen" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8m-4-4v4M7 8h2m2 0h2m2 0h2M7 12h4m2 0h4" /></svg>,
    <svg key="gauge" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17a8 8 0 1 1 16 0M12 13l4-4M7 17h.1m9.8 0h.1" /></svg>,
    <svg key="cloud" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z" /></svg>,
    <svg key="database" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>,
  ];
  return icons[index % icons.length];
}
