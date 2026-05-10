import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, withHandler } from "@/lib/api-response";
import { getProgressDashboard } from "@/lib/training/analytics.service";

type Ctx = { params: Promise<{ clientUserId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const dashboard = await getProgressDashboard(clientUserId);
    return ok(dashboard);
  });
}

