import { HealthProvider } from "./types";
import { GarminProvider } from "./providers/garmin";
import { GoogleHealthProvider } from "./providers/google-health";
import { StravaProvider } from "./providers/strava";

const providers: Record<string, HealthProvider> = {
  garmin: new GarminProvider(),
  google_health: new GoogleHealthProvider(),
  strava: new StravaProvider(),
};

export function getProvider(id: string): HealthProvider | null {
  return providers[id] || null;
}

export function getProviderIds(): string[] {
  return Object.keys(providers);
}

export function getAllProviders(): Record<string, HealthProvider> {
  return { ...providers };
}
