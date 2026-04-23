import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = extractBearer(req);
  if (!auth.ok) return unauthorized(auth.message);

  const user = await prisma.user.findUnique({
    where: { id: auth.user.sub },
    select: { id: true, email: true, displayName: true, role: true, billingStatus: true },
  });
  if (!user) return unauthorized("User not found");

  return ok({
    id: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role,
    billingStatus: user.billingStatus,
  });
}
