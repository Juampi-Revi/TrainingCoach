import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err } from "@/lib/api-response";

type Ctx = { params: Promise<{ sessionId: string; wseId: string; setNumber: string }> };

function parseOptionalInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseOptionalDecimal(v: unknown): Prisma.Decimal | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return new Prisma.Decimal(String(v));
}

async function resolveExercise(sessionId: string, wseId: string, clientUserId: string) {
  return prisma.workoutSessionExercise.findFirst({
    where: {
      id: wseId,
      workoutSessionId: sessionId,
      workoutSession: { clientUserId, status: "in_progress" },
    },
    select: { id: true },
  });
}

// PUT /…/sets/:setNumber — upsert
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { sessionId, wseId, setNumber: setNumberStr } = await params;
  const setNumber = parseInt(setNumberStr);
  if (!Number.isFinite(setNumber)) return err("Invalid setNumber", 400);

  const se = await resolveExercise(sessionId, wseId, auth.user.sub);
  if (!se) return notFound("Exercise not found or session not in progress");

  const body = await req.json().catch(() => ({}));
  const { reps, weight, rpe, rir, notes } = body;

  const result = await prisma.workoutSet.upsert({
    where: { workoutSessionExerciseId_setNumber: { workoutSessionExerciseId: se.id, setNumber } },
    update: {
      reps: parseOptionalInt(reps),
      weight: parseOptionalDecimal(weight),
      rpe: parseOptionalDecimal(rpe),
      rir: parseOptionalDecimal(rir),
      notes: notes?.trim() || null,
    },
    create: {
      workoutSessionExerciseId: se.id,
      setNumber,
      reps: parseOptionalInt(reps),
      weight: parseOptionalDecimal(weight),
      rpe: parseOptionalDecimal(rpe),
      rir: parseOptionalDecimal(rir),
      notes: notes?.trim() || null,
    },
    select: { id: true, setNumber: true, reps: true, weight: true, rpe: true, rir: true, notes: true },
  });

  return ok({
    id: result.id,
    setNumber: result.setNumber,
    reps: result.reps,
    weight: result.weight ? String(result.weight) : null,
    rpe: result.rpe ? String(result.rpe) : null,
    rir: result.rir ? String(result.rir) : null,
    notes: result.notes,
  });
}

// DELETE /…/sets/:setNumber
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { sessionId, wseId, setNumber: setNumberStr } = await params;
  const setNumber = parseInt(setNumberStr);

  const se = await resolveExercise(sessionId, wseId, auth.user.sub);
  if (!se) return notFound("Exercise not found or session not in progress");

  await prisma.$transaction(async (tx) => {
    await tx.workoutSet.deleteMany({ where: { workoutSessionExerciseId: se.id, setNumber } });
    const remaining = await tx.workoutSet.findMany({
      where: { workoutSessionExerciseId: se.id },
      select: { id: true },
      orderBy: { setNumber: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.workoutSet.update({ where: { id: remaining[i].id }, data: { setNumber: i + 1 }, select: { id: true } });
    }
  });

  return ok({ deleted: true });
}
