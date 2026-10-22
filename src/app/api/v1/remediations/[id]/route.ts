import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { remediationUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const changes = remediationUpdateSchema.parse(await readJson(request));
    const item = await prisma.remediation.update({ where: { id }, data: { ...changes, dueAt: changes.dueAt === undefined ? undefined : changes.dueAt === null ? null : new Date(changes.dueAt) }, include: { subparameter: { include: { parameter: true } } } });
    await prisma.auditEvent.create({ data: { action: "REMEDIATION_UPDATED", entityType: "Remediation", entityId: item.id, summary: `Updated remediation: ${item.title}.`, details: changes } });
    return jsonOk({ id: item.id, parameter: item.subparameter.parameter.name, subparameter: item.subparameter.name, title: item.title, remediation: item.description, priority: item.priority.toLowerCase(), status: item.status.toLowerCase(), dueAt: item.dueAt });
  } catch (error) {
    return errorResponse(error);
  }
}
