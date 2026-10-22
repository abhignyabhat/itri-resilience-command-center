import { prisma } from "@/lib/prisma";

export async function calculateAssessment(periodCode: string) {
  const [period, model] = await Promise.all([
    prisma.assessmentPeriod.findUnique({
      where: { code: periodCode },
      include: { inputs: true },
    }),
    prisma.modelVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { version: "desc" },
      include: { parameters: { orderBy: { sortOrder: "asc" }, include: { subparameters: { orderBy: { sortOrder: "asc" } } } } },
    }),
  ]);

  if (!period || !model) throw new Error("NOT_FOUND");
  const inputBySubparameter = new Map(period.inputs.map((input) => [input.subparameterId, Number(input.score)]));
  const requiredCount = model.parameters.reduce((count, parameter) => count + parameter.subparameters.length, 0);
  const scoredCount = inputBySubparameter.size;
  const complete = scoredCount === requiredCount;
  let knownWeight = 0;
  let weightedPoints = 0;

  const calculatedParameters = model.parameters.map((parameter) => {
    const knownSubparameters = parameter.subparameters.filter((subparameter) => inputBySubparameter.has(subparameter.id));
    const knownSubparameterWeight = knownSubparameters.reduce((sum, subparameter) => sum + Number(subparameter.weight), 0);
    const score = knownSubparameterWeight > 0
      ? knownSubparameters.reduce((sum, subparameter) => sum + Number(subparameter.weight) * (inputBySubparameter.get(subparameter.id) ?? 0), 0) / knownSubparameterWeight
      : null;
    const parameterComplete = knownSubparameters.length === parameter.subparameters.length;
    if (score !== null) {
      knownWeight += Number(parameter.weight);
      weightedPoints += Number(parameter.weight) * score;
    }
    return { parameter, score, parameterComplete, knownSubparameters };
  });

  const provisionalEstimate = knownWeight > 0 ? weightedPoints / knownWeight : null;
  const score = complete ? provisionalEstimate : null;
  const result = await prisma.$transaction(async (tx) => {
    const snapshot = await tx.scoreSnapshot.upsert({
      where: { assessmentPeriodId_modelVersionId: { assessmentPeriodId: period.id, modelVersionId: model.id } },
      create: {
        assessmentPeriodId: period.id,
        modelVersionId: model.id,
        score: score === null ? null : score,
        provisionalEstimate,
        isProvisional: !complete,
        scoredCount,
        requiredCount,
      },
      update: {
        score: score === null ? null : score,
        provisionalEstimate,
        isProvisional: !complete,
        scoredCount,
        requiredCount,
        createdAt: new Date(),
      },
    });

    await tx.parameterResult.deleteMany({ where: { snapshotId: snapshot.id } });
    for (const item of calculatedParameters) {
      const parameterResult = await tx.parameterResult.create({
        data: {
          snapshotId: snapshot.id,
          parameterId: item.parameter.id,
          score: item.score,
          isProvisional: !item.parameterComplete,
          subparameterResults: {
            create: item.parameter.subparameters.map((subparameter) => ({
              subparameterId: subparameter.id,
              score: inputBySubparameter.has(subparameter.id) ? inputBySubparameter.get(subparameter.id) : null,
            })),
          },
        },
      });
      void parameterResult;
    }

    await tx.assessmentPeriod.update({
      where: { id: period.id },
      data: { status: complete ? "COMPLETE" : scoredCount > 0 ? "PROVISIONAL" : "PLANNED" },
    });
    await tx.auditEvent.create({
      data: {
        action: "ASSESSMENT_CALCULATED",
        entityType: "AssessmentPeriod",
        entityId: period.id,
        summary: complete ? `Calculated complete assessment ${period.label}.` : `Calculated provisional assessment ${period.label} (${scoredCount}/${requiredCount} inputs).`,
        details: { scoredCount, requiredCount, isProvisional: !complete, score, provisionalEstimate },
      },
    });
    return snapshot;
  });

  return { snapshot: result, isProvisional: !complete, score, provisionalEstimate, scoredCount, requiredCount };
}
