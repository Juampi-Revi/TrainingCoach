import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return new Date(`${v}T00:00:00.000Z`);
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const today = new Date();
    const active = await prisma.healthGoal.findMany({
      where: {
        clientUserId: auth.user.sub,
        OR: [{ endDate: null }, { endDate: { gte: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) } }],
      },
      orderBy: { startDate: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        targetInt: true,
        targetNumber: true,
        unit: true,
        period: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    return ok({ goals: active });
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));

    const kind = typeof body.kind === "string" && body.kind.trim() ? body.kind.trim() : null;
    const unit = typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : null;
    const period = typeof body.period === "string" && body.period.trim() ? body.period.trim() : null;
    const startDate = parseDateOnly(body.startDate) ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    const endDate = parseDateOnly(body.endDate);

    const targetInt = typeof body.targetInt === "number" ? Math.trunc(body.targetInt) : typeof body.targetInt === "string" ? Math.trunc(Number(body.targetInt)) : null;
    const targetNumber = typeof body.targetNumber === "number" ? String(body.targetNumber) : typeof body.targetNumber === "string" ? body.targetNumber : null;

    if (!kind || !unit || !period) return err("kind/unit/period requeridos", 400);
    if (targetInt === null && (targetNumber === null || !targetNumber.trim())) return err("targetInt o targetNumber requerido", 400);

    const created = await prisma.healthGoal.create({
      data: {
        clientUserId: auth.user.sub,
        kind,
        unit,
        period,
        startDate,
        endDate,
        targetInt,
        targetNumber,
      },
      select: {
        id: true,
        kind: true,
        targetInt: true,
        targetNumber: true,
        unit: true,
        period: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    return ok(created, 201);
  });
}

