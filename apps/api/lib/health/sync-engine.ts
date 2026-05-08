import { prisma } from "@/lib/prisma";
import { getProvider } from "./registry";
import { NormalizedDailyMetrics, ProviderTokens } from "./types";
import { mergeDailyMetrics } from "./normalizer";

interface SyncResult {
  success: boolean;
  syncedDays: number;
  errors: string[];
}

export async function syncUserProvider(
  userId: string,
  providerId: string,
  daysBack = 30
): Promise<SyncResult> {
  const result: SyncResult = { success: false, syncedDays: 0, errors: [] };

  try {
    const connection = await prisma.healthProviderConnection.findUnique({
      where: {
        userId_provider: { userId, provider: providerId },
      },
    });

    if (!connection || !connection.isActive) {
      result.errors.push("Connection not found or inactive");
      return result;
    }

    if (!connection.accessToken) {
      result.errors.push("No access token available");
      return result;
    }

    const provider = getProvider(providerId as any);
    if (!provider) {
      result.errors.push(`Unknown provider: ${providerId}`);
      return result;
    }

    const tokens: ProviderTokens = {
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken || undefined,
      expiresAt: connection.tokenExpiresAt || undefined,
    };

    // Refresh token if needed
    let refreshedTokens = tokens;
    if (provider.refreshToken && tokens.expiresAt && tokens.expiresAt <= new Date()) {
      try {
        refreshedTokens = await provider.refreshToken!(tokens);
        await prisma.healthProviderConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshedTokens.accessToken,
            refreshToken: refreshedTokens.refreshToken,
            tokenExpiresAt: refreshedTokens.expiresAt,
          },
        });
      } catch (err) {
        result.errors.push(`Token refresh failed: ${err instanceof Error ? err.message : String(err)}`);
        return updateConnectionStatus(connection.id, "failed", result.errors[0], result);
      }
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    let dailyMetrics: NormalizedDailyMetrics[];
    try {
      dailyMetrics = await provider.fetchDailyMetrics(refreshedTokens, startDate, endDate);
    } catch (err) {
      result.errors.push(`Fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      return updateConnectionStatus(connection.id, "failed", result.errors[0], result);
    }

    if (dailyMetrics.length === 0) {
      return updateConnectionStatus(connection.id, "success", null, { ...result, success: true });
    }

    // Save synced activities
    for (const metric of dailyMetrics) {
      const dateStr = metric.date.toISOString().split("T")[0];
      const providerRef = `${providerId}_${dateStr}`;

      await prisma.healthSyncedActivity.upsert({
        where: {
          userId_provider_providerRef: {
            userId,
            provider: providerId,
            providerRef,
          },
        },
        create: {
          userId,
          connectionId: connection.id,
          provider: providerId,
          providerRef,
          date: metric.date,
          steps: metric.steps,
          distanceMeters: metric.distanceMeters,
          calories: metric.calories,
          activeMinutes: metric.activeMinutes,
          sleepMinutes: metric.sleepMinutes,
          deepSleepMinutes: metric.deepSleepMinutes,
          lightSleepMinutes: metric.lightSleepMinutes,
          remSleepMinutes: metric.remSleepMinutes,
          restingHeartRate: metric.restingHeartRate,
          avgHeartRate: metric.avgHeartRate,
          maxHeartRate: metric.maxHeartRate,
          stress: metric.stress,
          bodyBattery: metric.bodyBattery,
          spo2: metric.spo2,
          rawData: metric.rawData ? (metric.rawData as any) : undefined,
        },
        update: {
          steps: metric.steps,
          distanceMeters: metric.distanceMeters,
          calories: metric.calories,
          activeMinutes: metric.activeMinutes,
          sleepMinutes: metric.sleepMinutes,
          deepSleepMinutes: metric.deepSleepMinutes,
          lightSleepMinutes: metric.lightSleepMinutes,
          remSleepMinutes: metric.remSleepMinutes,
          restingHeartRate: metric.restingHeartRate,
          avgHeartRate: metric.avgHeartRate,
          maxHeartRate: metric.maxHeartRate,
          stress: metric.stress,
          bodyBattery: metric.bodyBattery,
          spo2: metric.spo2,
          rawData: metric.rawData ? (metric.rawData as any) : undefined,
        },
      });

      result.syncedDays++;
    }

    // Update DailyHealthEntry with merged data from all providers
    await updateDailyHealthEntries(userId, daysBack);

    return updateConnectionStatus(connection.id, "success", null, { ...result, success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(message);
    const connection = await prisma.healthProviderConnection.findFirst({
      where: { userId, provider: providerId },
    });
    if (connection) {
      await prisma.healthProviderConnection.update({
        where: { id: connection.id },
        data: { lastSyncStatus: "failed", lastError: message, lastSyncAt: new Date() },
      });
    }
    return result;
  }
}

async function updateDailyHealthEntries(userId: string, daysBack: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Fetch all synced activities for this user in date range
  const syncedActivities = await prisma.healthSyncedActivity.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  // Group by date and merge
  const byDate = new Map<string, Array<{ provider: string; data: NormalizedDailyMetrics }>>();

  for (const activity of syncedActivities) {
    const dateKey = activity.date.toISOString().split("T")[0];
    const existing = byDate.get(dateKey) || [];
    existing.push({
      provider: activity.provider,
      data: {
        date: activity.date,
        steps: activity.steps ?? undefined,
        distanceMeters: activity.distanceMeters ?? undefined,
        calories: activity.calories ?? undefined,
        activeMinutes: activity.activeMinutes ?? undefined,
        sleepMinutes: activity.sleepMinutes ?? undefined,
        deepSleepMinutes: activity.deepSleepMinutes ?? undefined,
        lightSleepMinutes: activity.lightSleepMinutes ?? undefined,
        remSleepMinutes: activity.remSleepMinutes ?? undefined,
        restingHeartRate: activity.restingHeartRate ?? undefined,
        avgHeartRate: activity.avgHeartRate ?? undefined,
        maxHeartRate: activity.maxHeartRate ?? undefined,
        stress: activity.stress ?? undefined,
        bodyBattery: activity.bodyBattery ?? undefined,
        spo2: activity.spo2 ?? undefined,
      },
    });
    byDate.set(dateKey, existing);
  }

  // Merge and update DailyHealthEntry
  for (const [dateKey, metrics] of byDate) {
    const merged = mergeDailyMetrics(metrics);
    if (merged.length === 0) continue;

    const best = merged[0];
    const topProvider = Object.entries(best.sources).sort((a, b) => b[1] - a[1])[0]?.[0] || "manual";

    await prisma.dailyHealthEntry.upsert({
      where: {
        clientUserId_day: { clientUserId: userId, day: best.date },
      },
      create: {
        clientUserId: userId,
        day: best.date,
        steps: best.steps,
        sleepMinutes: best.sleepMinutes,
        sportMinutes: best.activeMinutes,
        source: topProvider,
      },
      update: {
        steps: best.steps,
        sleepMinutes: best.sleepMinutes,
        sportMinutes: best.activeMinutes,
        source: topProvider,
      },
    });
  }
}

function updateConnectionStatus(
  connectionId: string,
  status: string,
  error: string | null,
  result: SyncResult
): SyncResult {
  prisma.healthProviderConnection
    .update({
      where: { id: connectionId },
      data: {
        lastSyncStatus: status,
        lastError: error,
        lastSyncAt: new Date(),
      },
    })
    .catch(() => {});

  return result;
}

export async function syncAllActiveConnections(): Promise<{
  total: number;
  success: number;
  failed: number;
}> {
  const connections = await prisma.healthProviderConnection.findMany({
    where: { isActive: true, accessToken: { not: null } },
  });

  const results = await Promise.allSettled(
    connections.map((conn) => syncUserProvider(conn.userId, conn.provider))
  );

  const success = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - success;

  return { total: connections.length, success, failed };
}
