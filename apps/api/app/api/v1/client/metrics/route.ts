import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";

const METRIC_FIELDS = ["weightKg", "waistCm", "chestCm", "hipsCm", "armCm", "thighCm"] as const;

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return v ? String(v) : null;
}

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
        shareWithCoach: true,
      },
    });

    return ok(
      metrics.map((m) => ({
        id: m.id,
        measuredAt: m.measuredAt,
        weightKg: toStr(m.weightKg),
        waistCm: toStr(m.waistCm),
        chestCm: toStr(m.chestCm),
        hipsCm: toStr(m.hipsCm),
        armCm: toStr(m.armCm),
        thighCm: toStr(m.thighCm),
        notes: m.notes,
        shareWithCoach: m.shareWithCoach,
      })),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { measuredAt, notes } = body;
    const shareWithCoach = typeof body.shareWithCoach === "boolean" ? body.shareWithCoach : true;

    // At least one numeric field required
    const hasValue = METRIC_FIELDS.some((f) => body[f] != null);
    if (!hasValue) return err("Al menos un campo de medición requerido", 400);

    const entry = await prisma.bodyMetricEntry.create({
      data: {
        clientUserId: auth.user.sub,
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        weightKg: body.weightKg ?? null,
        waistCm: body.waistCm ?? null,
        chestCm: body.chestCm ?? null,
        hipsCm: body.hipsCm ?? null,
        armCm: body.armCm ?? null,
        thighCm: body.thighCm ?? null,
        notes: notes ?? null,
        shareWithCoach,
      },
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
        shareWithCoach: true,
      },
    });

    return ok({
      id: entry.id,
      measuredAt: entry.measuredAt,
      weightKg: toStr(entry.weightKg),
      waistCm: toStr(entry.waistCm),
      chestCm: toStr(entry.chestCm),
      hipsCm: toStr(entry.hipsCm),
      armCm: toStr(entry.armCm),
      thighCm: toStr(entry.thighCm),
      notes: entry.notes,
      shareWithCoach: entry.shareWithCoach,
    }, 201);
  });
}

// Bulk-update shareWithCoach for all metric entries
export async function PATCH(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    if (typeof body.shareWithCoach !== "boolean") return err("shareWithCoach (boolean) requerido", 400);

    await prisma.bodyMetricEntry.updateMany({
      where: { clientUserId: auth.user.sub },
      data: { shareWithCoach: body.shareWithCoach },
    });

    return ok({ shareWithCoach: body.shareWithCoach });
  });
}
