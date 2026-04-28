import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string }> };

function clampInt(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

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
    const take = Math.min(90, Math.max(1, parseInt(sp.get("take") ?? "30", 10) || 30));

    const [entries, metrics, notes] = await Promise.all([
      prisma.dailyHealthEntry.findMany({
        where: { clientUserId },
        orderBy: { day: "desc" },
        take,
        select: { id: true, day: true, steps: true, sleepMinutes: true, sportType: true, sportMinutes: true, notes: true },
      }),
      prisma.bodyMetricEntry.findMany({
        where: { clientUserId },
        orderBy: { measuredAt: "desc" },
        take: 30,
        select: {
          id: true,
          measuredAt: true,
          weightKg: true,
          waistCm: true,
          chestCm: true,
          hipsCm: true,
          armCm: true,
          thighCm: true,
          notes: true,
        },
      }),
      prisma.healthCoachNote.findMany({
        where: { clientUserId },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          day: true,
          text: true,
          createdAt: true,
          coach: { select: { id: true, displayName: true, email: true } },
        },
      }),
    ]);

    return ok({
      entries,
      metrics: metrics.map((m) => ({
        id: m.id,
        measuredAt: m.measuredAt,
        weightKg: m.weightKg ? String(m.weightKg) : null,
        waistCm: m.waistCm ? String(m.waistCm) : null,
        chestCm: m.chestCm ? String(m.chestCm) : null,
        hipsCm: m.hipsCm ? String(m.hipsCm) : null,
        armCm: m.armCm ? String(m.armCm) : null,
        thighCm: m.thighCm ? String(m.thighCm) : null,
        notes: m.notes,
      })),
      coachNotes: notes.map((n) => ({
        id: n.id,
        day: n.day,
        text: n.text,
        createdAt: n.createdAt,
        coach: { id: n.coach.id, name: n.coach.displayName ?? n.coach.email },
      })),
    });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const body = await req.json().catch(() => ({}));
    const dayIso = typeof body.day === "string" ? body.day : new Date().toISOString().slice(0, 10);
    const day = new Date(dayIso);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return ok({ error: "Missing text" }, 400);

    const created = await prisma.healthCoachNote.create({
      data: { coachUserId: auth.user.sub, clientUserId, day, text },
      select: { id: true, day: true, text: true, createdAt: true },
    });

    return ok(created, 201);
  });
}

