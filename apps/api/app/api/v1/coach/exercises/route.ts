import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? "";
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { isSystem: true },
          { coachUserId: auth.user.sub },
        ],
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        isSystem: true,
        youtubeUrl: true,
        source: true,
        media: { 
          select: { url: true, mediaType: true, publicId: true }, 
          take: 1,
          orderBy: { isPrimary: "desc" }
        },
      },
    });

    return ok(
      exercises.map((e) => {
        // Get thumbnail URL - prioritize image media, then generate from video
        let thumbnailUrl = null;
        const firstMedia = e.media[0];
        
        if (firstMedia) {
          if (firstMedia.mediaType === "image") {
            thumbnailUrl = firstMedia.url;
          } else if (firstMedia.mediaType === "video" && firstMedia.publicId) {
            // Generate YouTube thumbnail
            thumbnailUrl = `https://img.youtube.com/vi/${firstMedia.publicId}/mqdefault.jpg`;
          }
        }

        return {
          id: e.id,
          name: e.name,
          primaryMuscle: e.primaryMuscle,
          equipment: e.equipment,
          isSystem: e.isSystem,
          youtubeUrl: e.youtubeUrl,
          thumbnailUrl,
        };
      }),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const name = (body.name ?? "").trim();
    if (!name) return err("El nombre es obligatorio", 400);

    let exercise;
    try {
      exercise = await prisma.exercise.create({
        data: {
          name,
          primaryMuscle: body.primaryMuscle || null,
          equipment: body.equipment?.trim() || null,
          coachUserId: auth.user.sub,
          isSystem: false,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Unique constraint")) return err("Ya existe un ejercicio con ese nombre", 409);
      throw e;
    }

    return ok({
      id: exercise.id,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      isSystem: exercise.isSystem,
      thumbnailUrl: null,
    });
  });
}
