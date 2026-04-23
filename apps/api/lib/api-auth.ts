import { NextRequest } from "next/server";
import { verifyToken, type TokenPayload } from "@/lib/jwt";

export type AuthResult =
  | { ok: true; user: TokenPayload }
  | { ok: false; status: 401 | 403; message: string };

export function extractBearer(req: NextRequest): AuthResult {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return { ok: false, status: 401, message: "Missing token" };

  try {
    const user = verifyToken(token);
    return { ok: true, user };
  } catch {
    return { ok: false, status: 401, message: "Invalid or expired token" };
  }
}

export function requireRole(
  req: NextRequest,
  role: "coach" | "client",
): AuthResult {
  const auth = extractBearer(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== role) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return auth;
}
