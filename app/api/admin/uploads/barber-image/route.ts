import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-response";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function hasValidSignature(buffer: Buffer, type: string) {
  if (type === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return createErrorResponse("Seleccioná una imagen para continuar.", 400);
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) return createErrorResponse("Formato no permitido. Usá JPG, PNG o WebP.", 400);
    if (file.size === 0) return createErrorResponse("La imagen está vacía.", 400);
    if (file.size > MAX_FILE_SIZE) return createErrorResponse("La imagen no puede superar los 5 MB.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(buffer, file.type)) return createErrorResponse("El archivo no contiene una imagen válida.", 400);

    const uploadsDirectory = path.join(process.cwd(), "public", "uploads", "barbers");
    await mkdir(uploadsDirectory, { recursive: true });
    const fileName = `${randomUUID()}.${extension}`;
    await writeFile(path.join(uploadsDirectory, fileName), buffer);

    return createSuccessResponse({ url: `/uploads/barbers/${fileName}` }, "Imagen subida correctamente", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
