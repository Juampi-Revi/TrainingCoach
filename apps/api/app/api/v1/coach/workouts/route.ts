import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const templates = await prisma.workoutTemplate.findMany({
      where: { coachUserId: auth.user.sub },
      orderBy: { updatedAt: "desc" },
      include: {
        workoutExercises: { select: { id: true } },
      },
    });

    return ok(
      templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        tags: t.tags,
        exerciseCount: t.workoutExercises.length,
        updatedAt: t.updatedAt,
      })),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { title, description, tags, type } = body;
    if (!title) return err("title required", 400);

    const template = await prisma.workoutTemplate.create({
      data: {
        coachUserId: auth.user.sub,
        title,
        description: description ?? null,
        tags: tags ?? [],
        type: type ?? "strength",
      },
      select: { id: true, title: true, tags: true, type: true },
    });

    return ok(template, 201);
  });
}
