import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const data = await BarberService.getBarbersWithStats();
    return createSuccessResponse(data, "Barberos obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await BarberService.create(await req.json());
    await recordAdminAction(req, { action: "CREATE", entityType: "BARBER", entityId: data.id, summary: `Barbero agregado: ${data.name}` });
    return createSuccessResponse(data, "Barbero creado correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
