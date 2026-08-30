import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/app-error";

export type ApiError = {
  message: string;
  details?: any;
  code?: string;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
};

/**
 * Creates a standardized success response.
 */
export function createSuccessResponse<T>(data: T, message: string = "Operation successful", status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Creates a standardized error response.
 */
export function createErrorResponse(message: string, status = 500, details?: any, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details,
        code,
      },
    },
    { status }
  );
}

/**
 * Global error handler to map different error types to standardized API responses.
 */
export function handleApiError(error: unknown) {
  console.error("[API_ERROR]:", error);

  if (error instanceof AppError) {
    return createErrorResponse(error.message, error.status, error.details, error.code);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      "Revisá los datos ingresados e intentá nuevamente.",
      400,
      error.flatten().fieldErrors,
      "VALIDATION_ERROR"
    );
  }

  // Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: An operation failed because it depends on one or more records that were not found.
    if (error.code === "P2025") {
      return createErrorResponse("No encontramos el registro solicitado.", 404, null, "NOT_FOUND");
    }
    if (error.code === "P2002") {
      return createErrorResponse("Ese dato ya está registrado.", 409, null, "DUPLICATE_RECORD");
    }
    return createErrorResponse(
      "No pudimos completar la operación en este momento.",
      500,
      null,
      "DATABASE_ERROR"
    );
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError && error.message.includes("Appointment_no_active_overlap")) {
    return createErrorResponse("Ese horario acaba de ocuparse. Elegí otro para continuar.", 409, null, "SLOT_UNAVAILABLE");
  }

  // Generic JS errors
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500, null, "INTERNAL_SERVER_ERROR");
  }

  // Unknown errors
  return createErrorResponse("Ocurrió un error inesperado. Intentá nuevamente.", 500, null, "UNKNOWN_ERROR");
}
