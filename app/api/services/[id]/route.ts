import { NextRequest } from "next/server";
import { ServiceService } from "@/services/service.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await ServiceService.getById(id);
    if (!data) {
      return handleApiError(new Error("Servicio no encontrado"));
    }
    return createSuccessResponse(data, "Servicio obtenido correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = await ServiceService.update(id, body);
    return createSuccessResponse(data, "Servicio actualizado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await ServiceService.delete(id);
    return createSuccessResponse(null, "Servicio eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
