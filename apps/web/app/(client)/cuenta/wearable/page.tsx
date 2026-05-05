"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

const PROVIDERS = [
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Sincroniza pasos, distancia y actividad",
    icon: "footprint",
    color: "#4285F4",
    status: "available",
  },
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Integración nativa con iOS",
    icon: "heart",
    color: "#FF3B30",
    status: "coming_soon",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    description: "Sincroniza entrenamientos y actividad",
    icon: "watch",
    color: "#007CC3",
    status: "coming_soon",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Seguimiento de salud y fitness",
    icon: "activity",
    color: "#00B0B9",
    status: "coming_soon",
  },
] as const;

export default function WearableSettingsPage() {
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    if (PROVIDERS.find((p) => p.id === providerId)?.status === "coming_soon") {
      return;
    }

    setLoading(providerId);

    // Simulate OAuth flow
    setTimeout(() => {
      setConnected((prev) => [...prev, providerId]);
      setLoading(null);
    }, 1500);
  };

  const handleDisconnect = (providerId: string) => {
    setConnected((prev) => prev.filter((id) => id !== providerId));
  };

  return (
    <div className="wearable-page">
      {/* Header */}
      <div className="wearable-header">
        <h1 className="wearable-title">Dispositivos y apps</h1>
        <p className="wearable-subtitle">
          Conecta tus dispositivos de fitness para sincronizar datos automáticamente
        </p>
      </div>

      {/* Providers List */}
      <div className="providers-list">
        {PROVIDERS.map((provider) => {
          const isConnected = connected.includes(provider.id);
          const isLoading = loading === provider.id;
          const isComingSoon = provider.status === "coming_soon";

          return (
            <div
              key={provider.id}
              className={`provider-card ${isConnected ? "connected" : ""} ${
                isComingSoon ? "coming-soon" : ""
              }`}
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
                <div className="provider-name">
                  {provider.name}
                  {isComingSoon && (
                    <span className="coming-soon-badge">Próximamente</span>
                  )}
                </div>
                <div className="provider-description">{provider.description}</div>
                {isConnected && (
                  <div className="provider-status">
                    <span className="status-dot" />
                    Conectado • Última sinc: Hoy
                  </div>
                )}
              </div>

              <button
                className={`provider-action ${isConnected ? "disconnect" : "connect"}`}
                onClick={() =>
                  isConnected ? handleDisconnect(provider.id) : handleConnect(provider.id)
                }
                disabled={isLoading || isComingSoon}
              >
                {isLoading ? (
                  "Conectando..."
                ) : isConnected ? (
                  <>
                    <Icon name="x" size={16} />
                    Desconectar
                  </>
                ) : isComingSoon ? (
                  "Próximamente"
                ) : (
                  <>
                    <Icon name="plus" size={16} />
                    Conectar
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="info-card">
        <div className="info-icon">
          <Icon name="info" size={20} color="var(--lime)" />
        </div>
        <div className="info-content">
          <div className="info-title">¿Qué datos se sincronizan?</div>
          <ul className="info-list">
            <li>Pasos diarios y distancia recorrida</li>
            <li>Calorías quemadas</li>
            <li>Tiempo de actividad física</li>
            <li>Ritmo cardíaco (si está disponible)</li>
            <li>Sueño (duración y calidad)</li>
          </ul>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="privacy-note">
        <Icon name="lock" size={16} color="var(--text-mute)" />
        <p>
          Tus datos de salud son privados y seguros. Solo tú y tu coach pueden verlos
          (si decides compartirlos).
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
          background: rgba(215, 255, 58, 0.05);
        }

        .provider-card.coming-soon {
          opacity: 0.7;
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
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .coming-soon-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 3px 8px;
          background: var(--bg-2);
          border-radius: 10px;
          color: var(--text-mute);
        }

        .provider-description {
          font-size: 13px;
          color: var(--text-mute);
          margin-bottom: 6px;
        }

        .provider-status {
          font-size: 12px;
          color: var(--lime);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: var(--lime);
          border-radius: 50%;
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

        .provider-action.disconnect {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--text-mute);
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
