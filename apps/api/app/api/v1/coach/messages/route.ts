import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const clientIds = await prisma.coachClient
      .findMany({ where: { coachUserId: auth.user.sub, status: "active" }, select: { clientUserId: true } })
      .then((r) => r.map((x) => x.clientUserId));

    if (clientIds.length === 0) return ok([]);

    const comments = await prisma.sessionComment.findMany({
      where: { session: { clientUserId: { in: clientIds } } },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        author: { select: { id: true, displayName: true, role: true } },
        session: {
          select: {
            id: true,
            performedAt: true,
            clientUserId: true,
            workoutTemplate: { select: { title: true } },
            client: { select: { displayName: true, email: true } },
          },
        },
      },
    });

    return ok(
      comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        author: { id: c.author.id, name: c.author.displayName, role: c.author.role },
        session: {
          id: c.session.id,
          clientUserId: c.session.clientUserId,
          clientName: c.session.client.displayName ?? c.session.client.email,
          workoutTitle: c.session.workoutTemplate?.title ?? "Sesión libre",
          performedAt: c.session.performedAt,
        },
      })),
    );
  });
}
