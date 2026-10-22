import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { assessmentPeriodSchema } from "@/lib/validation";

export async function GET() {
  try {
    const periods = await prisma.assessmentPeriod.findMany({ orderBy: { startsAt: "desc" }, include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } } });
    return jsonOk(periods.map((period) => ({ id: period.id, code: period.code, label: period.label, startsAt: period.startsAt, endsAt: period.endsAt, status: period.status, latestSnapshot: period.snapshots[0] ? { score: period.snapshots[0].score == null ? null : Number(period.snapshots[0].score), provisionalEstimate: period.snapshots[0].provisionalEstimate == null ? null : Number(period.snapshots[0].provisionalEstimate), isProvisional: period.snapshots[0].isProvisional, scoredCount: period.snapshots[0].scoredCount, requiredCount: period.snapshots[0].requiredCount } : null })));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assessmentPeriodSchema.parse(await readJson(request));
    const user = body.userId ? await prisma.user.findUnique({ where: { id: body.userId } }) : null;
    if (body.userId && !user) throw new Error("VALIDATION:Unknown userId.");
    const period = await prisma.assessmentPeriod.create({ data: { code: body.code, label: body.label, startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt) } });
    await prisma.auditEvent.create({ data: { userId: user?.id, action: "ASSESSMENT_PERIOD_CREATED", entityType: "AssessmentPeriod", entityId: period.id, summary: `Created assessment period ${period.label}.` } });
    return jsonOk({ id: period.id, code: period.code, label: period.label, startsAt: period.startsAt, endsAt: period.endsAt, status: period.status }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
