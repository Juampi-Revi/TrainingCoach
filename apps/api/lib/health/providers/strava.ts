import { HealthProvider, NormalizedDailyMetrics, ProviderTokens, UserProfile } from "../types";

const STRAVA_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export class StravaProvider implements HealthProvider {
  readonly name = "Strava";

  private get clientId(): string {
    return process.env.STRAVA_CLIENT_ID || "";
  }

  private get clientSecret(): string {
    return process.env.STRAVA_CLIENT_SECRET || "";
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: "read,activity:read_all",
      state,
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, _redirectUri: string): Promise<ProviderTokens> {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error(`Strava token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    };
  }

  async refreshToken(tokens: ProviderTokens): Promise<ProviderTokens> {
    if (!tokens.refreshToken) return tokens;

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Strava token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    };
  }

  async fetchDailyMetrics(
    tokens: ProviderTokens,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedDailyMetrics[]> {
    const activities = await this.fetchActivities(tokens, startDate, endDate);
    const dailyMap = new Map<string, NormalizedDailyMetrics>();

    for (const activity of activities) {
      const startDateVal = activity.start_date as string;
      const dateStr = new Date(startDateVal).toISOString().split("T")[0];
      const existing = dailyMap.get(dateStr) || {
        date: new Date(startDateVal),
        activeMinutes: 0,
        calories: 0,
        distanceMeters: 0,
        activities: [],
      };

      const movingTime = (activity.moving_time as number) || 0;
      const minutes = Math.round(movingTime / 60);
      const calories = activity.calories as number | undefined;
      const distance = activity.distance as number || 0;
      const activityType = activity.type as string;

      const activityEntry = {
        type: this.mapActivityType(activityType),
        minutes,
        calories,
        distanceMeters: distance,
      };

      existing.activeMinutes = (existing.activeMinutes || 0) + minutes;
      existing.calories = (existing.calories || 0) + (calories || 0);
      existing.distanceMeters = (existing.distanceMeters || 0) + distance;
      existing.activities = existing.activities || [];
      existing.activities.push(activityEntry);

      dailyMap.set(dateStr, existing);
    }

    return Array.from(dailyMap.values());
  }

  private async fetchActivities(
    tokens: ProviderTokens,
    startDate: Date,
    endDate: Date
  ): Promise<Array<Record<string, unknown>>> {
    const allActivities: Array<Record<string, unknown>> = [];
    let page = 1;
    const perPage = 200;

    while (true) {
      const response = await fetch(
        `${STRAVA_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }
      );

      if (!response.ok) break;

      const activities = await response.json();
      if (!Array.isArray(activities) || activities.length === 0) break;

      for (const activity of activities) {
        const activityDate = new Date(activity.start_date as string);
        if (activityDate < startDate || activityDate > endDate) {
          continue;
        }
        allActivities.push(activity);
      }

      if (activities.length < perPage) break;
      page++;
    }

    return allActivities;
  }

  private mapActivityType(stravaType: string): string {
    const typeMap: Record<string, string> = {
      Run: "run",
      Ride: "cycle",
      Swim: "swim",
      Walk: "walk",
      Hike: "walk",
      Workout: "workout",
      WeightTraining: "workout",
      Crossfit: "workout",
      Elliptical: "workout",
      Yoga: "workout",
    };
    return typeMap[stravaType] || "workout";
  }

  async getUserProfile(tokens: ProviderTokens): Promise<UserProfile> {
    const response = await fetch(`${STRAVA_BASE}/athlete`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Strava athlete profile");
    }

    const data = await response.json();
    return {
      id: String(data.id),
      name: `${data.firstname} ${data.lastname}`.trim() || undefined,
    };
  }
}
