import { z } from "zod";

const score = z.number().finite().min(0).max(100);

const measurementCriterionSchema = z.object({
  description: z.string().trim().max(500).default(""),
  operator: z.enum(["GT", "GTE", "EQ", "LT", "LTE", "BETWEEN"]),
  value: z.number().finite(),
  upperValue: z.number().finite().nullable().optional(),
  score: z.number().int().min(1).max(5),
  sortOrder: z.number().int().nonnegative().optional(),
}).superRefine((criterion, ctx) => {
  if (criterion.operator === "BETWEEN" && (criterion.upperValue == null || criterion.upperValue <= criterion.value)) {
    ctx.addIssue({ code: "custom", path: ["upperValue"], message: "A between rule needs an upper boundary greater than its lower boundary." });
  }
  if (criterion.operator !== "BETWEEN" && criterion.upperValue != null) {
    ctx.addIssue({ code: "custom", path: ["upperValue"], message: "Only between rules can have an upper boundary." });
  }
});

export const configurationSchema = z.object({
  name: z.string().trim().min(1).max(120).default("ITRI Scoring Model"),
  goodThreshold: score.default(75),
  okayThreshold: score.default(50),
  parameters: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(120),
    chartLabel: z.array(z.string().trim().min(1).max(60)).min(1).max(3).optional(),
    weight: score,
    sortOrder: z.number().int().nonnegative().default(0),
    source: z.string().trim().min(1).max(80).default("Manual"),
    description: z.string().trim().max(1500).default(""),
    measurement: z.string().trim().max(1500).default(""),
    subparameters: z.array(z.object({
      id: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(120),
      weight: score,
      sortOrder: z.number().int().nonnegative().default(0),
      source: z.string().trim().min(1).max(80).default("Manual"),
      description: z.string().trim().max(1500).default(""),
      measurement: z.string().trim().max(1500).default(""),
      measurementCriteria: z.array(measurementCriterionSchema).max(20).default([]),
    })).min(1),
  })).min(1),
}).superRefine((model, ctx) => {
  if (model.okayThreshold >= model.goodThreshold) {
    ctx.addIssue({ code: "custom", path: ["goodThreshold"], message: "Good threshold must be greater than the okay threshold." });
  }
  const checkWeights = (weights: number[], path: (string | number)[]) => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 100) > 0.01) {
      ctx.addIssue({ code: "custom", path, message: `Weights must total 100%; received ${total.toFixed(2)}%.` });
    }
  };
  checkWeights(model.parameters.map((parameter) => parameter.weight), ["parameters"]);
  model.parameters.forEach((parameter, index) => {
    checkWeights(parameter.subparameters.map((subparameter) => subparameter.weight), ["parameters", index, "subparameters"]);
    parameter.subparameters.forEach((subparameter, subparameterIndex) => {
      const interval = (criterion: z.infer<typeof measurementCriterionSchema>) => {
        switch (criterion.operator) {
          case "GT": return { low: criterion.value, lowInclusive: false, high: Infinity, highInclusive: false };
          case "GTE": return { low: criterion.value, lowInclusive: true, high: Infinity, highInclusive: false };
          case "EQ": return { low: criterion.value, lowInclusive: true, high: criterion.value, highInclusive: true };
          case "LT": return { low: -Infinity, lowInclusive: false, high: criterion.value, highInclusive: false };
          case "LTE": return { low: -Infinity, lowInclusive: false, high: criterion.value, highInclusive: true };
          case "BETWEEN": return { low: criterion.value, lowInclusive: true, high: criterion.upperValue ?? Infinity, highInclusive: false };
        }
      };
      const rules = subparameter.measurementCriteria;
      for (let left = 0; left < rules.length; left += 1) {
        for (let right = left + 1; right < rules.length; right += 1) {
          const a = interval(rules[left]);
          const b = interval(rules[right]);
          const low = Math.max(a.low, b.low);
          const high = Math.min(a.high, b.high);
          const intersects = low < high || (low === high && ((low === a.low ? a.lowInclusive : a.highInclusive) && (low === b.low ? b.lowInclusive : b.highInclusive)));
          if (intersects) {
            ctx.addIssue({ code: "custom", path: ["parameters", index, "subparameters", subparameterIndex, "measurementCriteria", right], message: `Scoring rules overlap for ${subparameter.name}; adjust their boundaries so each value matches one score.` });
          }
        }
      }
    });
  });
  const parameterIds = model.parameters.map((parameter) => parameter.id);
  if (new Set(parameterIds).size !== parameterIds.length) ctx.addIssue({ code: "custom", path: ["parameters"], message: "Parameter IDs must be unique." });
  for (const parameter of model.parameters) {
    const subparameterIds = parameter.subparameters.map((subparameter) => subparameter.id);
    if (new Set(subparameterIds).size !== subparameterIds.length) ctx.addIssue({ code: "custom", path: ["parameters"], message: `Subparameter IDs in ${parameter.name} must be unique.` });
  }
});

export const inputBatchSchema = z.object({
  userId: z.string().optional(),
  inputs: z.array(z.object({
    subparameterId: z.string().min(1),
    score: score.optional(),
    measuredValue: z.number().finite().optional(),
    notes: z.string().max(2000).optional(),
  }).refine((input) => (input.score !== undefined) !== (input.measuredValue !== undefined), "Provide exactly one of score or measuredValue.")).min(1).refine((inputs) => new Set(inputs.map((input) => input.subparameterId)).size === inputs.length, "Input subparameter IDs must be unique in a batch."),
});

export const remediationUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const assessmentPeriodSchema = z.object({
  code: z.string().trim().min(1).max(32),
  label: z.string().trim().min(1).max(80),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  userId: z.string().optional(),
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), "Assessment period end must be after its start.");

export const remediationCreateSchema = z.object({
  subparameterId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueAt: z.string().datetime().nullable().optional(),
});
