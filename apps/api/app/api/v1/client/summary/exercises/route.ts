import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const sp = req.nextUrl.searchParams;
    const days = Math.min(365, Math.max(1, parseInt(sp.get("days") ?? "180", 10) || 180));

    const end = startOfDayUTC(new Date());
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const endExclusive = new Date(end.getTime() + 86_400_000);

    const rows = await prisma.workoutSessionExercise.findMany({
      where: {
        workoutSession: { clientUserId: auth.user.sub, status: "completed", performedAt: { gte: start, lt: endExclusive } },
      },
      select: {
        performedExercise: { select: { id: true, name: true, primaryMuscle: true } },
      },
      take: 5_000,
    });

    const byId = new Map<string, { id: string; name: string; primaryMuscle: string | null }>();
    for (const r of rows) {
      byId.set(r.performedExercise.id, {
        id: r.performedExercise.id,
        name: r.performedExercise.name,
        primaryMuscle: r.performedExercise.primaryMuscle,
      });
    }

    const items = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));

    return ok({
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days },
      items,
    });
  });
}
