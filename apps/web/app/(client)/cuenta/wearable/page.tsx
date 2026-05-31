"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderCard, ProviderCardSkeleton } from "./_components/provider-card";
import { GarminModal, AlertBanner, InfoCard, PrivacyNote } from "./_components/garmin-modal";
import { useProviderConnection } from "./_hooks/use-wearable-connection";
import { PROVIDER_ERROR_MESSAGES } from "./_types";
import "./_styles.css";

const PROVIDER_NAMES: Record<string, string> = {
  garmin: "Garmin",
  google_health: "Google Health",
  strava: "Strava",
};

export default function WearableSettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [garminModal, setGarminModal] = useState(false);
  const { providers, loading, syncing, fetchingStatus, connect, disconnect, sync, refetch } = useProviderConnection();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const err = params.get("error");
    const t = setTimeout(() => {
      if (connected) setSuccess(`${PROVIDER_NAMES[connected] || connected} conectado exitosamente`);
      else if (err) setError(PROVIDER_ERROR_MESSAGES[err] || "Error desconocido");
    }, 0);
    window.history.replaceState({}, "", window.location.pathname);
    return () => clearTimeout(t);
  }, []);

  const handleConnect = useCallback(async (providerId: string) => {
    setError(null); setSuccess(null);
    if (providerId === "garmin") { setGarminModal(true); return; }
    const result = await connect(providerId);
    if (result.ok && result.data?.authUrl) {
      const name = providerId === "google_health" ? "Google Health" : "Strava";
      setSuccess(`Redirigiendo a ${name} para autorizar...`);
      setTimeout(() => { window.location.href = result.data.authUrl; }, 400);
    } else if (result.error) {
      setError("Error al iniciar la conexión");
    }
  }, [connect]);

  const handleGarminSubmit = useCallback(async (email: string, password: string) => {
    const result = await connect("garmin", { email, password });
    if (result.ok) {
      setSuccess("Garmin conectado exitosamente");
      setGarminModal(false);
      refetch();
    } else {
      setError(result.error || "Error al conectar con Garmin. Verificá tus credenciales.");
    }
  }, [connect, refetch]);

  const handleDisconnect = useCallback(async (providerId: string) => {
    const name = providers.find(p => p.id === providerId)?.name || providerId;
    if (!confirm(`¿Desconectar ${name}?`)) return;
    await disconnect(providerId);
    setSuccess(`${name} desconectado`);
  }, [disconnect, providers]);

  const handleSync = useCallback(async (providerId: string) => {
    const result = await sync(providerId);
    if (result.ok) setSuccess("Sincronización completada");
    else setError(result.error || "Error en la sincronización");
  }, [sync]);

  return (
    <div className="wearable-page">
      <div className="wearable-header">
        <h1 className="wearable-title">Dispositivos y apps</h1>
        <p className="wearable-subtitle">Conecta tus dispositivos de fitness para sincronizar datos automáticamente</p>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div className="providers-list">
        {fetchingStatus
          ? Array.from({ length: 3 }).map((_, i) => <ProviderCardSkeleton key={i} />)
          : providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isLoading={loading[provider.id] || false}
              isSyncing={syncing[provider.id] || false}
              onConnect={() => handleConnect(provider.id)}
              onDisconnect={() => handleDisconnect(provider.id)}
              onSync={() => handleSync(provider.id)}
            />
          ))
        }
      </div>

      {garminModal && (
        <GarminModal
          onClose={() => setGarminModal(false)}
          onSubmit={handleGarminSubmit}
          error={error}
          isLoading={loading.garmin || false}
        />
      )}

      <InfoCard
        title="¿Qué datos se sincronizan?"
        items={[
          "Pasos diarios y distancia recorrida",
          "Calorías quemadas y tiempo de actividad",
          "Sueño (duración, fases, calidad)",
          "Ritmo cardíaco (reposo, promedio, máximo)",
          "Estrés y Body Battery (Garmin)",
          "Actividades: running, cycling, swimming (Strava)",
        ]}
      />

      <PrivacyNote />
    </div>
  );
}
