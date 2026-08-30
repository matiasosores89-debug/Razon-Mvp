import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

    const data = await BarberService.getBarberDetails(id, month, year);
    return createSuccessResponse(data, "Detalles del barbero obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await BarberService.update(params.id, await req.json());
    await recordAdminAction(req, { action: "UPDATE", entityType: "BARBER", entityId: params.id, summary: `Barbero actualizado: ${data.name}` });
    return createSuccessResponse(data, "Barbero actualizado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await BarberService.delete(params.id);
    await recordAdminAction(req, { action: "DELETE", entityType: "BARBER", entityId: params.id, summary: "Barbero eliminado" });
    return createSuccessResponse(null, "Barbero eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
