import { NextRequest } from "next/server";
import { ShopSettingsService } from "@/services/shop-settings.service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const settings = await ShopSettingsService.getSettings();
    return createSuccessResponse(settings, "Configuración de la barbería obtenida correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await ShopSettingsService.updateSettings(body);
    return createSuccessResponse(updated, "Configuración actualizada correctamente");
  } catch (error) {
    return handleApiError(error);
  }
}
