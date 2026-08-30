import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { recordAdminAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      barberId: searchParams.get("barberId") || undefined,
      date: searchParams.get("date") || undefined,
    };

    const data = await AppointmentService.getAll(filters);
    return createSuccessResponse(data, "Turnos obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await AppointmentService.create(body);
    await recordAdminAction(req, { action: "CREATE", entityType: "APPOINTMENT", entityId: data.id, summary: "Turno creado desde administración" });
    return createSuccessResponse(data, "Turno creado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
