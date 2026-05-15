"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationSettings } from "@regen/types";
import { Button, Icon, Input } from "@/components/ui";
import { useToast } from "@/lib/toast";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";

const DAYS: Array<{ id: string; label: string }> = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

function ToggleRow(props: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { label, desc, value, onChange, disabled } = props;
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onChange(!value);
      }}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 12,
        padding: "12px 12px",
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: value ? "rgba(215,255,58,.14)" : "rgba(255,255,255,.04)",
          border: `1px solid ${value ? "rgba(215,255,58,.35)" : "var(--line-2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={value ? "check" : "bell"} size={16} color={value ? "var(--lime)" : "var(--text-dim)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.35 }}>{desc}</div>}
      </div>
      <div
        aria-hidden
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          background: value ? "rgba(215,255,58,.22)" : "rgba(255,255,255,.05)",
          border: `1px solid ${value ? "rgba(215,255,58,.35)" : "var(--line-2)"}`,
          padding: 3,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: value ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: value ? "var(--lime)" : "var(--text-dim)",
            boxShadow: value ? "0 8px 16px rgba(215,255,58,.18)" : "none",
          }}
        />
      </div>
    </button>
  );
}

export function CoachNotificationSettingsCard(props: {
  api: {
    get: <T>(path: string) => Promise<T>;
    put: <T>(path: string, body?: unknown) => Promise<T>;
    post: <T>(path: string, body?: unknown) => Promise<T>;
  };
  onAfterChange?: () => void;
}) {
  const { api, onAfterChange } = props;
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  const push = usePushNotifications();

  useEffect(() => {
    api
      .get<NotificationSettings>("/coach/notifications/settings")
      .then((s) => setSettings(s))
      .catch(() => toast.error("No se pudieron cargar las preferencias"))
      .finally(() => setLoading(false));
  }, [api, toast]);

  const save = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put<NotificationSettings>("/coach/notifications/settings", {
        inactivityAlert: settings.inactivityAlert,
        inactivityDays: settings.inactivityDays,
        weeklySummary: settings.weeklySummary,
        weeklySummaryDay: settings.weeklySummaryDay,
        pushNotifications: settings.pushNotifications,
      });
      toast.success("Preferencias guardadas");
      onAfterChange?.();
    } catch {
      toast.error("No se pudieron guardar las preferencias");
    } finally {
      setSaving(false);
    }
  }, [api, onAfterChange, settings, toast]);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await api.post<{
        inactivity: { inactive: number; sent: number; skipped: number };
        weekly: { sent: boolean };
      }>("/coach/notifications/check", {});
      toast.success(`Alertas: ${res.inactivity.sent} enviadas · ${res.inactivity.inactive} inactivos`);
      onAfterChange?.();
    } catch {
      toast.error("No se pudieron generar alertas");
    } finally {
      setChecking(false);
    }
  }, [api, onAfterChange, toast]);

  const pushDesc = useMemo(() => {
    if (!push.isSupported) return "No soportadas en este navegador";
    if (push.isSubscribed) return "Activadas en este dispositivo";
    return "Activá para recibir alertas en el navegador";
  }, [push.isSupported, push.isSubscribed]);

  const canSave = !!settings && !loading && !saving;

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        background: "var(--bg-1)",
        padding: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: ".02em" }}>ALERTAS</div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Coach-first</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon="refresh"
          title="Generar alertas"
          ariaLabel="Generar alertas"
          disabled={loading || checking}
          onClick={runCheck}
        >
          Generar
        </Button>
      </div>

      {loading || !settings ? (
        <div style={{ padding: 10, color: "var(--text-mute)", fontSize: 12 }}>Cargando…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ToggleRow
            label="Alertas de inactividad"
            desc="Te avisa cuando un alumno no completa entrenos por X días."
            value={settings.inactivityAlert}
            onChange={(next) => setSettings((prev) => (prev ? { ...prev, inactivityAlert: next } : prev))}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input
              label="Días"
              type="number"
              value={String(settings.inactivityDays)}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, inactivityDays: Math.max(1, Number(e.target.value || 1)) } : prev,
                )
              }
            />
            <div>
              <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 800, marginBottom: 6 }}>
                RESUMEN SEMANAL
              </div>
              <select
                value={settings.weeklySummaryDay}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, weeklySummaryDay: e.target.value } : prev,
                  )
                }
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 12,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  color: "var(--text)",
                  fontSize: 13,
                  padding: "0 10px",
                  outline: "none",
                }}
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8 }}>
                <ToggleRow
                  label="Enviar resumen semanal"
                  value={settings.weeklySummary}
                  onChange={(next) => setSettings((prev) => (prev ? { ...prev, weeklySummary: next } : prev))}
                />
              </div>
            </div>
          </div>

          <ToggleRow
            label="Push en este dispositivo"
            desc={pushDesc}
            value={push.isSubscribed}
            disabled={!push.isSupported || push.isLoading}
            onChange={(next) => {
              if (next) push.subscribe();
              else push.unsubscribe();
            }}
          />

          <ToggleRow
            label="Usar push para alertas"
            desc="Si está activo, las notificaciones también llegan como push."
            value={settings.pushNotifications}
            onChange={(next) => setSettings((prev) => (prev ? { ...prev, pushNotifications: next } : prev))}
            disabled={!push.isSupported}
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <Button
              variant="outline"
              size="sm"
              icon="bell"
              title="Probar push"
              ariaLabel="Probar push"
              disabled={!push.isSubscribed || push.isLoading}
              onClick={push.sendTest}
            >
              Probar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="check"
              title="Guardar"
              ariaLabel="Guardar"
              disabled={!canSave}
              onClick={save}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
