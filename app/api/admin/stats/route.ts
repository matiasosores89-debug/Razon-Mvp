import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

// Statistics depend on live database data and must never be prerendered by Vercel.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await AppointmentService.getAdminStats();
    const response = createSuccessResponse(stats, "Estadísticas obtenidas correctamente");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
