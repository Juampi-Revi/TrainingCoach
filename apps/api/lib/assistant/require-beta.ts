import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, type AuthResult } from "@/lib/api-auth";
import { notFound, unauthorized } from "@/lib/api-response";
import { resolveAssistantBeta } from "./beta";

export type AssistantAuth = Extract<AuthResult, { ok: true }>;

export async function requireAssistantBeta(req: Request): Promise<AssistantAuth | Response> {
  const auth = requireRole(req as NextRequest, "client");
  if (!auth.ok) return unauthorized(auth.message);
  const user = await prisma.user.findUnique({
    where: { id: auth.user.sub },
    select: { email: true, assistantBeta: true },
  });
  if (!user) return unauthorized("User not found");
  if (!(await resolveAssistantBeta(user))) return notFound();
  return auth;
}
