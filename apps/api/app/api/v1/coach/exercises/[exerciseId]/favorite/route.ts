import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ exerciseId: string }> };

async function assertAccessibleExercise(exerciseId: string, coachUserId: string) {
  const ex = await prisma.exercise.findFirst({
    where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId }] },
    select: { id: true },
  });
  return !!ex;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function looksLikeSchemaOutOfDate(msg: string): boolean {
  return msg.includes("does not exist") && msg.includes("CoachExerciseFavorite");
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const accessible = await assertAccessibleExercise(exerciseId, auth.user.sub);
    if (!accessible) return notFound("Ejercicio no encontrado");

    try {
      await prisma.coachExerciseFavorite.upsert({
        where: { coachUserId_exerciseId: { coachUserId: auth.user.sub, exerciseId } },
        update: {},
        create: { coachUserId: auth.user.sub, exerciseId },
      });
    } catch (e) {
      const msg = messageOf(e);
      if (looksLikeSchemaOutOfDate(msg)) {
        return err("La base de datos no está actualizada para favoritos. Corré las migraciones de Prisma.", 409);
      }
      throw e;
    }

    return ok({ exerciseId, favorite: true });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    try {
      await prisma.coachExerciseFavorite.deleteMany({
        where: { coachUserId: auth.user.sub, exerciseId },
      });
    } catch (e) {
      const msg = messageOf(e);
      if (looksLikeSchemaOutOfDate(msg)) {
        return err("La base de datos no está actualizada para favoritos. Corré las migraciones de Prisma.", 409);
      }
      throw e;
    }

    return ok({ exerciseId, favorite: false });
  });
}
