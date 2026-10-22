import { errorResponse, jsonOk } from "@/lib/api-response";
import { publishConfiguration } from "@/lib/configuration";

export async function POST() {
  try {
    return jsonOk(await publishConfiguration());
  } catch (error) {
    return errorResponse(error);
  }
}
