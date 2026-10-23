"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dashboardKpiData } from "@/features/dashboard/data/kpi-data";
import type { ModelConfiguration, ModelParameter, ModelSubparameter, MeasurementOperator } from "@/features/configure/types";
import { ChangeHistoryTab } from "@/features/configure/components/change-history-tab";

type ConfigureTab = "model" | "history";

const scoreBands: Record<string, Array<{ description: string; operator: MeasurementOperator; value: number; upperValue: number | null; score: number }>> = {
  uptime: [
    { description: "Uptime > 99.99%", operator: "GT", value: 99.99, upperValue: null, score: 5 },
    { description: "Uptime from 99.9% to under 99.99%", operator: "BETWEEN", value: 99.9, upperValue: 99.99, score: 4 },
    { description: "Uptime from 99% to under 99.9%", operator: "BETWEEN", value: 99, upperValue: 99.9, score: 3 },
    { description: "Uptime from 95% to under 99%", operator: "BETWEEN", value: 95, upperValue: 99, score: 2 },
    { description: "Uptime < 95%", operator: "LT", value: 95, upperValue: null, score: 1 },
  ],
  "incident response": [
    { description: "Zero P1 incidents", operator: "EQ", value: 0, upperValue: null, score: 5 },
    { description: "1 P1 incident", operator: "EQ", value: 1, upperValue: null, score: 4 },
    { description: "2 P1 incidents", operator: "EQ", value: 2, upperValue: null, score: 3 },
    { description: "3 P1 incidents", operator: "EQ", value: 3, upperValue: null, score: 2 },
    { description: "More than 3 P1 incidents", operator: "GT", value: 3, upperValue: null, score: 1 },
  ],
};

const genericCriteria = [
  { description: "80 or above", operator: "GTE" as const, value: 80, upperValue: null, score: 5 },
  { description: "60 to under 80", operator: "BETWEEN" as const, value: 60, upperValue: 80, score: 4 },
  { description: "40 to under 60", operator: "BETWEEN" as const, value: 40, upperValue: 60, score: 3 },
  { description: "20 to under 40", operator: "BETWEEN" as const, value: 20, upperValue: 40, score: 2 },
  { description: "Below 20", operator: "LT" as const, value: 20, upperValue: null, score: 1 },
];

const parameterDescriptions: Record<string, string> = {
  availability: "Measures whether critical systems and services remain accessible and recover within agreed service targets.",
  security: "Measures safeguards that protect services, infrastructure, and information from security threats.",
  integrity: "Measures the accuracy, consistency, and traceability of business and operational data.",
  governance: "Measures whether resilience responsibilities, policies, risks, and oversight are clearly established.",
  reliability: "Measures service stability and the ability to detect, respond to, and learn from operational failures.",
  "business-continuity": "Measures preparedness to sustain critical operations and restore them after disruption.",
  modularity: "Measures how independently systems can be changed, maintained, and integrated.",
  scalability: "Measures whether systems can handle changing demand without unacceptable service degradation.",
  others: "Measures supporting capabilities that contribute to resilient and sustainable service delivery.",
};

