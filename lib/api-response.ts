import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

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

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      "Validation failed",
      400,
      error.flatten().fieldErrors,
      "VALIDATION_ERROR"
    );
  }

  // Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: An operation failed because it depends on one or more records that were not found.
    if (error.code === "P2025") {
      return createErrorResponse("The requested record was not found", 404, null, "NOT_FOUND");
    }
    return createErrorResponse(
      `Database error: ${error.message}`,
      500,
      null,
      "DATABASE_ERROR"
    );
  }

  // Generic JS errors
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500, null, "INTERNAL_SERVER_ERROR");
  }

  // Unknown errors
  return createErrorResponse("An unexpected error occurred", 500, null, "UNKNOWN_ERROR");
}
