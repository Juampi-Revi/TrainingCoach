import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { getStravaActivity, listRecentStravaActivities } from "@/lib/health/strava-activity.service";

type Ctx = { params: Promise<{ sessionId: string }> };

async function ensureSession(sessionId: string, clientUserId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, clientUserId },
    select: { id: true },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const session = await ensureSession(sessionId, auth.user.sub);
    if (!session) return err("Sesión no encontrada", 404);

    const existing = await prisma.workoutSessionActivity.findMany({
      where: { workoutSessionId: sessionId, provider: "strava" },
      select: { externalActivityId: true },
    });
    const linked = new Set(existing.map((item) => item.externalActivityId));
    const items = await listRecentStravaActivities(auth.user.sub);

    return ok({
      items: items.map((item) => ({
        ...item,
        startedAt: item.startedAt?.toISOString() ?? null,
        linked: linked.has(item.externalActivityId),
      })),
    });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const session = await ensureSession(sessionId, auth.user.sub);
    if (!session) return err("Sesión no encontrada", 404);

    const body = await req.json().catch(() => ({}));
    const externalActivityId =
      typeof body.externalActivityId === "string" && body.externalActivityId.trim()
        ? body.externalActivityId.trim()
        : null;
    if (!externalActivityId) return err("externalActivityId requerido", 400);

    const activity = await getStravaActivity(auth.user.sub, externalActivityId);
    const saved = await prisma.workoutSessionActivity.upsert({
      where: {
        workoutSessionId_provider: {
          workoutSessionId: sessionId,
          provider: "strava",
        },
      },
      update: {
        externalActivityId: activity.externalActivityId,
        sport: activity.sport,
        title: activity.title,
        startedAt: activity.startedAt ?? new Date(),
        elapsedTimeSeconds: activity.elapsedTimeSeconds,
        movingTimeSeconds: activity.movingTimeSeconds,
        distanceMeters: activity.distanceMeters,
        calories: activity.calories,
        averageHeartrate: activity.averageHeartrate,
        maxHeartrate: activity.maxHeartrate,
        averageSpeed: activity.averageSpeed,
        maxSpeed: activity.maxSpeed,
        averageCadence: activity.averageCadence,
        elevationGainMeters: activity.elevationGainMeters,
        mapPolyline: activity.mapPolyline,
        rawData: activity.rawData,
      },
      create: {
        workoutSessionId: sessionId,
        provider: "strava",
        externalActivityId: activity.externalActivityId,
        sport: activity.sport,
        title: activity.title,
        startedAt: activity.startedAt ?? new Date(),
        elapsedTimeSeconds: activity.elapsedTimeSeconds,
        movingTimeSeconds: activity.movingTimeSeconds,
        distanceMeters: activity.distanceMeters,
        calories: activity.calories,
        averageHeartrate: activity.averageHeartrate,
        maxHeartrate: activity.maxHeartrate,
        averageSpeed: activity.averageSpeed,
        maxSpeed: activity.maxSpeed,
        averageCadence: activity.averageCadence,
        elevationGainMeters: activity.elevationGainMeters,
        mapPolyline: activity.mapPolyline,
        rawData: activity.rawData,
      },
    });

    return ok({
      id: saved.id,
      provider: saved.provider,
      externalActivityId: saved.externalActivityId,
      sport: saved.sport,
      title: saved.title,
      startedAt: saved.startedAt,
    });
  });
}
