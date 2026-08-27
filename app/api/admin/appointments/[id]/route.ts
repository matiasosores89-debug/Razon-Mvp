import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    if (body.status && Object.keys(body).length === 1) {
      const data = await AppointmentService.updateStatus(id, body.status);
      return createSuccessResponse(data, "Estado actualizado correctamente");
    }

    const data = await AppointmentService.update(id, body);
    return createSuccessResponse(data, "Turno actualizado correctamente");
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
    await AppointmentService.delete(id);
    return createSuccessResponse({ success: true }, "Turno eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
