import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, ...(code && { code }) }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return err(message, 401);
}

export function forbidden(message = "Forbidden") {
  return err(message, 403);
}

export function notFound(message = "Not found") {
  return err(message, 404);
}

export function validationError(zodError: ZodError) {
  // Zod v4 uses .issues instead of .errors
  const formattedErrors = zodError.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return NextResponse.json(
    { ok: false, error: "Datos inválidos", details: formattedErrors },
    { status: 422 }
  );
}

export async function withHandler(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    console.error("[API Error]", e);
    return err(
      process.env.NODE_ENV === "development" ? (e instanceof Error ? e.message : String(e)) : "Error interno del servidor",
      500,
    );
  }
}

/**
 * Validates request body against a Zod schema
 * Returns parsed data or throws a formatted error
 */
export async function validateBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  const body = await request.json();
  const result = schema.safeParse(body);
  
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  return result.data;
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(url: URL, schema: z.ZodSchema<T>): T {
  const params: Record<string, string | string[]> = {};
  
  url.searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing) {
      params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      params[key] = value;
    }
  });
  
  const result = schema.safeParse(params);
  
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  return result.data;
}

/**
 * Validates a UUID parameter
 */
export function validateUUID(param: string | undefined | null, name: string): string {
  if (!param) {
    throw new Error(`${name} es requerido`);
  }
  
  const schema = z.string().uuid(`${name} debe ser un UUID válido`);
  const result = schema.safeParse(param);
  
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  return result.data;
}

export class ValidationError extends Error {
  constructor(public readonly zodError: ZodError) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

/**
 * Enhanced withHandler that catches ValidationError and returns 422
 */
export async function withValidatedHandler(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ValidationError) {
      return validationError(e.zodError);
    }
    
    console.error("[API Error]", e);
    return err(
      process.env.NODE_ENV === "development" ? (e instanceof Error ? e.message : String(e)) : "Error interno del servidor",
      500,
    );
  }
}
