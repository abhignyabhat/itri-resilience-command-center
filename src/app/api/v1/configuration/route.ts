import { errorResponse, jsonOk, readJson } from "@/lib/api-response";
import { configurationDto, getCurrentConfiguration, saveConfigurationDraft } from "@/lib/configuration";
import { configurationSchema } from "@/lib/validation";

export async function GET() {
  try {
    return jsonOk(configurationDto(await getCurrentConfiguration()));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = configurationSchema.parse(await readJson(request));
    return jsonOk(configurationDto(await saveConfigurationDraft(payload) as Awaited<ReturnType<typeof getCurrentConfiguration>>));
  } catch (error) {
    return errorResponse(error);
  }
}
