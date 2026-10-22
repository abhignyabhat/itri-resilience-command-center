import { z } from "zod";

const score = z.number().finite().min(0).max(100);

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
    subparameters: z.array(z.object({
      id: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(120),
      weight: score,
      sortOrder: z.number().int().nonnegative().default(0),
      source: z.string().trim().min(1).max(80).default("Manual"),
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
  model.parameters.forEach((parameter, index) => checkWeights(parameter.subparameters.map((subparameter) => subparameter.weight), ["parameters", index, "subparameters"]));
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
    score,
    notes: z.string().max(2000).optional(),
  })).min(1).refine((inputs) => new Set(inputs.map((input) => input.subparameterId)).size === inputs.length, "Input subparameter IDs must be unique in a batch."),
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
