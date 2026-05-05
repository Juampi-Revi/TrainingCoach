import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

// GET - Obtener entradas de salud en un rango de fechas
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return err("startDate y endDate requeridos", 400);
    }

    const entries = await prisma.dailyHealthEntry.findMany({
      where: {
        clientUserId: auth.user.sub,
        day: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        day: true,
        steps: true,
        sleepMinutes: true,
      },
      orderBy: { day: "asc" },
    });

    return ok({ entries });
  });
}

// POST - Crear o actualizar entrada de salud del día
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { day, steps, sleepMinutes } = body;

    if (!day) {
      return err("day es requerido", 400);
    }

    // Buscar si ya existe una entrada para este día
    const existing = await prisma.dailyHealthEntry.findFirst({
      where: {
        clientUserId: auth.user.sub,
        day: new Date(day),
      },
    });

    if (existing) {
      // Actualizar entrada existente
      const updated = await prisma.dailyHealthEntry.update({
        where: { id: existing.id },
        data: {
          steps: steps !== undefined ? steps : existing.steps,
          sleepMinutes: sleepMinutes !== undefined ? sleepMinutes : existing.sleepMinutes,
        },
      });
      return ok({ entry: updated, created: false });
    } else {
      // Crear nueva entrada
      const created = await prisma.dailyHealthEntry.create({
        data: {
          clientUserId: auth.user.sub,
          day: new Date(day),
          steps: steps ?? null,
          sleepMinutes: sleepMinutes ?? null,
        },
      });
      return ok({ entry: created, created: true });
    }
  });
}