const subparameterDescriptions: Record<string, string> = {
  "availability-1": "Tracks the percentage of time systems deliver the required service during the assessment period.",
  "availability-2": "Assesses whether recovery plans restore critical services within approved recovery objectives.",
  "availability-3": "Assesses response time, throughput, and resource headroom under normal and peak load.",
  "availability-4": "Assesses whether redundant components can take over successfully when a primary component fails.",
  "availability-5": "Assesses whether capacity forecasts anticipate demand and trigger timely scaling actions.",
  "security-1": "Assesses whether access is authorized, least-privileged, and reviewed on a regular schedule.",
  "security-2": "Assesses how promptly relevant threats are detected, triaged, and escalated.",
  "security-3": "Assesses the coverage and timeliness of required security control and compliance evidence.",
  "security-4": "Assesses whether vulnerabilities are identified, prioritized, and remediated within target times.",
  "security-5": "Counts priority-one incidents that directly affect the business service or its users during the assessment period.",
  "security-6": "Assesses workforce completion and effectiveness of role-appropriate security training.",
  "integrity-1": "Assesses the completeness, accuracy, and validity of data used by critical services.",
  "integrity-2": "Assesses whether application controls prevent or detect unauthorized or invalid changes.",
  "integrity-3": "Assesses whether changes are reviewed, tested, approved, and traceable before release.",
  "integrity-4": "Assesses whether backups are verified and can restore consistent, usable data.",
  "integrity-5": "Assesses whether important actions and data changes are recorded in reviewable audit trails.",
  "governance-1": "Assesses whether current resilience policies are approved, communicated, and followed.",
  "governance-2": "Assesses whether resilience risks are identified, owned, and tracked through treatment.",
  "governance-3": "Assesses whether independent reviews identify issues and verify corrective actions.",
  "governance-4": "Assesses whether accountable owners are assigned for critical services and controls.",
  "governance-5": "Assesses whether leaders review resilience performance, risks, and actions at planned intervals.",
  "reliability-1": "Assesses the health, redundancy, and maintenance state of infrastructure supporting critical services.",
  "reliability-2": "Assesses application availability, error rates, and service-level objective performance.",
  "reliability-3": "Assesses monitoring coverage and whether alerts provide actionable early warning.",
  "reliability-4": "Assesses how quickly incidents are acknowledged, escalated, and mitigated.",
  "reliability-5": "Assesses achieved service uptime against the agreed availability target.",
  "reliability-6": "Assesses whether incidents result in documented reviews and completed corrective actions.",
  "business-continuity-1": "Assesses whether recovery capabilities meet the approved disaster recovery objectives.",
  "business-continuity-2": "Assesses whether business impact analyses are current and identify critical dependencies.",
  "business-continuity-3": "Assesses the completion and success of planned recovery exercises.",
  "business-continuity-4": "Assesses whether continuity plans are current, actionable, and available to responsible teams.",
  "business-continuity-5": "Assesses whether crisis roles, communications, and decisions are exercised and understood.",
  "modularity-1": "Assesses the ability to provision, change, or recover compute resources independently.",
  "modularity-2": "Assesses the ability to scale, replace, and recover storage without disrupting services.",
  "modularity-3": "Assesses whether network components and routes can be changed or recovered independently.",
  "modularity-4": "Assesses separation of system components and the impact of changes across boundaries.",
  "modularity-5": "Assesses the stability and recoverability of integrations between services and external systems.",
  "scalability-1": "Assesses whether data volume growth is forecast and handled within performance targets.",
  "scalability-2": "Assesses whether applications can handle rising workload while meeting service objectives.",
  "scalability-3": "Assesses whether infrastructure can expand or contract to meet workload demand.",
  "scalability-4": "Assesses whether automated capacity controls respond safely to workload changes.",
  "scalability-5": "Assesses whether demand forecasts and load tests inform capacity plans.",
  "others-1": "Assesses whether service costs are monitored and sustainable resilience choices are made.",
  "others-2": "Assesses supplier resilience, dependency visibility, and contingency arrangements.",
  "others-3": "Assesses whether environmental conditions and dependencies are monitored and managed.",
  "others-4": "Assesses whether teams have the skills and coverage required to operate and recover services.",
  "others-5": "Assesses whether operational procedures and system knowledge are complete and maintained.",
};

const initialModel: ModelConfiguration = {
  name: "ITRI Scoring Model",
  status: "DRAFT",
  goodThreshold: 75,
  okayThreshold: 50,
  parameters: dashboardKpiData.parameterScores.map((parameter, parameterIndex) => ({
    id: parameter.id,
    name: parameter.name,
    chartLabel: parameter.chartLabel,
    weight: parameter.weight,
    score: parameter.score,
    source: "Manual",
    sortOrder: parameterIndex,
    description: parameterDescriptions[parameter.id] ?? `Measures the resilience capability and outcomes covered by ${parameter.name}.`,
    measurement: "Calculated as the weighted average of its subparameter scores using their configured weights.",
    subparameters: parameter.subparameters.map((subparameter, index) => {
      const code = subparameter.id;
      const rubric = scoreBands[subparameter.name.toLowerCase()] ?? genericCriteria;
      return {
        id: code,
        name: subparameter.name,
        weight: subparameter.weightage ?? 0,
        score: subparameter.score ?? 0,
        source: "Manual",
        sortOrder: index,
        description: subparameterDescriptions[code] ?? `Assesses the effectiveness of ${subparameter.name.toLowerCase()} for ${parameter.name.toLowerCase()}.`,
        measurement: code === "availability-1"
          ? "Measured as the uptime percentage recorded for the systems over the assessment period."
          : code === "security-5"
            ? "Measured as the number of P1 incidents that directly impacted the business service or its users during the assessment period."
            : `Measured as a normalized 0–100 performance value against the approved target and service requirements; customize criteria to use a different unit or scale.`,
        measurementCriteria: rubric.map((criterion, criterionIndex) => ({ ...criterion, id: `${code}-criterion-${criterionIndex + 1}`, sortOrder: criterionIndex })),
      };
    }),
  })),
};

