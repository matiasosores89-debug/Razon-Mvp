import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await AppointmentService.getById(id);
    if (!data) {
      return handleApiError(new Error("Cita no encontrada"));
    }
    return createSuccessResponse(data, "Cita obtenida correctamente");
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

    if (body.status) {
      const data = await AppointmentService.updateStatus(id, body.status);
      return createSuccessResponse(data, "Estado de la cita actualizado correctamente");
    }

    return handleApiError(new Error("No se proporcionó un estado válido para actualizar"));
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
    await AppointmentService.updateStatus(id, "CANCELLED");
    return createSuccessResponse(null, "Cita cancelada correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
