import { NextRequest } from "next/server";
import { ServiceService } from "@/services/service.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await ServiceService.updateAdmin(params.id, await request.json());
    await recordAdminAction(request, { action: "UPDATE", entityType: "SERVICE", entityId: params.id, summary: `Servicio actualizado: ${data.title}` });
    return createSuccessResponse(data, "Servicio actualizado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
