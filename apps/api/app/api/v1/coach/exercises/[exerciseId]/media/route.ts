import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";
import { cloudinary } from "@/lib/cloudinary";

// Límites de media por ejercicio
const MAX_IMAGES = 3;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

type Ctx = { params: Promise<{ exerciseId: string }> };

// GET /api/v1/coach/exercises/:exerciseId/media
export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    const ex = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId: auth.user.sub }] },
      select: { id: true, name: true },
    });
    if (!ex) return notFound("Ejercicio no encontrado");

    const media = await prisma.exerciseMedia.findMany({
      where: { exerciseId },
      orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    });

    // Helper para generar thumbnail de YouTube
    const getYouTubeThumbnail = (videoId: string) => 
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    // Transformar URLs de Cloudinary con parámetros de optimización
    const transformedMedia = media.map((m) => {
      let thumbnailUrl = null;
      let previewUrl = null;

      if (m.mediaType === "image" && m.publicId) {
        // Imagen de Cloudinary - generar URLs transformadas
        thumbnailUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_250,q_auto,f_webp/${m.publicId}`;
        previewUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_600,h_750,q_auto,f_webp/${m.publicId}`;
      } else if (m.mediaType === "video" && m.publicId) {
        // Video de YouTube - usar thumbnail de YouTube
        thumbnailUrl = getYouTubeThumbnail(m.publicId);
        previewUrl = thumbnailUrl;
      }

      return {
        id: m.id,
        mediaType: m.mediaType,
        url: m.url,
        publicId: m.publicId,
        width: m.width,
        height: m.height,
        fileSize: m.fileSize,
        duration: m.duration,
        isPrimary: m.isPrimary,
        displayOrder: m.displayOrder,
        thumbnailUrl,
        previewUrl,
        createdAt: m.createdAt,
      };
    });

    return ok({
      exercise: { id: ex.id, name: ex.name },
      images: transformedMedia.filter((m) => m.mediaType === "image"),
      videos: transformedMedia.filter((m) => m.mediaType === "video"),
      limits: { maxImages: MAX_IMAGES, maxVideos: MAX_VIDEOS },
    });
  });
}

// POST /api/v1/coach/exercises/:exerciseId/media/upload
// Para subir imágenes directamente a Cloudinary
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

    // Verificar límite de imágenes
    const imageCount = await prisma.exerciseMedia.count({
      where: { exerciseId, mediaType: "image" },
    });
    if (imageCount >= MAX_IMAGES) {
      return err(`Máximo ${MAX_IMAGES} imágenes por ejercicio`, 400);
    }

    const form = await req.formData().catch(() => null);
    if (!form) return err("Form inválido", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return err("file requerido", 400);
    if (!file.type.startsWith("image/")) return err("Solo imágenes permitidas", 400);
    if (file.size > MAX_IMAGE_SIZE) return err(`Imagen demasiado grande (máx ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`, 400);

    // Convertir a base64 para Cloudinary
    const ab = await file.arrayBuffer();
    const b64 = Buffer.from(ab).toString("base64");
    const dataUri = `data:${file.type};base64,${b64}`;

    // Subir a Cloudinary
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: `regen/exercises/${exerciseId}`,
      resource_type: "image",
      transformation: [
        { width: 1080, height: 1350, crop: "limit" }, // Max 4:5, sin upscale
      ],
    });

    // Determinar si es la primera imagen (marcar como primaria)
    const isFirstImage = imageCount === 0;
    const maxOrder = await prisma.exerciseMedia.aggregate({
      where: { exerciseId },
      _max: { displayOrder: true },
    });

    // Guardar en DB
    const media = await prisma.exerciseMedia.create({
      data: {
        exerciseId,
        mediaType: "image",
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
        fileSize: uploaded.bytes,
        isPrimary: isFirstImage,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return ok({
      id: media.id,
      mediaType: media.mediaType,
      url: media.url,
      publicId: media.publicId,
      width: media.width,
      height: media.height,
      fileSize: media.fileSize,
      isPrimary: media.isPrimary,
      thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_200,h_250,q_auto,f_webp/${media.publicId}`,
    }, 201);
  });
}
