import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportRequestSchema = z.object({
  reportType: z.enum(["RESILIENCE_REPORT", "PARAMETER_SUMMARY", "TREND_REPORT"]).default("RESILIENCE_REPORT"),
  periodCode: z.string().optional(),
  userId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const days = url.searchParams.get("days");
    const since = days && Number(days) > 0 ? new Date(Date.now() - Number(days) * 86_400_000) : undefined;
    const where = since ? { downloadedAt: { gte: since } } : {};
    const [total, entries] = await Promise.all([
      prisma.reportDownload.count({ where }),
      prisma.reportDownload.findMany({ where, include: { user: { select: { id: true, name: true } } }, orderBy: { downloadedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return jsonOk({ items: entries.map((entry) => ({ id: entry.id, reportName: reportLabel(entry.reportType), downloadedAt: entry.downloadedAt, user: entry.user?.name ?? "Demo User", downloadUrl: `/api/v1/reports/${entry.id}/download` })), pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = reportRequestSchema.parse(await readJson(request));
    const user = body.userId ? await prisma.user.findUnique({ where: { id: body.userId } }) : null;
    if (body.userId && !user) throw new Error("VALIDATION:Unknown userId.");
    const period = body.periodCode ? await prisma.assessmentPeriod.findUnique({ where: { code: body.periodCode } }) : await prisma.assessmentPeriod.findFirst({ orderBy: { endsAt: "desc" } });
    const fileName = `${reportLabel(body.reportType).toLowerCase().replaceAll(" ", "-")}-${period?.code ?? "latest"}.csv`;
    const entry = await prisma.reportDownload.create({ data: { reportType: body.reportType, fileName, userId: user?.id, periodId: period?.code } });
    await prisma.auditEvent.create({ data: { userId: user?.id, action: "REPORT_GENERATED", entityType: "ReportDownload", entityId: entry.id, summary: `Generated ${reportLabel(body.reportType)}.`, details: { periodCode: period?.code ?? null } } });
    return jsonOk({ id: entry.id, fileName: entry.fileName, downloadUrl: `/api/v1/reports/${entry.id}/download`, downloadedAt: entry.downloadedAt }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export function reportLabel(type: "RESILIENCE_REPORT" | "PARAMETER_SUMMARY" | "TREND_REPORT") {
  return ({ RESILIENCE_REPORT: "Resilience Report", PARAMETER_SUMMARY: "Parameter Summary", TREND_REPORT: "ITRI Trend Report" } as const)[type];
}
