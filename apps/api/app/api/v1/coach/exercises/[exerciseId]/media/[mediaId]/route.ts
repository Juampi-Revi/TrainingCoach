import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";
import { cloudinary } from "@/lib/cloudinary";

type Ctx = { params: Promise<{ exerciseId: string; mediaId: string }> };

// DELETE /api/v1/coach/exercises/:exerciseId/media/:mediaId
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId, mediaId } = await params;

    const media = await prisma.exerciseMedia.findFirst({
      where: { id: mediaId, exerciseId },
      include: { exercise: { select: { coachUserId: true, isSystem: true } } },
    });
    if (!media) return notFound("Media no encontrada");

    // Permitir que coaches gestionen media de ejercicios del sistema
    if (!media.exercise.isSystem && media.exercise.coachUserId !== auth.user.sub) {
      return notFound("Media no encontrada");
    }

    const isCloudinary = media.url.includes("res.cloudinary.com");
    if (isCloudinary && media.publicId && (media.mediaType === "image" || media.mediaType === "video")) {
      try {
        await cloudinary.uploader.destroy(media.publicId, { resource_type: media.mediaType === "video" ? "video" : "image" });
      } catch (e) {
        console.error("Error deleting from Cloudinary:", e);
        // Continuar aunque falle el borrado de Cloudinary
      }
    }

    await prisma.exerciseMedia.delete({ where: { id: mediaId } });

    // Si era la imagen primaria, establecer otra como primaria
    if (media.isPrimary && media.mediaType === "image") {
      const nextPrimary = await prisma.exerciseMedia.findFirst({
        where: { exerciseId, mediaType: "image" },
        orderBy: { displayOrder: "asc" },
      });
      if (nextPrimary) {
        await prisma.exerciseMedia.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    }

    return ok({ deleted: true });
  });
}

// PATCH /api/v1/coach/exercises/:exerciseId/media/:mediaId
// Para actualizar: isPrimary, displayOrder
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId, mediaId } = await params;

    const media = await prisma.exerciseMedia.findFirst({
      where: { id: mediaId, exerciseId },
      include: { exercise: { select: { coachUserId: true, isSystem: true } } },
    });
    if (!media) return notFound("Media no encontrada");

    if (!media.exercise.isSystem && media.exercise.coachUserId !== auth.user.sub) {
      return notFound("Media no encontrada");
    }

    const body = await req.json().catch(() => ({}));
    const { isPrimary, displayOrder } = body;

    // Validar que no se marque un video como primario
    if (isPrimary === true && media.mediaType === "video") {
      return err("Los videos no pueden ser la imagen principal", 400);
    }

    // Si se marca como primaria, desmarcar las demás imágenes
    if (isPrimary === true && media.mediaType === "image") {
      await prisma.exerciseMedia.updateMany({
        where: { exerciseId, mediaType: "image", id: { not: mediaId } },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.exerciseMedia.update({
      where: { id: mediaId },
      data: {
        ...(isPrimary !== undefined && { isPrimary }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    return ok({
      id: updated.id,
      mediaType: updated.mediaType,
      url: updated.url,
      publicId: updated.publicId,
      isPrimary: updated.isPrimary,
      displayOrder: updated.displayOrder,
    });
  });
}
