import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await BarberService.getAll();
    return createSuccessResponse(data, "Barberos obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await BarberService.create(body);
    return createSuccessResponse(data, "Barbero creado correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
