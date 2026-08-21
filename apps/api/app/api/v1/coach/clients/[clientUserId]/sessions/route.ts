import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string }> };

async function verifyAccess(coachUserId: string, clientUserId: string) {
  const rel = await prisma.coachClient.findFirst({
    where: { coachUserId, clientUserId, status: "active" },
    select: { id: true },
  });
  return !!rel;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const sp = req.nextUrl.searchParams;
    const cursor = sp.get("cursor") ?? undefined;
    const status = sp.get("status") ?? undefined;
    const take = Math.min(50, Math.max(1, parseInt(sp.get("take") ?? "20", 10) || 20));

    if (status && !["completed", "partial", "in_progress", "discarded"].includes(status)) {
      return err("status inválido", 400);
    }

    const where: Record<string, unknown> = { clientUserId };
    if (status) where.status = status;
    else where.status = { not: "discarded" };

    const sessions = await prisma.workoutSession.findMany({
      where,
      orderBy: { performedAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        performedAt: true,
        completedAt: true,
        energyRating: true,
        sessionNotes: true,
        workoutTemplate: { select: { id: true, title: true } },
        exercises: {
          select: {
            sets: { select: { reps: true, weight: true, rpe: true } },
          },
        },
      },
    });

    const hasMore = sessions.length > take;
    const items = sessions.slice(0, take);

    const sessionsWithStats = items.map((s) => {
      const allSets = s.exercises.flatMap((e) => e.sets);
      const totalVolume = allSets.reduce((acc, set) => {
        return acc + (set.reps ?? 0) * parseFloat(String(set.weight ?? 0));
      }, 0);
      return {
        id: s.id,
        status: s.status,
        performedAt: s.performedAt,
        completedAt: s.completedAt,
        energyRating: s.energyRating,
        sessionNotes: s.sessionNotes,
        workoutTemplate: s.workoutTemplate,
        totalVolumeKg: Math.round(totalVolume),
        setsCount: allSets.length,
      };
    });

    return ok({
      sessions: sessionsWithStats,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  });
}
