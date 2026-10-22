import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: { message } }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function errorResponse(error: unknown) {
  if (error instanceof SyntaxError) return jsonError("Request body must be valid JSON.");
  if (error instanceof ZodError) return jsonError(error.issues.map((issue) => issue.message).join(" "), 422);
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "P2025") return jsonError("The requested resource was not found.", 404);
    if (code === "P2002") return jsonError("A record with these unique values already exists.", 409);
    if (code === "P2003") return jsonError("This change conflicts with related records.", 409);
  }
  if (error instanceof Error && error.message === "NOT_FOUND") return jsonError("The requested resource was not found.", 404);
  if (error instanceof Error && error.message.startsWith("VALIDATION:")) return jsonError(error.message.slice(11), 422);
  console.error("API request failed", error);
  return jsonError("An unexpected server error occurred.", 500);
}

