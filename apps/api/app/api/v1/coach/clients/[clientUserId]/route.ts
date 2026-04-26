import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, err, withHandler } from "@/lib/api-response";

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

    const [client, sessions, metrics] = await Promise.all([
      prisma.user.findUnique({
        where: { id: clientUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
          planAssignments: {
            where: { OR: [{ status: "active" }, { status: "paused" }] },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              plan: {
                select: {
                  id: true,
                  title: true,
                  weeksCount: true,
                  periodDays: true,
                  weeks: { select: { weekNumber: true }, orderBy: { weekNumber: "asc" } },
                },
              },
            },
          },
        },
      }),
      prisma.workoutSession.findMany({
        where: { clientUserId, status: { not: "discarded" } },
        orderBy: { performedAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          performedAt: true,
          energyRating: true,
          sessionNotes: true,
          workoutTemplate: { select: { id: true, title: true } },
          exercises: {
            select: {
              sets: { select: { reps: true, weight: true, rpe: true } },
            },
          },
        },
      }),
      prisma.bodyMetricEntry.findMany({
        where: { clientUserId },
        orderBy: { measuredAt: "desc" },
        take: 30,
        select: { measuredAt: true, weightKg: true },
      }),
    ]);

    if (!client) return notFound("Client not found");

    const sessionsWithStats = sessions.map((s) => {
      const allSets = s.exercises.flatMap((e) => e.sets);
      const totalVolume = allSets.reduce((acc, set) => {
        return acc + (set.reps ?? 0) * parseFloat(String(set.weight ?? 0));
      }, 0);
      const avgRpe =
        allSets.filter((s) => s.rpe).length > 0
          ? allSets.reduce((acc, s) => acc + parseFloat(String(s.rpe ?? 0)), 0) /
            allSets.filter((s) => s.rpe).length
          : null;
      return {
        id: s.id,
        status: s.status,
        performedAt: s.performedAt,
        energyRating: s.energyRating,
        sessionNotes: s.sessionNotes,
        workoutTemplate: s.workoutTemplate,
        totalVolumeKg: Math.round(totalVolume),
        avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
        setsCount: allSets.length,
      };
    });

    return ok({
      client: {
        id: client.id,
        email: client.email,
        name: client.displayName,
        assignment: client.planAssignments[0] ?? null,
      },
      recentSessions: sessionsWithStats,
      weightHistory: metrics.map((m) => ({
        measuredAt: m.measuredAt,
        weightKg: m.weightKg ? String(m.weightKg) : null,
      })),
    });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const { planStatus } = await req.json().catch(() => ({}));
    if (!planStatus || !["paused", "finished"].includes(planStatus))
      return err("planStatus debe ser 'paused' o 'finished'", 400);

    const updated = await prisma.planAssignment.updateMany({
      where: { clientUserId, status: "active" },
      data: { status: planStatus },
    });

    return ok({ updated: updated.count });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { planId, startDate } = body;
    if (!planId) return err("planId requerido", 400);

    // Verify plan belongs to this coach
    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: auth.user.sub },
      select: { id: true, title: true, weeksCount: true },
    });
    if (!plan) return notFound("Plan no encontrado");

    // Deactivate any existing active assignment
    await prisma.planAssignment.updateMany({
      where: { clientUserId, status: "active" },
      data: { status: "finished" },
    });

    const assignment = await prisma.planAssignment.create({
      data: {
        planId,
        clientUserId,
        status: "active",
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    return ok({ id: assignment.id, planId, plan, status: "active", startDate: assignment.startDate }, 201);
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;

    const updated = await prisma.coachClient.updateMany({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      data: { status: "inactive" },
    });

    if (updated.count === 0) return notFound("Relación no encontrada");
    return ok({ ok: true });
  });
}
