import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { forbidden, ok, unauthorized, withHandler } from "@/lib/api-response";

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

    const sp = req.nextUrl.searchParams;
    const take = Math.min(60, Math.max(1, parseInt(sp.get("take") ?? "30", 10) || 30));

    const items = await prisma.foodLogEntry.findMany({
      where: { clientUserId },
      orderBy: { loggedAt: "desc" },
      take,
      select: {
        id: true,
        loggedAt: true,
        text: true,
        photoUrl: true,
        source: true,
        coachComments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            text: true,
            createdAt: true,
            coach: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    return ok({
      items: items.map((i) => ({
        id: i.id,
        loggedAt: i.loggedAt,
        text: i.text,
        photoUrl: i.photoUrl,
        source: i.source,
        coachComments: i.coachComments.map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: c.createdAt,
          coach: { id: c.coach.id, name: c.coach.displayName },
        })),
      })),
    });
  });
}
