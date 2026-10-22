import { prisma } from "@/lib/prisma";
import { configurationSchema } from "@/lib/validation";
import type { z } from "zod";

export type ConfigurationPayload = z.infer<typeof configurationSchema>;

export function configurationDto(model: Awaited<ReturnType<typeof getCurrentConfiguration>>) {
  return {
    id: model.id,
    version: model.version,
    name: model.name,
    status: model.status,
    goodThreshold: Number(model.goodThreshold),
    okayThreshold: Number(model.okayThreshold),
    publishedAt: model.publishedAt,
    parameters: model.parameters.map((parameter) => ({
      id: parameter.code,
      name: parameter.name,
      chartLabel: parameter.chartLabel,
      weight: Number(parameter.weight),
      sortOrder: parameter.sortOrder,
      source: parameter.source,
      subparameters: parameter.subparameters.map((subparameter) => ({ id: subparameter.code, name: subparameter.name, weight: Number(subparameter.weight), sortOrder: subparameter.sortOrder, source: subparameter.source })),
    })),
  };
}

export async function getCurrentConfiguration() {
  const model = await prisma.modelVersion.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { version: "desc" },
    include: { parameters: { orderBy: { sortOrder: "asc" }, include: { subparameters: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!model) throw new Error("NOT_FOUND");
  return model;
}

export async function saveConfigurationDraft(payload: ConfigurationPayload) {
  const validated = configurationSchema.safeParse(payload);
  if (!validated.success) throw new Error(`VALIDATION:${validated.error.issues.map((issue) => issue.message).join(" ")}`);
  const config = validated.data;

  return prisma.$transaction(async (tx) => {
    let draft = await tx.modelVersion.findFirst({ where: { status: "DRAFT" }, orderBy: { version: "desc" } });
    if (!draft) {
      const latest = await tx.modelVersion.aggregate({ _max: { version: true } });
      draft = await tx.modelVersion.create({ data: { version: (latest._max.version ?? 0) + 1, name: config.name, status: "DRAFT", goodThreshold: config.goodThreshold, okayThreshold: config.okayThreshold } });
    } else {
      await tx.modelVersion.update({ where: { id: draft.id }, data: { name: config.name, goodThreshold: config.goodThreshold, okayThreshold: config.okayThreshold } });
      await tx.parameter.deleteMany({ where: { modelVersionId: draft.id } });
    }

    for (const [parameterIndex, parameter] of config.parameters.entries()) {
      await tx.parameter.create({
        data: {
          modelVersionId: draft.id,
          code: parameter.id,
          name: parameter.name,
          chartLabel: parameter.chartLabel ?? [parameter.name],
          weight: parameter.weight,
          sortOrder: parameter.sortOrder || parameterIndex,
          source: parameter.source,
          subparameters: { create: parameter.subparameters.map((subparameter, subparameterIndex) => ({
            code: subparameter.id,
            name: subparameter.name,
            weight: subparameter.weight,
            sortOrder: subparameter.sortOrder || subparameterIndex,
            source: subparameter.source,
          })) },
        },
      });
    }

    await tx.auditEvent.create({
      data: { action: "CONFIGURATION_DRAFT_SAVED", entityType: "ModelVersion", entityId: draft.id, summary: `Saved model version ${draft.version} as a draft.`, details: { parameterCount: config.parameters.length } },
    });
    return tx.modelVersion.findUniqueOrThrow({
      where: { id: draft.id },
      include: { parameters: { orderBy: { sortOrder: "asc" }, include: { subparameters: { orderBy: { sortOrder: "asc" } } } } },
    });
  });
}

export async function publishConfiguration() {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.modelVersion.findFirst({
      where: { status: "DRAFT" },
      orderBy: { version: "desc" },
      include: { parameters: { include: { subparameters: true } } },
    });
    if (!draft) throw new Error("NOT_FOUND");
    const issues: string[] = [];
    const parameterWeight = draft.parameters.reduce((sum, parameter) => sum + Number(parameter.weight), 0);
    if (Math.abs(parameterWeight - 100) > 0.01) issues.push(`Parameter weights must total 100%; received ${parameterWeight.toFixed(2)}%.`);
    for (const parameter of draft.parameters) {
      const childWeight = parameter.subparameters.reduce((sum, subparameter) => sum + Number(subparameter.weight), 0);
      if (Math.abs(childWeight - 100) > 0.01) issues.push(`${parameter.name} subparameter weights must total 100%; received ${childWeight.toFixed(2)}%.`);
    }
    if (issues.length) throw new Error(`VALIDATION:${issues.join(" ")}`);

    const published = await tx.modelVersion.update({ where: { id: draft.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await tx.auditEvent.create({ data: { action: "CONFIGURATION_PUBLISHED", entityType: "ModelVersion", entityId: draft.id, summary: `Published model version ${draft.version}.` } });
    return published;
  });
}
