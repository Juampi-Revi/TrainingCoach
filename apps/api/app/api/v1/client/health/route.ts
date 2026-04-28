import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

function clampInt(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const sp = req.nextUrl.searchParams;
    const take = Math.min(60, Math.max(1, parseInt(sp.get("take") ?? "14", 10) || 14));

    const entries = await prisma.dailyHealthEntry.findMany({
      where: { clientUserId: auth.user.sub },
      orderBy: { day: "desc" },
      take,
      select: {
        id: true,
        day: true,
        steps: true,
        sleepMinutes: true,
        sportType: true,
        sportMinutes: true,
        notes: true,
      },
    });

    const days = entries.map((e) => e.day);
    const coachNotes = days.length
      ? await prisma.healthCoachNote.findMany({
          where: { clientUserId: auth.user.sub, day: { in: days } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            day: true,
            text: true,
            createdAt: true,
            coach: { select: { id: true, displayName: true, email: true } },
          },
        })
      : [];

    const notesByDay = new Map<string, typeof coachNotes>();
    for (const n of coachNotes) {
      const k = n.day.toISOString().slice(0, 10);
      const prev = notesByDay.get(k) ?? [];
      prev.push(n);
      notesByDay.set(k, prev);
    }

    return ok({
      entries: entries.map((e) => {
        const dayKey = e.day.toISOString().slice(0, 10);
        const notes = notesByDay.get(dayKey) ?? [];
        return {
          id: e.id,
          day: e.day,
          steps: e.steps,
          sleepMinutes: e.sleepMinutes,
          sportType: e.sportType,
          sportMinutes: e.sportMinutes,
          notes: e.notes,
          coachNotes: notes.map((n) => ({
            id: n.id,
            day: n.day,
            text: n.text,
            createdAt: n.createdAt,
            coach: { id: n.coach.id, name: n.coach.displayName ?? n.coach.email },
          })),
        };
      }),
    });
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const dayIso = typeof body.day === "string" ? body.day : new Date().toISOString().slice(0, 10);
    const day = new Date(dayIso);

    const steps = clampInt(body.steps, 0, 250_000);
    const sleepMinutes = clampInt(
      body.sleepMinutes ?? (body.sleepHours != null ? Number(body.sleepHours) * 60 : null),
      0,
      24 * 60,
    );
    const sportMinutes = clampInt(body.sportMinutes, 0, 24 * 60);
    const sportType = typeof body.sportType === "string" && body.sportType.trim() ? body.sportType.trim() : null;
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    const saved = await prisma.dailyHealthEntry.upsert({
      where: { clientUserId_day: { clientUserId: auth.user.sub, day } },
      create: {
        clientUserId: auth.user.sub,
        day,
        steps,
        sleepMinutes,
        sportType,
        sportMinutes,
        notes,
      },
      update: { steps, sleepMinutes, sportType, sportMinutes, notes },
      select: { id: true, day: true, steps: true, sleepMinutes: true, sportType: true, sportMinutes: true, notes: true },
    });

    return ok(saved, 201);
  });
}

