import { HealthProvider, NormalizedDailyMetrics, ProviderTokens, UserProfile } from "../types";

const GOOGLE_HEALTH_BASE = "https://health.googleapis.com/v4";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleHealthProvider implements HealthProvider {
  readonly name = "Google Health (Fitbit)";

  private get clientId(): string {
    return process.env.GOOGLE_HEALTH_CLIENT_ID || "";
  }

  private get clientSecret(): string {
    return process.env.GOOGLE_HEALTH_CLIENT_SECRET || "";
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/googlehealth.activity_and_fitness https://www.googleapis.com/auth/googlehealth.sleep",
      state,
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ProviderTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Health token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshToken(tokens: ProviderTokens): Promise<ProviderTokens> {
    if (!tokens.refreshToken) return tokens;

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: tokens.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Health token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async fetchDailyMetrics(
    tokens: ProviderTokens,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedDailyMetrics[]> {
    const metrics: NormalizedDailyMetrics[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayMetrics = await this.fetchDayMetrics(tokens, current);
      if (dayMetrics) metrics.push(dayMetrics);
      current.setDate(current.getDate() + 1);
    }

    return metrics;
  }

  private async fetchDayMetrics(
    tokens: ProviderTokens,
    date: Date
  ): Promise<NormalizedDailyMetrics | null> {
    try {
      const dateStr = date.toISOString().split("T")[0];

      // Steps daily rollup
      const steps = await this.dailyRollup(tokens, "steps", dateStr, dateStr);

      // Calories daily rollup
      const calories = await this.dailyRollup(tokens, "calories", dateStr, dateStr);

      // Distance daily rollup
      const distance = await this.dailyRollup(tokens, "distance", dateStr, dateStr);

      // Heart rate (intraday list)
      const hr = await this.fetchIntraday(tokens, "heart-rate", dateStr);

      // Sleep sessions
      const sleep = await this.fetchList(tokens, "sleep-session", dateStr);

      return this.normalizeGoogleData(date, steps, calories, distance, hr, sleep);
    } catch {
      return null;
    }
  }

  private normalizeGoogleData(
    date: Date,
    steps: number | null,
    calories: number | null,
    distance: number | null,
    hr: { avg: number | null; min: number | null; max: number | null },
    sleep: { totalMinutes: number | null; deepMinutes: number | null; lightMinutes: number | null; remMinutes: number | null }
  ): NormalizedDailyMetrics {
    const metrics: NormalizedDailyMetrics = { date };

    if (steps) metrics.steps = steps;
    if (calories) metrics.calories = calories;
    if (distance) metrics.distanceMeters = Math.round(distance * 1000);

    if (hr.avg) metrics.avgHeartRate = hr.avg;
    if (hr.min) metrics.restingHeartRate = hr.min;
    if (hr.max) metrics.maxHeartRate = hr.max;

    if (sleep.totalMinutes) metrics.sleepMinutes = sleep.totalMinutes;
    if (sleep.deepMinutes) metrics.deepSleepMinutes = sleep.deepMinutes;
    if (sleep.lightMinutes) metrics.lightSleepMinutes = sleep.lightMinutes;
    if (sleep.remMinutes) metrics.remSleepMinutes = sleep.remMinutes;

    return metrics;
  }

  private async dailyRollup(
    tokens: ProviderTokens,
    dataType: string,
    startDate: string,
    endDate: string
  ): Promise<number | null> {
    try {
      const body = {
        window_size: "P1D",
        start_datetime: `${startDate}T00:00:00Z`,
        end_datetime: `${endDate}T23:59:59Z`,
      };

      const response = await fetch(
        `${GOOGLE_HEALTH_BASE}/users/me/dataTypes/${dataType}/dailyRollUp`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.sum || data.average || null;
    } catch {
      return null;
    }
  }

  private async fetchIntraday(
    tokens: ProviderTokens,
    dataType: string,
    date: string
  ): Promise<{ avg: number | null; min: number | null; max: number | null }> {
    try {
      const response = await fetch(
        `${GOOGLE_HEALTH_BASE}/users/me/dataTypes/${dataType}?filter=observation_datetime_date%3D${date}`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );

      if (!response.ok) return { avg: null, min: null, max: null };

      const data = await response.json();
      const points = data.data_points || [];

      if (points.length === 0) return { avg: null, min: null, max: null };

      const values = points.map((p: { value: number }) => p.value);
      const sum = values.reduce((a: number, b: number) => a + b, 0);
      return {
        avg: Math.round(sum / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    } catch {
      return { avg: null, min: null, max: null };
    }
  }

  private async fetchList(
    tokens: ProviderTokens,
    dataType: string,
    date: string
  ): Promise<{ totalMinutes: number | null; deepMinutes: number | null; lightMinutes: number | null; remMinutes: number | null }> {
    try {
      const response = await fetch(
        `${GOOGLE_HEALTH_BASE}/users/me/dataTypes/${dataType}?filter=observation_datetime_date%3D${date}`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );

      if (!response.ok) {
        return { totalMinutes: null, deepMinutes: null, lightMinutes: null, remMinutes: null };
      }

      const data = await response.json();
      const sessions = data.data_points || [];

      let totalSeconds = 0;
      let deepSeconds = 0;
      let lightSeconds = 0;
      let remSeconds = 0;

      for (const session of sessions) {
        const start = new Date(session.start_datetime);
        const end = new Date(session.end_datetime);
        const duration = (end.getTime() - start.getTime()) / 1000;
        totalSeconds += duration;

        if (session.sleep_stage === "deep") deepSeconds += duration;
        else if (session.sleep_stage === "light") lightSeconds += duration;
        else if (session.sleep_stage === "rem") remSeconds += duration;
      }

      return {
        totalMinutes: totalSeconds > 0 ? Math.round(totalSeconds / 60) : null,
        deepMinutes: deepSeconds > 0 ? Math.round(deepSeconds / 60) : null,
        lightMinutes: lightSeconds > 0 ? Math.round(lightSeconds / 60) : null,
        remMinutes: remSeconds > 0 ? Math.round(remSeconds / 60) : null,
      };
    } catch {
      return { totalMinutes: null, deepMinutes: null, lightMinutes: null, remMinutes: null };
    }
  }

  async getUserProfile(tokens: ProviderTokens): Promise<UserProfile> {
    const response = await fetch(`${GOOGLE_HEALTH_BASE}/users/me/getIdentity`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Health user profile: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.googleUserId || data.fitbitUserId || "google_health",
    };
  }
}
