"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  dataTypes: string[];
  connection: ProviderConnection | null;
}

interface ProviderConnection {
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  providerUserId: string | null;
  scope: string[];
  createdAt: string;
}

const DATA_TYPE_LABELS: Record<string, string> = {
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

export default function WearableSettingsPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [garminModal, setGarminModal] = useState(false);
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");

  const fetchStatus = useCallback(async () => {
    setFetchingStatus(true);
    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setProviders(json.data.providers);
      }
    } catch {
      // Silent fail
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const err = params.get("error");

    if (connected) {
      setSuccess(`${connected === "garmin" ? "Garmin" : connected === "google_health" ? "Google Health" : "Strava"} conectado exitosamente`);
      fetchStatus();
    } else if (err) {
      const errorMessages: Record<string, string> = {
        garmin_denied: "Conexión con Garmin cancelada",
        google_denied: "Conexión con Google Health cancelada",
        strava_denied: "Conexión con Strava cancelada",
        no_connection: "Error: conexión no encontrada",
        provider_not_found: "Error: proveedor no disponible",
        garmin_failed: "Error al conectar con Garmin",
        google_failed: "Error al conectar con Google Health",
        strava_failed: "Error al conectar con Strava",
      };
      setError(errorMessages[err] || "Error desconocido");
    }

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  }, [fetchStatus]);

  const handleConnect = async (providerId: string) => {
    setError(null);
    setSuccess(null);

    if (providerId === "garmin") {
      setGarminModal(true);
      return;
    }

    setLoading((prev) => ({ ...prev, [providerId]: true }));

    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ provider: providerId }),
      });

      if (!res.ok) {
        setError("Error al iniciar la conexión");
        return;
      }

      const json = await res.json();
      if (json.ok && json.data.authUrl) {
        // Mobile-friendly redirect with visual feedback
        const providerName = providerId === "google_health" ? "Google Health" : "Strava";
        setSuccess(`Redirigiendo a ${providerName} para autorizar...`);
        
        // Small delay so user sees the message before redirect
        setTimeout(() => {
          window.location.href = json.data.authUrl;
        }, 400);
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleGarminSubmit = async () => {
    if (!garminEmail || !garminPassword) {
      setError("Completá email y contraseña");
      return;
    }

    setLoading((prev) => ({ ...prev, garmin: true }));
    setError(null);

    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider: "garmin",
          email: garminEmail,
          password: garminPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        setSuccess("Garmin conectado exitosamente");
        setGarminModal(false);
        setGarminEmail("");
        setGarminPassword("");
        fetchStatus();
      } else {
        setError(json.error || "Error al conectar con Garmin. Verificá tus credenciales.");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading((prev) => ({ ...prev, garmin: false }));
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`¿Desconectar ${providers.find((p) => p.id === providerId)?.name}?`)) return;

    setLoading((prev) => ({ ...prev, [providerId]: true }));

    try {
      const token = localStorage.getItem("regen_token");
      await fetch(`${API_BASE}/client/sync`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ provider: providerId }),
      });

      setSuccess(`${providers.find((p) => p.id === providerId)?.name} desconectado`);
      fetchStatus();
    } catch {
      setError("Error al desconectar");
    } finally {
      setLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleSync = async (providerId: string) => {
    setSyncing((prev) => ({ ...prev, [providerId]: true }));

    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync/${providerId === "google_health" ? "google-health" : providerId}/sync`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();
      if (json.ok) {
        setSuccess(json.data.message || "Sincronización completada");
        fetchStatus();
      } else {
        setError(json.error || "Error en la sincronización");
      }
    } catch {
      setError("Error al sincronizar");
    } finally {
      setSyncing((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const formatLastSync = (dateStr: string | null): string => {
    if (!dateStr) return "Nunca";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="wearable-page">
      <div className="wearable-header">
        <h1 className="wearable-title">Dispositivos y apps</h1>
        <p className="wearable-subtitle">
          Conecta tus dispositivos de fitness para sincronizar datos automáticamente
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <Icon name="alert" size={18} color="var(--danger)" />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Icon name="check" size={18} color="var(--lime)" />
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      <div className="providers-list">
        {fetchingStatus
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="provider-card loading">
                <div className="provider-icon" style={{ background: "var(--bg-2)" }} />
                <div className="provider-info">
                  <div className="provider-name" style={{ width: 120, height: 16, background: "var(--bg-2)", borderRadius: 4 }} />
                  <div className="provider-description" style={{ width: 200, height: 12, background: "var(--bg-2)", borderRadius: 4, marginTop: 8 }} />
                </div>
              </div>
            ))
          : providers.map((provider) => {
              const isConnected = provider.connection?.isActive;
              const isLoading = loading[provider.id];
              const isSyncing = syncing[provider.id];
              const lastSyncStatus = provider.connection?.lastSyncStatus;

              return (
                <div
                  key={provider.id}
                  className={`provider-card ${isConnected ? "connected" : ""}`}
                >
                  <div
                    className="provider-icon"
                    style={{
                      background: `${provider.color}15`,
                      borderColor: isConnected ? provider.color : "transparent",
                    }}
                  >
                    <Icon
                      name={provider.icon as any}
                      size={28}
                      color={isConnected ? provider.color : "var(--text-mute)"}
                    />
                  </div>

                  <div className="provider-info">
                    <div className="provider-name">{provider.name}</div>
                    <div className="provider-description">{provider.description}</div>

                    {isConnected && provider.connection && (
                      <div className="provider-details">
                        <div className="sync-status">
                          <span className={`status-dot ${lastSyncStatus === "failed" ? "error" : "ok"}`} />
                          {lastSyncStatus === "failed" ? "Error en última sync" : "Conectado"}
                          <span className="sync-time">
                            · Última sync: {formatLastSync(provider.connection.lastSyncAt)}
                          </span>
                        </div>

                        {provider.connection.lastError && (
                          <div className="sync-error">{provider.connection.lastError}</div>
                        )}

                        <div className="data-types">
                          {provider.dataTypes.slice(0, 4).map((dt) => (
                            <span key={dt} className="data-type-badge">
                              {DATA_TYPE_LABELS[dt] || dt}
                            </span>
                          ))}
                          {provider.dataTypes.length > 4 && (
                            <span className="data-type-badge">+{provider.dataTypes.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="provider-actions">
                    {isConnected ? (
                      <>
                        <button
                          className="provider-action sync"
                          onClick={() => handleSync(provider.id)}
                          disabled={isSyncing}
                          title="Sincronizar ahora"
                        >
                          <Icon name="refresh" size={16} className={isSyncing ? "spinning" : ""} />
                        </button>
                        <button
                          className="provider-action disconnect"
                          onClick={() => handleDisconnect(provider.id)}
                          disabled={isLoading}
                        >
                          <Icon name="x" size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        className="provider-action connect"
                        onClick={() => handleConnect(provider.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Icon name="refresh" size={16} className="spinning" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <Icon name="plus" size={16} />
                            Conectar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {garminModal && (
        <div className="modal-overlay" onClick={() => setGarminModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Conectar Garmin Connect</h2>
              <button className="modal-close" onClick={() => setGarminModal(false)}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <p className="modal-desc">
              Ingresá tus credenciales de Garmin para sincronizar tus datos de salud y actividad.
            </p>
            <div className="modal-fields">
              <label className="field-label">
                Email de Garmin
                <input
                  type="email"
                  className="field-input"
                  placeholder="tu@email.com"
                  value={garminEmail}
                  onChange={(e) => setGarminEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="field-label">
                Contraseña
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={garminPassword}
                  onChange={(e) => setGarminPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            </div>
            {error && (
              <div className="modal-error">
                <Icon name="alert" size={16} color="var(--danger)" />
                <span>{error}</span>
              </div>
            )}
            <p className="modal-privacy">
              <Icon name="lock" size={14} color="var(--text-mute)" />
              Tus credenciales se usan solo para autenticar la conexión y se almacenan de forma segura.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setGarminModal(false)}>
                Cancelar
              </button>
              <button className="modal-btn connect" onClick={handleGarminSubmit} disabled={loading.garmin}>
                {loading.garmin ? (
                  <>
                    <Icon name="refresh" size={16} className="spinning" />
                    Conectando...
                  </>
                ) : (
                  "Conectar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="info-card">
        <div className="info-icon">
          <Icon name="info" size={20} color="var(--lime)" />
        </div>
        <div className="info-content">
          <div className="info-title">¿Qué datos se sincronizan?</div>
          <ul className="info-list">
            <li>Pasos diarios y distancia recorrida</li>
            <li>Calorías quemadas y tiempo de actividad</li>
            <li>Sueño (duración, fases, calidad)</li>
            <li>Ritmo cardíaco (reposo, promedio, máximo)</li>
            <li>Estrés y Body Battery (Garmin)</li>
            <li>Actividades: running, cycling, swimming (Strava)</li>
          </ul>
        </div>
      </div>

      <div className="privacy-note">
        <Icon name="lock" size={16} color="var(--text-mute)" />
        <p>
          Tus datos de salud son privados y seguros. Solo tú y tu coach pueden verlos
          (si decides compartirlos). La sincronización se realiza cada 6 horas automáticamente.
        </p>
      </div>

      <style jsx>{`
        .wearable-page {
          min-height: 100dvh;
          background: var(--bg);
          padding: 20px 16px calc(100px + env(safe-area-inset-bottom));
        }

        .wearable-header {
          margin-bottom: 24px;
        }

        .wearable-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
        }

        .wearable-subtitle {
          font-size: 14px;
          color: var(--text-mute);
          margin: 0;
          line-height: 1.5;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .alert-error {
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          color: var(--danger);
        }

        .alert-success {
          background: rgba(215, 255, 58, 0.1);
          border: 1px solid rgba(215, 255, 58, 0.3);
          color: var(--lime);
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .providers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .provider-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .provider-card:hover {
          border-color: var(--lime);
        }

        .provider-card.connected {
          background: rgba(215, 255, 58, 0.03);
        }

        .provider-card.loading {
          opacity: 0.5;
        }

        .provider-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .provider-info {
          flex: 1;
          min-width: 0;
        }

        .provider-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .provider-description {
          font-size: 13px;
          color: var(--text-mute);
          margin-bottom: 6px;
        }

        .provider-details {
          margin-top: 8px;
        }

        .sync-status {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.ok {
          background: var(--lime);
        }

        .status-dot.error {
          background: var(--danger);
        }

        .sync-time {
          color: var(--text-mute);
          font-size: 11px;
        }

        .sync-error {
          font-size: 11px;
          color: var(--danger);
          margin-bottom: 6px;
        }

        .data-types {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .data-type-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          background: var(--bg-2);
          border-radius: 6px;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .provider-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .provider-action {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          border: none;
          white-space: nowrap;
        }

        .provider-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .provider-action.connect {
          background: var(--lime);
          color: #0B0B0C;
        }

        .provider-action.connect:hover:not(:disabled) {
          background: #e0ff3a;
        }

        .provider-action.sync {
          background: var(--bg-2);
          color: var(--text);
          padding: 10px;
        }

        .provider-action.sync:hover:not(:disabled) {
          background: var(--bg-3);
        }

        .provider-action.disconnect {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--text-mute);
          padding: 10px;
        }

        .provider-action.disconnect:hover {
          border-color: var(--danger);
          color: var(--danger);
        }

        .info-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          background: rgba(215, 255, 58, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .info-list {
          margin: 0;
          padding-left: 18px;
          font-size: 13px;
          color: var(--text-mute);
          line-height: 1.8;
        }

        .privacy-note {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: var(--bg-1);
          border-radius: 12px;
          font-size: 13px;
          color: var(--text-mute);
          line-height: 1.5;
        }

        .privacy-note p {
          margin: 0;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        @media (min-width: 768px) {
          .modal-overlay {
            align-items: center;
          }
        }

        .modal {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 20px 20px 0 0;
          padding: 24px 20px;
          width: 100%;
          max-width: 480px;
          max-height: 85dvh;
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .modal {
            border-radius: 20px;
            padding: 28px;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-mute);
          cursor: pointer;
          padding: 8px;
        }

        .modal-desc {
          font-size: 13px;
          color: var(--text-mute);
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .modal-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 16px;
        }

        .field-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .field-input {
          padding: 12px 14px;
          border: 1px solid var(--line);
          border-radius: 10px;
          font-size: 14px;
          background: var(--bg);
          color: var(--text);
          outline: none;
          transition: border-color 0.2s;
        }

        .field-input:focus {
          border-color: var(--lime);
        }

        .modal-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 59, 48, 0.1);
          border-radius: 10px;
          font-size: 13px;
          color: var(--danger);
          margin-bottom: 12px;
        }

        .modal-privacy {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-mute);
          margin: 0 0 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-btn.cancel {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--text-mute);
        }

        .modal-btn.cancel:hover {
          border-color: var(--text-mute);
          color: var(--text);
        }

        .modal-btn.connect {
          background: var(--lime);
          color: #0B0B0C;
        }

        .modal-btn.connect:hover:not(:disabled) {
          background: #e0ff3a;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @media (min-width: 768px) {
          .wearable-page {
            padding: 48px 28px 32px;
          }

          .wearable-title {
            font-size: 32px;
          }

          .provider-card {
            padding: 24px;
          }

          .provider-icon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
          }

          .provider-name {
            font-size: 18px;
          }

          .provider-description {
            font-size: 14px;
          }

          .info-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
