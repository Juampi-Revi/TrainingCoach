import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ exerciseId: string }> };

// GET /api/v1/client/exercises/:exerciseId/media
// Para que los alumnos vean la media de un ejercicio
export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;

    const ex = await prisma.exercise.findFirst({
      where: { id: exerciseId },
      select: { id: true, name: true, youtubeUrl: true },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    const media = await prisma.exerciseMedia.findMany({
      where: { exerciseId },
      orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    });

    // Transformar URLs de Cloudinary con parámetros de optimización
    const transformedMedia = media.map((m) => {
      const base = {
        id: m.id,
        mediaType: m.mediaType,
        url: m.url,
        publicId: m.publicId,
        width: m.width,
        height: m.height,
        isPrimary: m.isPrimary,
        displayOrder: m.displayOrder,
      };

      if (m.mediaType === "image" && m.publicId) {
        return {
          ...base,
          // Thumbnail pequeño (lista, picker)
          thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_80,h_100,q_auto,f_webp/${m.publicId}`,
          // Hero mobile
          heroMobileUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_500,q_auto,f_webp/${m.publicId}`,
          // Hero desktop
          heroDesktopUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_600,h_750,q_auto,f_webp/${m.publicId}`,
          // Full quality para lightbox
          fullUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${m.publicId}`,
        };
      }

      if (m.mediaType === "video" && m.publicId) {
        // Video de YouTube
        return {
          ...base,
          videoId: m.publicId,
          embedUrl: `https://www.youtube.com/embed/${m.publicId}?rel=0&modestbranding=1`,
          thumbnailUrl: `https://img.youtube.com/vi/${m.publicId}/maxresdefault.jpg`,
        };
      }

      return base;
    });

    return ok({
      exercise: {
        id: ex.id,
        name: ex.name,
        youtubeUrl: ex.youtubeUrl,
      },
      images: transformedMedia.filter((m) => m.mediaType === "image"),
      videos: transformedMedia.filter((m) => m.mediaType === "video"),
      hasMedia: media.length > 0 || !!ex.youtubeUrl,
    });
  });
}
