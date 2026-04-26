import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const metrics = await prisma.bodyMetricEntry.findMany({
      where: { clientUserId: auth.user.sub },
      orderBy: { measuredAt: "desc" },
      take: 90,
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
    });

    return ok(
      metrics.map((m) => ({
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
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { measuredAt, weightKg, waistCm, chestCm, hipsCm, armCm, thighCm, notes } = body;

    const entry = await prisma.bodyMetricEntry.create({
      data: {
        clientUserId: auth.user.sub,
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        weightKg: weightKg ?? null,
        waistCm: waistCm ?? null,
        chestCm: chestCm ?? null,
        hipsCm: hipsCm ?? null,
        armCm: armCm ?? null,
        thighCm: thighCm ?? null,
        notes: notes ?? null,
      },
      select: { id: true, measuredAt: true, weightKg: true },
    });

    return ok({ id: entry.id, measuredAt: entry.measuredAt, weightKg: entry.weightKg ? String(entry.weightKg) : null }, 201);
  });
}
