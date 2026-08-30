import { NextRequest } from "next/server";
import { ServiceService } from "@/services/service.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return createSuccessResponse(await ServiceService.getAdminCatalog(), "Servicios obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await ServiceService.createAdmin(await request.json());
    await recordAdminAction(request, { action: "CREATE", entityType: "SERVICE", entityId: data.id, summary: `Servicio creado: ${data.title}` });
    return createSuccessResponse(data, "Servicio creado correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
