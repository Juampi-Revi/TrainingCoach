import { HealthProvider, NormalizedDailyMetrics, ProviderTokens, UserProfile } from "../types";
import { GarminConnect } from "garmin-connect";

interface GarminOauth1 {
  oauth_token: string;
  oauth_token_secret: string;
}

interface GarminOauth2 {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  jti: string;
  expires_at: number;
  refresh_token_expires_in: number;
  expires_date: string;
  refresh_token_expires_at: number;
  last_update_date: string;
}

export class GarminProvider implements HealthProvider {
  readonly name = "Garmin Connect";

  getAuthUrl(state: string, redirectUri: string): string {
    return "/cuenta/wearable?connect=garmin&state=" + state;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ProviderTokens> {
    const { email, password } = JSON.parse(Buffer.from(code, "base64").toString());
    
    const client = new GarminConnect({
      username: email,
      password: password,
    });

    await client.login();
    
    const tokens = client.exportToken();
    return {
      accessToken: Buffer.from(JSON.stringify({
        oauth: tokens,
        email,
      })).toString("base64"),
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async refreshToken(tokens: ProviderTokens): Promise<ProviderTokens> {
    try {
      const data = JSON.parse(Buffer.from(tokens.accessToken, "base64").toString());
      const oauth: { oauth1: GarminOauth1; oauth2: GarminOauth2 } = data.oauth;
      
      const client = new GarminConnect({
        username: data.email,
        password: process.env.GARMIN_PASSWORD_FALLBACK || "",
      });
      
      client.loadToken(oauth.oauth1, oauth.oauth2);
      
      const newTokens = client.exportToken();
      return {
        accessToken: Buffer.from(JSON.stringify({ oauth: newTokens, email: data.email })).toString("base64"),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    } catch {
      return tokens;
    }
  }

  async fetchDailyMetrics(
    tokens: ProviderTokens,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedDailyMetrics[]> {
    try {
      const data = JSON.parse(Buffer.from(tokens.accessToken, "base64").toString());
      const client = await this.getClient(data);
      if (!client) return [];

      const metrics: NormalizedDailyMetrics[] = [];
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const date = new Date(current);
        const dateStr = date.toISOString().split("T")[0];

        try {
          const dayMetrics = await this.fetchDayMetrics(client, date);
          if (dayMetrics) metrics.push(dayMetrics);
        } catch {
          // Skip day if fetch fails
        }

        current.setDate(current.getDate() + 1);
      }

      return metrics;
    } catch {
      return [];
    }
  }

  private async fetchDayMetrics(
    client: any,
    date: Date
  ): Promise<NormalizedDailyMetrics | null> {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const metrics: NormalizedDailyMetrics = { date };

      // Steps
      try {
        const steps = await client.getSteps(date);
        if (typeof steps === "number") metrics.steps = steps;
      } catch {}

      // Heart rate
      try {
        const hr = await client.getHeartRate(date);
        if (hr) {
          if (typeof hr.restingHeartRate === "number") {
            metrics.restingHeartRate = hr.restingHeartRate;
          }
          // No average in Garmin daily data, use min as proxy for resting
          if (typeof hr.minHeartRate === "number") {
            metrics.avgHeartRate = hr.minHeartRate;
          }
          if (typeof hr.maxHeartRate === "number") {
            metrics.maxHeartRate = hr.maxHeartRate;
          }
        }
      } catch {}

      // Sleep
      try {
        const sleep = await client.getSleepData(dateStr);
        if (sleep && sleep.dailySleepDTO) {
          const dto = sleep.dailySleepDTO;
          if (typeof dto.sleepTimeSeconds === "number") {
            metrics.sleepMinutes = Math.round(dto.sleepTimeSeconds / 60);
          }
          if (typeof dto.deepSleepSeconds === "number") {
            metrics.deepSleepMinutes = Math.round(dto.deepSleepSeconds / 60);
          }
          if (typeof dto.lightSleepSeconds === "number") {
            metrics.lightSleepMinutes = Math.round(dto.lightSleepSeconds / 60);
          }
          if (typeof dto.remSleepSeconds === "number") {
            metrics.remSleepMinutes = Math.round(dto.remSleepSeconds / 60);
          }
        }
      } catch {}

      // Weight
      try {
        const weight = await client.getDailyWeightData(date);
        if (weight && weight.dateWeightList && weight.dateWeightList.length > 0) {
          metrics.calories = weight.dateWeightList[0].weight;
        }
      } catch {}

      // Activities
      try {
        const activities = await client.getActivities(0, 10);
        if (Array.isArray(activities)) {
          for (const activity of activities) {
            const activityDate = new Date(activity.startTimeISO || activity.startTimeGMT);
            const activityDateStr = activityDate.toISOString().split("T")[0];
            
            if (activityDateStr === dateStr) {
              if (!metrics.activities) metrics.activities = [];
              metrics.activities.push({
                type: this.mapActivityType(activity.activityType?.typeKey || "workout"),
                minutes: Math.round((activity.duration || 0) / 60),
                calories: activity.calories || undefined,
                distanceMeters: activity.distance || 0,
              });
            }
          }
        }
      } catch {}

      return metrics;
    } catch {
      return null;
    }
  }

  async getUserProfile(tokens: ProviderTokens): Promise<UserProfile> {
    try {
      const data = JSON.parse(Buffer.from(tokens.accessToken, "base64").toString());
      const client = await this.getClient(data);
      if (!client) return { id: "garmin" };
      
      const profile = await client.getUserProfile();
      return {
        id: String(profile?.id || profile?.garminUserId || "garmin"),
        name: profile?.displayName || profile?.fullName,
      };
    } catch {
      return { id: "garmin" };
    }
  }

  private async getClient(data: any): Promise<any | null> {
    try {
      const oauth: { oauth1: GarminOauth1; oauth2: GarminOauth2 } = data.oauth;
      const client = new GarminConnect({
        username: data.email,
        password: process.env.GARMIN_PASSWORD_FALLBACK || "",
      });
      
      if (oauth) {
        client.loadToken(oauth.oauth1, oauth.oauth2);
      }
      
      return client;
    } catch {
      return null;
    }
  }

  private mapActivityType(garminType: string): string {
    const typeMap: Record<string, string> = {
      running: "run",
      cycling: "cycle",
      swimming: "swim",
      walking: "walk",
      hiking: "walk",
      strength_training: "workout",
      cardio: "workout",
      yoga: "workout",
      hiit: "workout",
    };
    return typeMap[garminType] || "workout";
  }
}
