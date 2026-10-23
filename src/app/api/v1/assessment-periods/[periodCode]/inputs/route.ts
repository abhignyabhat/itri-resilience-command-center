import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { inputBatchSchema } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ periodCode: string }> }) {
  try {
    const { periodCode } = await context.params;
    const model = await prisma.modelVersion.findFirst({ where: { status: "PUBLISHED" }, orderBy: { version: "desc" } });
    if (!model) throw new Error("NOT_FOUND");
    const period = await prisma.assessmentPeriod.findUnique({
      where: { code: periodCode },
      include: {
        inputs: {
          where: { subparameter: { parameter: { modelVersionId: model.id } } },
          include: { subparameter: { include: { parameter: true } } },
          orderBy: { recordedAt: "desc" },
        },
      },
    });
    if (!period) throw new Error("NOT_FOUND");
    return jsonOk({
      period: { id: period.code, label: period.label, status: period.status },
      inputs: period.inputs.map((input) => ({
        subparameterId: input.subparameter.code,
        subparameter: input.subparameter.name,
        parameterId: input.subparameter.parameter.code,
        parameter: input.subparameter.parameter.name,
        score: Number(input.score),
        measuredValue: input.measuredValue == null ? null : Number(input.measuredValue),
        notes: input.notes,
        source: input.source,
        recordedAt: input.recordedAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ periodCode: string }> }) {
  try {
    const { periodCode } = await context.params;
    const body = inputBatchSchema.parse(await readJson(request));
    const period = await prisma.assessmentPeriod.findUnique({ where: { code: periodCode } });
    if (!period) throw new Error("NOT_FOUND");
    if (body.userId && !await prisma.user.findUnique({ where: { id: body.userId } })) throw new Error("VALIDATION:Unknown userId.");
    const currentModel = await prisma.modelVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { version: "desc" },
      include: {
        parameters: {
          include: {
            subparameters: {
              include: { measurementCriteria: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });
    const activeSubparameters = new Map(currentModel?.parameters.flatMap((parameter) => parameter.subparameters.map((subparameter) => [subparameter.code, subparameter] as const)) ?? []);
    if (body.inputs.some((input) => !activeSubparameters.has(input.subparameterId))) throw new Error("VALIDATION:An input references a subparameter outside the active scoring model.");

    const prepared = body.inputs.map((input) => {
      const subparameter = activeSubparameters.get(input.subparameterId)!;
      const matchedCriterion = input.measuredValue === undefined ? null : subparameter.measurementCriteria.find((criterion) => {
        const measured = input.measuredValue!;
        const boundary = Number(criterion.value);
        const upper = criterion.upperValue == null ? null : Number(criterion.upperValue);
        switch (criterion.operator) {
          case "GT": return measured > boundary;
          case "GTE": return measured >= boundary;
          case "EQ": return measured === boundary;
          case "LT": return measured < boundary;
          case "LTE": return measured <= boundary;
          case "BETWEEN": return upper !== null && measured >= boundary && measured < upper;
        }
      });
      if (input.measuredValue !== undefined && !matchedCriterion) {
        throw new Error(`VALIDATION:No scoring criterion matches measured value ${input.measuredValue} for ${subparameter.name}.`);
      }
      return {
        input,
        subparameter,
        score: input.measuredValue === undefined ? input.score! : matchedCriterion!.score * 20,
        matchedCriterionId: matchedCriterion?.id ?? null,
      };
    });

    const saved = await prisma.$transaction(async (tx) => {
      const changes = [];
      for (const { input, subparameter, score, matchedCriterionId } of prepared) {
        const previous = await tx.assessmentInput.findUnique({ where: { assessmentPeriodId_subparameterId: { assessmentPeriodId: period.id, subparameterId: subparameter.id } } });
        await tx.assessmentInput.upsert({
          where: { assessmentPeriodId_subparameterId: { assessmentPeriodId: period.id, subparameterId: subparameter.id } },
          create: { assessmentPeriodId: period.id, subparameterId: subparameter.id, score, measuredValue: input.measuredValue ?? null, notes: input.notes, recordedById: body.userId },
          update: { score, measuredValue: input.measuredValue ?? null, notes: input.notes, recordedById: body.userId, recordedAt: new Date() },
        });
        changes.push({ subparameterId: input.subparameterId, before: previous ? Number(previous.score) : null, after: score, measuredValue: input.measuredValue ?? null, matchedCriterionId, parameter: subparameter.parameterId, subparameter: subparameter.name });
      }
      await tx.assessmentPeriod.update({ where: { id: period.id }, data: { status: "IN_PROGRESS" } });
      await tx.auditEvent.create({ data: { userId: body.userId, action: "ASSESSMENT_INPUTS_SAVED", entityType: "AssessmentPeriod", entityId: period.id, summary: `Saved ${prepared.length} assessment input(s) for ${period.label}.`, details: { changes } } });
      return tx.assessmentInput.findMany({ where: { assessmentPeriodId: period.id } });
    });
    return jsonOk({
      periodCode,
      savedCount: prepared.length,
      inputs: saved.map((input) => ({ subparameterId: input.subparameterId, score: Number(input.score), measuredValue: input.measuredValue == null ? null : Number(input.measuredValue), notes: input.notes })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
