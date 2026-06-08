import { prisma } from "@/lib/prisma";
import { StravaProvider } from "@/lib/health/providers/strava";

const STRAVA_BASE = "https://www.strava.com/api/v3";

type StravaActivityRecord = {
  id: number | string;
  name?: string;
  type?: string;
  start_date?: string;
  moving_time?: number;
  elapsed_time?: number;
  distance?: number;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
  map?: { summary_polyline?: string | null } | null;
};

async function getConnection(userId: string) {
  const connection = await prisma.healthProviderConnection.findFirst({
    where: { userId, provider: "strava", isActive: true },
  });
  if (!connection?.accessToken) {
    throw new Error("Conectá Strava desde tu cuenta wearable antes de importar actividades");
  }
  return connection;
}

async function ensureAccessToken(userId: string): Promise<string> {
  const connection = await getConnection(userId);
  if (!connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() > Date.now() + 30_000) {
    return connection.accessToken ?? "";
  }

  const provider = new StravaProvider();
  const refreshed = await provider.refreshToken({
    accessToken: connection.accessToken ?? "",
    refreshToken: connection.refreshToken ?? undefined,
    expiresAt: connection.tokenExpiresAt,
  });

  await prisma.healthProviderConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? null,
      tokenExpiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

function normalizeSport(type?: string): string {
  if (type === "Run") return "run";
  if (type === "Ride") return "ride";
  if (type === "Walk" || type === "Hike") return "walk";
  return "workout";
}

function normalizeActivity(activity: StravaActivityRecord) {
  return {
    externalActivityId: String(activity.id),
    sport: normalizeSport(activity.type),
    title: activity.name ?? null,
    startedAt: activity.start_date ? new Date(activity.start_date) : null,
    elapsedTimeSeconds: activity.elapsed_time ?? null,
    movingTimeSeconds: activity.moving_time ?? null,
    distanceMeters: activity.distance != null ? Math.round(activity.distance) : null,
    calories: activity.calories ?? null,
    averageHeartrate: activity.average_heartrate ?? null,
    maxHeartrate: activity.max_heartrate ?? null,
    averageSpeed: activity.average_speed ?? null,
    maxSpeed: activity.max_speed ?? null,
    averageCadence: activity.average_cadence ?? null,
    elevationGainMeters: activity.total_elevation_gain ?? null,
    mapPolyline: activity.map?.summary_polyline ?? null,
    rawData: activity,
  };
}

export async function listRecentStravaActivities(userId: string, daysBack = 21) {
  const accessToken = await ensureAccessToken(userId);
  const after = Math.floor((Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000);
  const response = await fetch(`${STRAVA_BASE}/athlete/activities?per_page=50&after=${after}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No se pudieron cargar actividades de Strava");
  }
  const activities = (await response.json()) as StravaActivityRecord[];
  return activities
    .map(normalizeActivity)
    .filter((item) => item.startedAt && (item.sport === "run" || item.sport === "ride"));
}

export async function getStravaActivity(userId: string, externalActivityId: string) {
  const accessToken = await ensureAccessToken(userId);
  const response = await fetch(`${STRAVA_BASE}/activities/${encodeURIComponent(externalActivityId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No se pudo cargar la actividad de Strava");
  }
  const activity = (await response.json()) as StravaActivityRecord;
  const normalized = normalizeActivity(activity);
  if (!normalized.startedAt) {
    throw new Error("La actividad de Strava no tiene fecha válida");
  }
  return normalized;
}
