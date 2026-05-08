import { NormalizedDailyMetrics } from "./types";

export interface MergedDailyMetrics {
  date: Date;
  steps: number | null;
  distanceMeters: number | null;
  calories: number | null;
  activeMinutes: number | null;
  sleepMinutes: number | null;
  deepSleepMinutes: number | null;
  lightSleepMinutes: number | null;
  remSleepMinutes: number | null;
  restingHeartRate: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  stress: number | null;
  bodyBattery: number | null;
  spo2: number | null;
  sources: Record<string, number>;
}

const PROVIDER_PRIORITY: Record<string, number> = {
  garmin: 3,
  google_health: 2,
  strava: 1,
};

export function mergeDailyMetrics(
  metrics: Array<{ provider: string; data: NormalizedDailyMetrics }>
): MergedDailyMetrics[] {
  const dateMap = new Map<string, MergedDailyMetrics>();

  for (const { provider, data } of metrics) {
    const dateKey = data.date.toISOString().split("T")[0];
    const existing = dateMap.get(dateKey);

    if (!existing) {
      dateMap.set(dateKey, {
        date: data.date,
        steps: data.steps ?? null,
        distanceMeters: data.distanceMeters ?? null,
        calories: data.calories ?? null,
        activeMinutes: data.activeMinutes ?? null,
        sleepMinutes: data.sleepMinutes ?? null,
        deepSleepMinutes: data.deepSleepMinutes ?? null,
        lightSleepMinutes: data.lightSleepMinutes ?? null,
        remSleepMinutes: data.remSleepMinutes ?? null,
        restingHeartRate: data.restingHeartRate ?? null,
        avgHeartRate: data.avgHeartRate ?? null,
        maxHeartRate: data.maxHeartRate ?? null,
        stress: data.stress ?? null,
        bodyBattery: data.bodyBattery ?? null,
        spo2: data.spo2 ?? null,
        sources: { [provider]: PROVIDER_PRIORITY[provider] || 0 },
      });
      continue;
    }

    // Merge with priority: higher priority provider wins for same metric
    const currentPriority = PROVIDER_PRIORITY[provider] || 0;
    existing.sources[provider] = currentPriority;

    for (const key of Object.keys(data) as Array<keyof NormalizedDailyMetrics>) {
      if (key === "date" || key === "activities" || key === "rawData") continue;
      const value = data[key];
      if (value === undefined || value === null) continue;

      const existingKey = key as keyof Omit<MergedDailyMetrics, "date" | "sources">;
      const existingValue = existing[existingKey];

      if (existingValue === null) {
        (existing[existingKey] as number | null) = typeof value === "number" ? value : null;
      } else {
        const existingProviderPriority = Math.max(
          ...Object.entries(existing.sources).map(
            ([p, prio]) => (p === provider ? prio : 0)
          )
        );
        if (currentPriority >= existingProviderPriority) {
          (existing[existingKey] as number | null) = typeof value === "number" ? value : null;
        }
      }
    }
  }

  return Array.from(dateMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

export function metricsToDailyEntry(
  merged: MergedDailyMetrics,
  source: string
): {
  steps: number | null;
  sleepMinutes: number | null;
  sportMinutes: number | null;
  source: string;
} {
  return {
    steps: merged.steps,
    sleepMinutes: merged.sleepMinutes,
    sportMinutes: merged.activeMinutes,
    source,
  };
}
