import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ exerciseId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const ex = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId: auth.user.sub }] },
      select: { id: true },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    const media = await prisma.exerciseMedia.findMany({
      where: { exerciseId },
      orderBy: { createdAt: "asc" },
    });

    return ok(media.map((m) => ({ id: m.id, mediaType: m.mediaType, url: m.url })));
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const ex = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId: auth.user.sub }] },
      select: { id: true },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    const body = await req.json().catch(() => ({}));
    const { url, mediaType } = body;
    if (!url?.trim()) return err("url requerido", 400);
    if (!["image", "video"].includes(mediaType)) return err("mediaType debe ser 'image' o 'video'", 400);

    const count = await prisma.exerciseMedia.count({ where: { exerciseId } });
    if (count >= 4) return err("Máximo 4 items de media por ejercicio", 400);

    const media = await prisma.exerciseMedia.create({
      data: { exerciseId, url: url.trim(), mediaType },
    });

    return ok({ id: media.id, mediaType: media.mediaType, url: media.url }, 201);
  });
}
