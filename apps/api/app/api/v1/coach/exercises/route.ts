import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
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
      source: true,
      media: { select: { url: true, mediaType: true }, take: 1 },
    },
  });

  return ok(
    exercises.map((e) => ({
      id: e.id,
      name: e.name,
      primaryMuscle: e.primaryMuscle,
      equipment: e.equipment,
      isSystem: e.isSystem,
      thumbnailUrl: e.media[0]?.url ?? null,
    })),
  );
}
