import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get("barberId");
    const date = searchParams.get("date");
    const duration = searchParams.get("duration");
    const serviceId = searchParams.get("serviceId") || undefined;

    if (!barberId || !date) {
      return handleApiError(new Error("Los parámetros barberId y date son requeridos"));
    }

    const durationMinutes = duration ? parseInt(duration, 10) : 30;
    const slots = await AppointmentService.getAvailableSlots(barberId, date, durationMinutes, serviceId);
    return createSuccessResponse(slots, "Espacios disponibles obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
