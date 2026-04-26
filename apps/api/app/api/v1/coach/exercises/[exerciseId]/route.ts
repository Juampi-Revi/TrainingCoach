import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ exerciseId: string }> };

async function getOwned(exerciseId: string, coachId: string) {
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex) return { ex: null, error: notFound("Ejercicio no encontrado") };
  if (ex.isSystem) return { ex: null, error: err("No se pueden modificar ejercicios del sistema", 403) };
  if (ex.coachUserId !== coachId) return { ex: null, error: err("No tenés permiso", 403) };
  return { ex, error: null };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const ex = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [{ isSystem: true }, { coachUserId: auth.user.sub }],
      },
      include: { media: { take: 1 } },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    return ok({
      id: ex.id,
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
      equipment: ex.equipment,
      isSystem: ex.isSystem,
      youtubeUrl: ex.youtubeUrl ?? null,
      thumbnailUrl: ex.media[0]?.url ?? null,
    });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const { ex, error } = await getOwned(exerciseId, auth.user.sub);
    if (error) return error;

    const body = await req.json();
    const name = (body.name ?? ex!.name).trim();
    if (!name) return err("El nombre es obligatorio", 400);

    let updated;
    try {
      updated = await prisma.exercise.update({
        where: { id: exerciseId },
        data: {
          name,
          primaryMuscle: body.primaryMuscle !== undefined ? (body.primaryMuscle || null) : ex!.primaryMuscle,
          equipment: body.equipment !== undefined ? (body.equipment?.trim() || null) : ex!.equipment,
          youtubeUrl: body.youtubeUrl !== undefined ? (body.youtubeUrl?.trim() || null) : ex!.youtubeUrl,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Unique constraint")) return err("Ya existe un ejercicio con ese nombre", 409);
      throw e;
    }

    return ok({
      id: updated.id,
      name: updated.name,
      primaryMuscle: updated.primaryMuscle,
      equipment: updated.equipment,
      isSystem: updated.isSystem,
      youtubeUrl: updated.youtubeUrl ?? null,
      thumbnailUrl: null,
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const { error } = await getOwned(exerciseId, auth.user.sub);
    if (error) return error;

    await prisma.exercise.delete({ where: { id: exerciseId } });
    return ok({ deleted: true });
  });
}
