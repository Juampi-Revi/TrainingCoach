export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface NormalizedDailyMetrics {
  date: Date;
  steps?: number;
  distanceMeters?: number;
  calories?: number;
  activeMinutes?: number;
  sleepMinutes?: number;
  deepSleepMinutes?: number;
  lightSleepMinutes?: number;
  remSleepMinutes?: number;
  restingHeartRate?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  stress?: number;
  bodyBattery?: number;
  spo2?: number;
  activities?: Array<{
    type: string;
    minutes: number;
    calories?: number;
    distanceMeters?: number;
  }>;
  rawData?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
}

export interface HealthProvider {
  readonly name: string;
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<ProviderTokens>;
  refreshToken?(tokens: ProviderTokens): Promise<ProviderTokens>;
  fetchDailyMetrics(
    tokens: ProviderTokens,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedDailyMetrics[]>;
  getUserProfile(tokens: ProviderTokens): Promise<UserProfile>;
}
