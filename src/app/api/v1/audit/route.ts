import { errorResponse, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const where = { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } };
    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({ where, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return jsonOk({ items: events.map((event, index) => ({ id: event.id, srNo: (page - 1) * pageSize + index + 1, user: event.user?.name ?? "System", parameter: typeof event.details === "object" && event.details !== null && "parameter" in event.details ? event.details.parameter : event.entityType, subparameter: typeof event.details === "object" && event.details !== null && "subparameter" in event.details ? event.details.subparameter : "—", change: event.summary, action: event.action, createdAt: event.createdAt })), pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
  } catch (error) {
    return errorResponse(error);
  }
}
