import { NextRequest } from "next/server";
import { CustomerService } from "@/services/customer.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await CustomerService.getById(id);
    if (!data) {
      return handleApiError(new Error("Cliente no encontrado"));
    }
    return createSuccessResponse(data, "Cliente obtenido correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = await CustomerService.update(id, body);
    return createSuccessResponse(data, "Cliente actualizado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await CustomerService.delete(id);
    return createSuccessResponse(null, "Cliente eliminado correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
