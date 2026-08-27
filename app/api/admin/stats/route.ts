import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const stats = await AppointmentService.getAdminStats();
    return createSuccessResponse(stats, "Estadísticas obtenidas correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
