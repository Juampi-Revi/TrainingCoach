import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const comments = await prisma.sessionComment.findMany({
      where: { session: { clientUserId: auth.user.sub } },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        author: { select: { id: true, displayName: true, role: true } },
        session: {
          select: {
            id: true,
            performedAt: true,
            workoutTemplate: { select: { title: true } },
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
          workoutTitle: c.session.workoutTemplate?.title ?? "Sesión libre",
          performedAt: c.session.performedAt,
        },
      })),
    );
  });
}
