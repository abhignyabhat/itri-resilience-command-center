import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { remediationCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parameterId = url.searchParams.get("parameterId") ?? undefined;
    const subparameterId = url.searchParams.get("subparameterId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    if (status && !["OPEN", "IN_PROGRESS", "DONE"].includes(status)) throw new Error("VALIDATION:status must be OPEN, IN_PROGRESS, or DONE.");
    const items = await prisma.remediation.findMany({
      where: {
        ...(parameterId ? { subparameter: { parameterId } } : {}),
        ...(subparameterId ? { subparameterId } : {}),
        ...(status && ["OPEN", "IN_PROGRESS", "DONE"].includes(status) ? { status: status as "OPEN" | "IN_PROGRESS" | "DONE" } : {}),
      },
      include: { subparameter: { include: { parameter: true } } },
      orderBy: { createdAt: "desc" },
    });
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.createdAt.getTime() - a.createdAt.getTime());
    return jsonOk(items.map((item) => ({ id: item.id, parameterId: item.subparameter.parameter.code, parameter: item.subparameter.parameter.name, subparameterId: item.subparameter.code, subparameter: item.subparameter.name, priority: item.priority.toLowerCase(), status: item.status.toLowerCase(), title: item.title, remediation: item.description, dueAt: item.dueAt })));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = remediationCreateSchema.parse(await readJson(request));
    const subparameter = await prisma.subparameter.findFirst({ where: { code: body.subparameterId, parameter: { modelVersion: { status: "PUBLISHED" } } }, include: { parameter: true } });
    if (!subparameter) throw new Error("NOT_FOUND");
    const item = await prisma.remediation.create({ data: { subparameterId: subparameter.id, title: body.title, description: body.description, priority: body.priority, dueAt: body.dueAt ? new Date(body.dueAt) : null } });
    await prisma.auditEvent.create({ data: { action: "REMEDIATION_CREATED", entityType: "Remediation", entityId: item.id, summary: `Created remediation: ${item.title}.`, details: { parameter: subparameter.parameter.name, subparameter: subparameter.name } } });
    return jsonOk({ id: item.id, parameterId: subparameter.parameter.code, parameter: subparameter.parameter.name, subparameterId: subparameter.code, subparameter: subparameter.name, title: item.title, remediation: item.description, priority: item.priority.toLowerCase(), status: item.status.toLowerCase(), dueAt: item.dueAt }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
