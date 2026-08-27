import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await BarberService.getById(id);
    if (!data) {
      return handleApiError(new Error("Barbero no encontrado"));
    }
    return createSuccessResponse(data, "Barbero obtenido correctamente");
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
    const data = await BarberService.update(id, body);
    return createSuccessResponse(data, "Barbero actualizado correctamente");
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
    await BarberService.delete(id);
    return createSuccessResponse(null, "Barbero eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
