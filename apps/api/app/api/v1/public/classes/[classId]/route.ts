import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ classId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const { classId } = await params;

    const cls = await prisma.gymClass.findFirst({
      where: { id: classId, status: { in: ["scheduled", "in_progress", "completed"] } },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        scheduledAt: true,
        durationMinutes: true,
        currentExercise: true,
        workoutTemplate: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            workoutBlocks: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                type: true,
                label: true,
                intervalType: true,
                workSeconds: true,
                restSeconds: true,
                rounds: true,
                totalDurationSeconds: true,
                targetMinutes: true,
                targetZone: true,
                exercises: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    id: true,
                    sortOrder: true,
                    targetSets: true,
                    targetReps: true,
                    restSeconds: true,
                    intensityType: true,
                    intensityTarget: true,
                    durationSeconds: true,
                    notes: true,
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                        primaryMuscle: true,
                        equipment: true,
                        difficulty: true,
                        media: { select: { url: true, mediaType: true, publicId: true }, take: 1, orderBy: { isPrimary: "desc" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cls) return notFound("Clase no encontrada");

    // Determine tele mode: timed if any block has intervals/cardio/intervalType
    const hasTimedBlocks = cls.workoutTemplate.workoutBlocks.some(
      (b) => b.type === "intervals" || b.type === "cardio" || !!b.intervalType,
    );
    const teleMode: "static" | "timed" = hasTimedBlocks ? "timed" : "static";

    return ok({ ...cls, teleMode });
  });
}
