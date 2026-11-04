import { NextRequest } from "next/server";
import { requireRole, type AuthResult } from "@/lib/api-auth";
import { notFound, unauthorized } from "@/lib/api-response";
import { isAssistantBetaEmail } from "./beta";

export type AssistantAuth = Extract<AuthResult, { ok: true }>;

export function requireAssistantBeta(req: Request): AssistantAuth | Response {
  const auth = requireRole(req as NextRequest, "client");
  if (!auth.ok) return unauthorized(auth.message);
  if (!isAssistantBetaEmail(auth.user.email)) return notFound();
  return auth;
}
