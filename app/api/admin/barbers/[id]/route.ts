import { NextRequest } from "next/server";
import { BarberService } from "@/services/barber.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

    const data = await BarberService.getBarberDetails(id, month, year);
    return createSuccessResponse(data, "Detalles del barbero obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
