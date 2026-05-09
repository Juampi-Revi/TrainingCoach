"use client";

import { Icon } from "@/components/ui";
import { ProviderConfig, DATA_TYPE_LABELS } from "../_types";

interface ProviderCardProps {
  provider: ProviderConfig;
  isLoading: boolean;
  isSyncing: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

export function ProviderCard({ provider, isLoading, isSyncing, onConnect, onDisconnect, onSync }: ProviderCardProps) {
  const isConnected = provider.connection?.isActive;
  const lastSyncStatus = provider.connection?.lastSyncStatus;

  return (
    <div className={`provider-card ${isConnected ? "connected" : ""}`}>
      <div className="provider-icon" style={{ background: `${provider.color}15`, borderColor: isConnected ? provider.color : "transparent" }}>
        <Icon name={provider.icon as any} size={28} color={isConnected ? provider.color : "var(--text-mute)"} />
      </div>
      <div className="provider-info">
        <div className="provider-name">{provider.name}</div>
        <div className="provider-description">{provider.description}</div>
        {isConnected && provider.connection && (
          <div className="provider-details">
            <div className="sync-status">
              <span className={`status-dot ${lastSyncStatus === "failed" ? "error" : "ok"}`} />
              {lastSyncStatus === "failed" ? "Error en última sync" : "Conectado"}
              <span className="sync-time"> · Última sync: {formatLastSync(provider.connection.lastSyncAt)}</span>
            </div>
            {provider.connection.lastError && <div className="sync-error">{provider.connection.lastError}</div>}
            <div className="data-types">
              {provider.dataTypes.slice(0, 4).map(dt => (
                <span key={dt} className="data-type-badge">{DATA_TYPE_LABELS[dt] || dt}</span>
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
            <button className="provider-action sync" onClick={onSync} disabled={isSyncing} title="Sincronizar ahora">
              <Icon name="refresh" size={16} className={isSyncing ? "spinning" : ""} />
            </button>
            <button className="provider-action disconnect" onClick={onDisconnect} disabled={isLoading}>
              <Icon name="x" size={16} />
            </button>
          </>
        ) : (
          <button className="provider-action connect" onClick={onConnect} disabled={isLoading}>
            {isLoading ? <><Icon name="refresh" size={16} className="spinning" /> Conectando...</> : <><Icon name="plus" size={16} /> Conectar</>}
          </button>
        )}
      </div>
    </div>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="provider-card loading">
      <div className="provider-icon" style={{ background: "var(--bg-2)" }} />
      <div className="provider-info">
        <div className="provider-name" style={{ width: 120, height: 16, background: "var(--bg-2)", borderRadius: 4 }} />
        <div className="provider-description" style={{ width: 200, height: 12, background: "var(--bg-2)", borderRadius: 4, marginTop: 8 }} />
      </div>
    </div>
  );
}

function formatLastSync(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
}