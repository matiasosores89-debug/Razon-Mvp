import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    if (body.status && Object.keys(body).length === 1) {
      const data = await AppointmentService.updateStatus(id, body.status);
      await recordAdminAction(req, { action: "STATUS_CHANGE", entityType: "APPOINTMENT", entityId: id, summary: `Estado del turno cambiado a ${body.status}` });
      return createSuccessResponse(data, "Estado actualizado correctamente");
    }

    const data = await AppointmentService.update(id, body);
    await recordAdminAction(req, { action: "UPDATE", entityType: "APPOINTMENT", entityId: id, summary: "Turno editado" });
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
    await recordAdminAction(req, { action: "DELETE", entityType: "APPOINTMENT", entityId: id, summary: "Turno eliminado" });
    return createSuccessResponse({ success: true }, "Turno eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