export function ConfigureScreen() {
  const [tab, setTab] = useState<ConfigureTab>("model");
  const [editing, setEditing] = useState(false);
  const [model, setModel] = useState<ModelConfiguration>(initialModel);
  const [expanded, setExpanded] = useState<string[]>(["availability", "security"]);
  const [savedNotice, setSavedNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/configuration")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message ?? "Could not load the configuration.");
        return payload.data as ModelConfiguration;
      })
      .then((configuration) => {
        if (!active) return;
        const scoreByParameter = new Map(dashboardKpiData.parameterScores.map((item) => [item.id, item]));
        setDraftAvailable(configuration.status === "DRAFT");
        setModel({
          ...configuration,
          parameters: configuration.parameters.map((parameter) => {
            const scoreData = scoreByParameter.get(parameter.id);
            const subScoreById = new Map(scoreData?.subparameters.map((item) => [item.id, item.score]) ?? []);
            return {
              ...parameter,
              score: scoreData?.score ?? 0,
              subparameters: parameter.subparameters.map((subparameter) => ({
                ...subparameter,
                score: subScoreById.get(subparameter.id) ?? 0,
              })),
            };
          }),
        });
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load the configuration.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveChanges() {
    setError(null);
    try {
      const response = await fetch("/api/v1/configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not save the configuration.");
      setDraftAvailable(true);
      setEditing(false);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the configuration.");
    }
  }

  async function publishDraft() {
    setError(null);
    setPublishing(true);
    try {
      const response = await fetch("/api/v1/configuration/publish", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not publish the configuration.");
      setDraftAvailable(false);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish the configuration.");
    } finally {
      setPublishing(false);
    }
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
      parameters: [...current.parameters, { id, name: "New Parameter", chartLabel: ["New Parameter"], weight: 0, score: 0, source: "Manual", sortOrder: current.parameters.length, description: "Describe the resilience capability this parameter covers.", measurement: "Describe how this parameter score is calculated.", subparameters: [] }],
    }));
    setExpanded((current) => [...current, id]);
  }

  function addSubparameter(parameterId: string) {
    const id = `subparameter-${crypto.randomUUID()}`;
    setModel((current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.id === parameterId
        ? { ...parameter, subparameters: [...parameter.subparameters, { id, name: "New Subparameter", weight: 0, score: 0, source: "Manual", sortOrder: parameter.subparameters.length, description: "Describe what this scoring item evaluates.", measurement: "Describe how this item is measured.", measurementCriteria: [] }] }
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
              {savedNotice && <span role="status" className="hidden text-xs text-score-good sm:inline">Saved to database</span>}
              {!editing && draftAvailable && <button type="button" disabled={publishing || loading} onClick={() => { void publishDraft(); }} className="inline-flex items-center justify-center rounded-md border border-itri-200 bg-white px-3 py-2 text-sm font-semibold text-itri-800 shadow-sm hover:bg-itri-50 disabled:opacity-50">{publishing ? "Publishing…" : "Publish"}</button>}
              <button
                type="button"
                onClick={editing ? () => { void saveChanges(); } : () => setEditing(true)}
                className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition ${editing ? "border-itri-700 bg-itri-700 text-white hover:bg-itri-800" : "border-itri-200 bg-white text-itri-800 hover:bg-itri-50"}`}
              >
                {editing ? <SaveIcon /> : <EditIcon />}
                {editing ? "Save" : "Edit"}
              </button>
            </div>
          )}
        </header>

        {error && <p role="alert" className="mt-3 rounded-md bg-score-bad-soft px-3 py-2 text-sm text-score-bad">{error}</p>}
        {tab === "model" ? (
          <div className="flex min-h-0 flex-1 flex-col pt-3">
            <div className="model-structure-scroll min-h-0 flex-1 overflow-auto rounded-t-md border border-itri-200">
              <table className="w-full min-w-[1050px] table-fixed border-collapse text-sm text-itri-800">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[9%]" />
                  <col className="w-[7%]" />
                  <col className="w-[25%]" />
                  <col className="w-[37%]" />
                </colgroup>
                <thead className="sticky top-0 z-20 bg-itri-50 text-left text-itri-800">
                  <tr className="h-11 border-b border-itri-200">
                    <th scope="col" className="px-4 font-semibold">Name</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Weight %</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Score</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Description</th>
                    <th scope="col" className="border-l border-itri-200 px-4 font-semibold">Measurement</th>
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
                    <td className="border-l border-itri-200 px-4 text-itri-600">—</td>
                  </tr>
                  {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-itri-600">Loading configuration…</td></tr> : model.parameters.map((parameter) => (
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
        <td className="border-l border-itri-200 p-2 align-top"><DescriptionField value={parameter.description} editing={editing} label={`${parameter.name} description`} onChange={(description) => onUpdateParameter({ description })} /></td>
        <td className="border-l border-itri-200 p-2 align-top"><DescriptionField value={parameter.measurement} editing={editing} label={`${parameter.name} measurement`} onChange={(measurement) => onUpdateParameter({ measurement })} /></td>
      </tr>
      {expanded && parameter.subparameters.map((subparameter, index) => (
        <tr key={subparameter.id} className="border-b border-itri-100 bg-white/20">
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
          <td className="border-l border-itri-200 p-2 align-top"><DescriptionField value={subparameter.description} editing={editing} label={`${subparameter.name} description`} onChange={(description) => onUpdateSubparameter(subparameter.id, { description })} /></td>
          <td className="border-l border-itri-200 p-2 align-top">
            <MeasurementEditor
              measurement={subparameter.measurement}
              criteria={subparameter.measurementCriteria}
              editing={editing}
              label={`${subparameter.name} measurement`}
              onMeasurementChange={(measurement) => onUpdateSubparameter(subparameter.id, { measurement })}
              onCriteriaChange={(measurementCriteria) => onUpdateSubparameter(subparameter.id, { measurementCriteria })}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

function DescriptionField({ value, editing, label, onChange }: { value: string; editing: boolean; label: string; onChange: (value: string) => void }) {
  if (!editing) return <p className="line-clamp-3 whitespace-normal text-xs leading-5 text-itri-700" title={value}>{value || "—"}</p>;
  return <textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full resize-y rounded border border-itri-200 bg-white px-2 py-1.5 text-xs leading-5 outline-none focus:border-itri-500 focus:ring-2 focus:ring-itri-500/20" />;
}

function MeasurementEditor({ measurement, criteria, editing, label, onMeasurementChange, onCriteriaChange }: {
  measurement: string;
  criteria: ModelSubparameter["measurementCriteria"];
  editing: boolean;
  label: string;
  onMeasurementChange: (value: string) => void;
  onCriteriaChange: (criteria: ModelSubparameter["measurementCriteria"]) => void;
}) {
  function updateCriterion(index: number, changes: Partial<ModelSubparameter["measurementCriteria"][number]>) {
    onCriteriaChange(criteria.map((criterion, criterionIndex) => criterionIndex === index ? { ...criterion, ...changes } : criterion));
  }
  function expression(criterion: ModelSubparameter["measurementCriteria"][number]) {
    const op = { GT: ">", GTE: "≥", EQ: "=", LT: "<", LTE: "≤", BETWEEN: "between" }[criterion.operator];
    return criterion.operator === "BETWEEN" ? `${criterion.value} ≤ value < ${criterion.upperValue}` : `value ${op} ${criterion.value}`;
  }
  const operators: Array<{ value: MeasurementOperator; label: string }> = [
    { value: "GT", label: "> Greater than" }, { value: "GTE", label: "≥ Greater than or equal" },
    { value: "EQ", label: "= Equal to" }, { value: "LT", label: "< Less than" },
    { value: "LTE", label: "≤ Less than or equal" }, { value: "BETWEEN", label: "Between" },
  ];
  if (!editing) return (
    <div className="space-y-1.5 text-xs leading-5">
      <p className="text-itri-700">{measurement || "—"}</p>
      {criteria.length > 0 && <ol className="list-inside list-decimal space-y-0.5 text-itri-800">
        {criteria.map((criterion) => <li key={criterion.id}>{criterion.description || expression(criterion)} <span className="text-itri-600">({expression(criterion)})</span> <span className="font-semibold">Score {criterion.score}/5</span></li>)}
      </ol>}
    </div>
  );
  return (
    <div className="space-y-2">
      <textarea aria-label={label} value={measurement} onChange={(event) => onMeasurementChange(event.target.value)} rows={2} placeholder="Describe the measured value and its unit" className="w-full resize-y rounded border border-itri-200 bg-white px-2 py-1.5 text-xs leading-5 outline-none focus:border-itri-500 focus:ring-2 focus:ring-itri-500/20" />
      <p className="text-[11px] leading-4 text-itri-600">Rules compare the submitted numeric value. Default general criteria use a 0–100 scale; set boundaries to match this metric’s unit.</p>
      <ol className="space-y-2">
        {criteria.map((criterion, index) => (
          <li key={criterion.id} className="space-y-1.5 rounded border border-itri-100 bg-white p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-itri-600">{index + 1}.</span>
              <select aria-label={`${label} criterion ${index + 1} operator`} value={criterion.operator} onChange={(event) => {
                const operator = event.target.value as MeasurementOperator;
                updateCriterion(index, { operator, upperValue: operator === "BETWEEN" ? (criterion.upperValue ?? criterion.value + 1) : null });
              }} className="min-w-0 flex-1 rounded border border-itri-200 bg-white px-1.5 py-1 text-xs">
                {operators.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs text-itri-700">{criterion.operator === "BETWEEN" ? "From" : "Value"}
                <input aria-label={`${label} criterion ${index + 1} boundary`} type="number" step="any" value={criterion.value} onChange={(event) => updateCriterion(index, { value: Number(event.target.value) })} className="w-20 rounded border border-itri-200 bg-white px-1.5 py-1 text-xs" />
              </label>
              {criterion.operator === "BETWEEN" && <label className="flex items-center gap-1 text-xs text-itri-700">To
                <input aria-label={`${label} criterion ${index + 1} upper boundary`} type="number" step="any" value={criterion.upperValue ?? ""} onChange={(event) => updateCriterion(index, { upperValue: Number(event.target.value) })} className="w-20 rounded border border-itri-200 bg-white px-1.5 py-1 text-xs" />
              </label>}
              <label className="flex items-center gap-1 text-xs text-itri-700">Score
                <input aria-label={`${label} criterion ${index + 1} score`} type="number" min="1" max="5" step="1" value={criterion.score} onChange={(event) => updateCriterion(index, { score: Number(event.target.value) })} className="w-14 rounded border border-itri-200 bg-white px-1.5 py-1 text-xs" />
              </label>
              <button type="button" aria-label={`Remove ${label} criterion ${index + 1}`} onClick={() => onCriteriaChange(criteria.filter((_, criterionIndex) => criterionIndex !== index))} className="grid size-7 shrink-0 place-items-center rounded text-score-bad hover:bg-score-bad-soft"><TrashIcon /></button>
            </div>
            <input aria-label={`${label} criterion ${index + 1} description`} value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} placeholder={`${expression(criterion)} → score ${criterion.score}`} className="w-full rounded border border-itri-200 bg-white px-2 py-1 text-xs" />
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onCriteriaChange([...criteria, { id: crypto.randomUUID(), description: "", operator: "GTE", value: 0, upperValue: null, score: 1, sortOrder: criteria.length }])} className="inline-flex items-center gap-1 text-xs font-semibold text-score-good hover:underline"><PlusIcon /> Add criterion</button>
    </div>
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
