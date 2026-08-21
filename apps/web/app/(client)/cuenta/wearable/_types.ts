export interface ProviderConnection {
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  providerUserId: string | null;
  scope: string[];
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  dataTypes: string[];
  connection: ProviderConnection | null;
}

export const DATA_TYPE_LABELS: Record<string, string> = {
  steps: "Pasos",
  sleep: "Sueño",
  heart_rate: "Ritmo cardíaco",
  stress: "Estrés",
  body_battery: "Body Battery",
  spo2: "SpO2",
  calories: "Calorías",
  distance: "Distancia",
  activities: "Actividades",
};

export const PROVIDER_ERROR_MESSAGES: Record<string, string> = {
  garmin_denied: "Conexión con Garmin cancelada",
  google_denied: "Conexión con Google Health cancelada",
  strava_denied: "Conexión con Strava cancelada",
  no_connection: "Error: conexión no encontrada",
  invalid_state: "La autorización venció o no corresponde a tu sesión actual",
  provider_not_found: "Error: proveedor no disponible",
  garmin_failed: "Error al conectar con Garmin",
  google_failed: "Error al conectar con Google Health",
  strava_failed: "Error al conectar con Strava",
  account_in_use: "Esta cuenta ya está conectada a otro usuario",
};
