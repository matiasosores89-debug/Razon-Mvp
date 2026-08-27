import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await BarberService.getBarbersWithStats();
    return createSuccessResponse(data, "Barberos obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
