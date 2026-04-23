import { NextResponse } from "next/server";

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
