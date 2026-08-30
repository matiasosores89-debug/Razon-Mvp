import { NextRequest } from "next/server";
import { AvailabilityService } from "@/services/availability.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return createSuccessResponse(await AvailabilityService.getConfig(), "Disponibilidad obtenida correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await AvailabilityService.saveConfig(await request.json());
    await recordAdminAction(request, { action: "UPDATE", entityType: "AVAILABILITY", summary: "Configuración de disponibilidad actualizada" });
    return createSuccessResponse(data, "Disponibilidad actualizada correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
