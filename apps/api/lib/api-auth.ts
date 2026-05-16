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
  role: "coach" | "client" | "gym",
): AuthResult;
export function requireRole(
  req: NextRequest,
  roles: ("coach" | "client" | "gym")[],
): AuthResult;
export function requireRole(
  req: NextRequest,
  roleOrRoles: "coach" | "client" | "gym" | ("coach" | "client" | "gym")[],
): AuthResult {
  const auth = extractBearer(req);
  if (!auth.ok) return auth;
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  // "gym" has all permissions of "coach"
  if (allowed.includes("coach") && auth.user.role === "gym") return auth;
  if (!allowed.includes(auth.user.role as "coach" | "client" | "gym")) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return auth;
}
