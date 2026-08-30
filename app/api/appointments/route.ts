import { NextRequest } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { enforceRateLimit, getClientIp, verifyTurnstile } from "@/lib/request-security";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      barberId: searchParams.get("barberId") || undefined,
      date: searchParams.get("date") || undefined,
    };

    const data = await AppointmentService.getAll(filters);
    return createSuccessResponse(data, "Citas obtenidas correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = getClientIp(req.headers);
    await enforceRateLimit({ scope: "public-booking", identifier: ip, limit: 6, windowSeconds: 10 * 60 });
    await verifyTurnstile(body.turnstileToken, ip, "book_appointment");
    delete body.turnstileToken;
    const data = await AppointmentService.create(body);
    return createSuccessResponse(data, "Cita creada correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
