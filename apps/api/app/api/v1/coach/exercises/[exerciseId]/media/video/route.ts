import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";

const MAX_VIDEOS = 1;

// Regex mejorado para soportar más formatos de URL de YouTube
// Soporta: watch?v=, youtu.be/, /shorts/, /v/, /embed/
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\s]{11})/;

function extractYouTubeId(url: string): string | null {
  // Limpiar la URL primero (quitar espacios)
  const cleanUrl = url.trim();
  
  // Intentar con el regex principal
  const match = cleanUrl.match(YOUTUBE_REGEX);
  if (match?.[1]) return match[1];
  
  // Fallback: buscar cualquier string de 11 caracteres que parezca un video ID
  // Esto captura casos edge que el regex no agarra
  const fallbackMatch = cleanUrl.match(/([a-zA-Z0-9_-]{11})/);
  return fallbackMatch?.[1] ?? null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

type Ctx = { params: Promise<{ exerciseId: string }> };

// POST /api/v1/coach/exercises/:exerciseId/media/video
// Para agregar videos de YouTube
export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const ex = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId: auth.user.sub }] },
      select: { id: true, name: true },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    // Verificar límite de videos
    const videoCount = await prisma.exerciseMedia.count({
      where: { exerciseId, mediaType: "video" },
    });
    if (videoCount >= MAX_VIDEOS) {
      return err(`Máximo ${MAX_VIDEOS} video por ejercicio`, 400);
    }

    const body = await req.json().catch(() => ({}));
    const { url } = body;
    
    if (!url?.trim()) return err("URL de YouTube requerida", 400);
    
    const videoId = extractYouTubeId(url);
    if (!videoId) return err("URL de YouTube inválida", 400);

    // Verificar que no exista ya este video
    const existing = await prisma.exerciseMedia.findFirst({
      where: { exerciseId, mediaType: "video", url: { contains: videoId } },
    });
    if (existing) return err("Este video ya está agregado", 400);

    const maxOrder = await prisma.exerciseMedia.aggregate({
      where: { exerciseId },
      _max: { displayOrder: true },
    });

    // Guardar en DB
    const media = await prisma.exerciseMedia.create({
      data: {
        exerciseId,
        mediaType: "video",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publicId: videoId, // Guardamos el videoId para generar thumbnails
        width: 1920, // YouTube standard
        height: 1080,
        isPrimary: false,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return ok({
      id: media.id,
      mediaType: media.mediaType,
      url: media.url,
      videoId: media.publicId,
      thumbnailUrl: getYouTubeThumbnail(videoId),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    }, 201);
  });
}
