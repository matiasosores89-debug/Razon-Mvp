import { NextRequest } from "next/server";
import { CustomerService } from "@/services/customer.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const data = await CustomerService.getAll();
    return createSuccessResponse(data, "Clientes obtenidos correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await CustomerService.create(body);
    return createSuccessResponse(data, "Cliente creado correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
