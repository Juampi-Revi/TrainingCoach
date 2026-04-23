import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound } from "@/lib/api-response";

type Ctx = { params: Promise<{ sessionId: string; wseId: string }> };

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

// POST /…/sets — append a new empty set
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = requireRole(req, "client");
  if (!auth.ok) return unauthorized(auth.message);

  const { sessionId, wseId } = await params;
  const se = await resolveExercise(sessionId, wseId, auth.user.sub);
  if (!se) return notFound("Exercise not found or session not in progress");

  await prisma.$executeRaw`
    INSERT INTO "WorkoutSet" ("id","workoutSessionExerciseId","setNumber","createdAt","updatedAt")
    VALUES (
      gen_random_uuid(), ${se.id},
      (SELECT COALESCE(MAX("setNumber"),0)+1 FROM "WorkoutSet" WHERE "workoutSessionExerciseId"=${se.id}),
      NOW(), NOW()
    )
  `;

  const newSet = await prisma.workoutSet.findFirst({
    where: { workoutSessionExerciseId: se.id },
    orderBy: { setNumber: "desc" },
    select: { id: true, setNumber: true },
  });

  if (!newSet) return notFound("Could not create set");
  return ok({ id: newSet.id, setNumber: newSet.setNumber }, 201);
}
