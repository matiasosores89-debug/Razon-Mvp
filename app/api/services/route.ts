import { NextRequest } from "next/server";
import { ServiceService } from "@/services/service.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const barberId = new URL(req.url).searchParams.get("barberId") || undefined;
    const data = await ServiceService.getAll(barberId);
    return createSuccessResponse(data, "Servicios obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await ServiceService.create(body);
    return createSuccessResponse(data, "Servicio creado correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
