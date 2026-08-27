import { NextRequest } from "next/server";
import { CustomerService } from "@/services/customer.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await CustomerService.getAllWithStats();
    return createSuccessResponse(data, "Clientes obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
