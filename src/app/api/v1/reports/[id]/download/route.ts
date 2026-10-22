import { errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const report = await prisma.reportDownload.findUnique({ where: { id } });
    if (!report) throw new Error("NOT_FOUND");
    const model = await prisma.modelVersion.findFirst({ where: { status: "PUBLISHED" }, orderBy: { version: "desc" } });
    const period = report.periodId
      ? await prisma.assessmentPeriod.findUnique({
        where: { code: report.periodId },
        include: { snapshots: { where: { modelVersionId: model?.id }, include: { parameterResults: { include: { parameter: true } } } } },
      })
      : null;
    const snapshot = period?.snapshots[0];
    const rows = [
      ["Report", report.reportType],
      ["Assessment period", period?.label ?? "Not available"],
      ["Index score", snapshot?.score == null ? "Provisional" : Number(snapshot.score).toFixed(2)],
      ["Provisional estimate", snapshot?.provisionalEstimate == null ? "" : Number(snapshot.provisionalEstimate).toFixed(2)],
      ["Coverage", snapshot ? `${snapshot.scoredCount}/${snapshot.requiredCount}` : "0/0"],
      ...((snapshot?.parameterResults ?? []).map((result) => [result.parameter.name, result.score == null ? "Missing" : Number(result.score).toFixed(2)])),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${report.fileName}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
