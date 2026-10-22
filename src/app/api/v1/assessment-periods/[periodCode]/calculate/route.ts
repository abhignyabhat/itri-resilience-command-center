import { errorResponse, jsonOk } from "@/lib/api-response";
import { calculateAssessment } from "@/lib/assessment";

export async function POST(_request: Request, context: { params: Promise<{ periodCode: string }> }) {
  try {
    const { periodCode } = await context.params;
    return jsonOk(await calculateAssessment(periodCode));
  } catch (error) {
    return errorResponse(error);
  }
}
