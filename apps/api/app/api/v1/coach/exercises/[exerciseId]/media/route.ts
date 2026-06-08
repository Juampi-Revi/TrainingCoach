import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";
import { cloudinaryImagePreview, cloudinaryImageThumb, cloudinaryVideoThumb, isYouTubeUrl, uploadFromFile, youTubeThumb } from "@/lib/training/exercise-media";

export const runtime = "nodejs";

const MAX_IMAGES = 3;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

type Ctx = { params: Promise<{ exerciseId: string }> };

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

    const transformed = media.map((m) => {
      let thumbnailUrl: string | null = null;
      let previewUrl: string | null = null;

      if (m.mediaType === "image" && m.publicId) {
        thumbnailUrl = cloudinaryImageThumb(m.publicId);
        previewUrl = cloudinaryImagePreview(m.publicId);
      } else if (m.mediaType === "video") {
        if (m.publicId && isYouTubeUrl(m.url)) {
          thumbnailUrl = youTubeThumb(m.publicId);
          previewUrl = thumbnailUrl;
        } else if (m.publicId && m.url.includes("res.cloudinary.com")) {
          thumbnailUrl = cloudinaryVideoThumb(m.publicId);
          previewUrl = m.url;
        }
      }

      return {
        id: m.id,
        mediaType: m.mediaType,
        url: m.url,
        publicId: m.publicId,
        isPrimary: m.isPrimary,
        displayOrder: m.displayOrder,
        thumbnailUrl,
        previewUrl,
      };
    });

    return ok({
      exercise: { id: ex.id, name: ex.name },
      images: transformed.filter((m) => m.mediaType === "image"),
      videos: transformed.filter((m) => m.mediaType === "video"),
      limits: { maxImages: MAX_IMAGES, maxVideos: MAX_VIDEOS },
    });
  });
}

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

    const form = await req.formData().catch(() => null);
    if (!form) return err("Form inválido", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return err("file requerido", 400);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return err("Formato inválido", 400);
    if (isImage && file.size > MAX_IMAGE_SIZE) return err(`Imagen demasiado grande (máx ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`, 400);
    if (isVideo && file.size > MAX_VIDEO_SIZE) return err(`Video demasiado grande (máx ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`, 400);

    const [imageCount, videoCount, maxOrder] = await Promise.all([
      prisma.exerciseMedia.count({ where: { exerciseId, mediaType: "image" } }),
      prisma.exerciseMedia.count({ where: { exerciseId, mediaType: "video" } }),
      prisma.exerciseMedia.aggregate({ where: { exerciseId }, _max: { displayOrder: true } }),
    ]);
    if (isImage && imageCount >= MAX_IMAGES) return err(`Máximo ${MAX_IMAGES} imágenes por ejercicio`, 400);
    if (isVideo && videoCount >= MAX_VIDEOS) return err(`Máximo ${MAX_VIDEOS} video por ejercicio`, 400);

    const folder = `regen/exercises/${exerciseId}`;
    const uploaded = await uploadFromFile(file, { folder, resourceType: isVideo ? "video" : "image" });

    const saved = await prisma.exerciseMedia.create({
      data: {
        exerciseId,
        mediaType: isVideo ? "video" : "image",
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        fileSize: uploaded.bytes,
        duration: uploaded.duration,
        isPrimary: !isVideo && imageCount === 0,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return ok(
      {
        id: saved.id,
        mediaType: saved.mediaType,
        url: saved.url,
        publicId: saved.publicId,
        isPrimary: saved.isPrimary,
        displayOrder: saved.displayOrder,
        thumbnailUrl:
          saved.mediaType === "image" && saved.publicId ? cloudinaryImageThumb(saved.publicId) : saved.publicId && isYouTubeUrl(saved.url) ? youTubeThumb(saved.publicId) : saved.publicId && saved.url.includes("res.cloudinary.com") ? cloudinaryVideoThumb(saved.publicId) : null,
        previewUrl: saved.mediaType === "image" && saved.publicId ? cloudinaryImagePreview(saved.publicId) : saved.mediaType === "video" ? saved.url : null,
      },
      201,
    );
  });
}
