import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ data: { status: "ok", database: "connected" } });
  } catch {
    return Response.json({ data: { status: "degraded", database: "unavailable" } }, { status: 503 });
  }
}
