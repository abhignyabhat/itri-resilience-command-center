import { errorResponse, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const model = await prisma.modelVersion.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { version: "desc" },
      include: { parameters: { orderBy: { sortOrder: "asc" }, include: { subparameters: { orderBy: { sortOrder: "asc" } } } } },
    });
    if (!model) throw new Error("NOT_FOUND");
    const periods = await prisma.assessmentPeriod.findMany({
      orderBy: { endsAt: "desc" },
      include: { snapshots: { where: { modelVersionId: model.id }, include: { parameterResults: { include: { parameter: true, subparameterResults: true } } } } },
    });
    const periodWithSnapshot = periods.filter((period) => period.snapshots.length > 0);
    const currentPeriod = periodWithSnapshot[0];
    const previousPeriod = periodWithSnapshot[1];
    const currentSnapshot = currentPeriod?.snapshots[0];
    const previousSnapshot = previousPeriod?.snapshots[0];
    const currentResults = new Map(currentSnapshot?.parameterResults.map((result) => [result.parameterId, result]) ?? []);
    const previousResults = new Map(previousSnapshot?.parameterResults.map((result) => [result.parameterId, result]) ?? []);
    const result = (currentSnapshot?.score ?? currentSnapshot?.provisionalEstimate);
    const previousValue = previousSnapshot?.score ?? previousSnapshot?.provisionalEstimate;
    const parameterScores = model.parameters.map((parameter) => {
      const parameterResult = currentResults.get(parameter.id);
      const prior = previousResults.get(parameter.id);
      const subResults = new Map(parameterResult?.subparameterResults.map((item) => [item.subparameterId, item]) ?? []);
      const change = parameterResult?.score != null && prior?.score != null ? Number(parameterResult.score) - Number(prior.score) : 0;
      return {
        id: parameter.code,
        name: parameter.name,
        chartLabel: parameter.chartLabel,
        score: parameterResult?.score == null ? null : Number(parameterResult.score),
        weight: Number(parameter.weight),
        change,
        isProvisional: parameterResult?.isProvisional ?? true,
        subparameters: parameter.subparameters.map((subparameter) => ({
          id: subparameter.code,
          name: subparameter.name,
          weightage: Number(subparameter.weight),
          score: subResults.get(subparameter.id)?.score == null ? null : Number(subResults.get(subparameter.id)!.score),
          trend: null,
        })),
      };
    });
    const status = !currentSnapshot || currentSnapshot.isProvisional ? "provisional" : result == null ? "provisional" : Number(result) >= Number(model.goodThreshold) ? "good" : Number(result) >= Number(model.okayThreshold) ? "okay" : "bad";
    const contributors = parameterScores.map((parameter) => ({ parameterId: parameter.id, change: Number((parameter.change * parameter.weight / 100).toFixed(2)) })).filter((item) => item.change !== 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return jsonOk({
      modelVersion: { id: model.id, version: model.version, name: model.name },
      currentIndex: {
        periodId: currentPeriod?.code ?? null,
        periodLabel: currentPeriod?.label ?? "No assessment yet",
        score: currentSnapshot?.score == null ? null : Number(currentSnapshot.score),
        provisionalEstimate: currentSnapshot?.provisionalEstimate == null ? null : Number(currentSnapshot.provisionalEstimate),
        status,
        isProvisional: currentSnapshot?.isProvisional ?? true,
        scoredCount: currentSnapshot?.scoredCount ?? 0,
        requiredCount: currentSnapshot?.requiredCount ?? model.parameters.reduce((sum, parameter) => sum + parameter.subparameters.length, 0),
      },
      comparisons: periodWithSnapshot.slice(1, 3).map((period) => {
        const snapshot = period.snapshots[0];
        const compareValue = snapshot.score ?? snapshot.provisionalEstimate;
        return { periodId: period.code, periodLabel: period.label, change: result != null && compareValue != null ? Number((Number(result) - Number(compareValue)).toFixed(2)) : null };
      }),
      parameterScores,
      indexHistory: {
        cadence: "half-yearly",
        points: periodWithSnapshot.slice().reverse().map((period) => {
          const snapshot = period.snapshots[0];
          return { periodId: period.code, periodLabel: period.label, score: snapshot.score == null ? snapshot.provisionalEstimate == null ? null : Number(snapshot.provisionalEstimate) : Number(snapshot.score), isProvisional: snapshot.isProvisional };
        }),
      },
      changeSummary: {
        comparedToPeriodId: previousPeriod?.code ?? null,
        netChange: result != null && previousValue != null ? Number((Number(result) - Number(previousValue)).toFixed(2)) : null,
        contributors,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
