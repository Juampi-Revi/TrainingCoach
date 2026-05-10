"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { NotificationSettings } from "@regen/types";
import "./_styles.css";

const DAYS = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mié" },
  { id: "thursday", label: "Jue" },
  { id: "friday", label: "Vie" },
  { id: "saturday", label: "Sáb" },
  { id: "sunday", label: "Dom" },
] as const;

const WEEKLY_DAYS = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
] as const;

type Section = "workout" | "inactivity" | "weekly" | "push" | null;

export default function NotificacionesSettingsPage() {
  const router = useRouter();
  const { api } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Section>(null);

  const [workoutReminder, setWorkoutReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderDays, setReminderDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]);
  const [inactivityAlert, setInactivityAlert] = useState(false);
  const [inactivityDays, setInactivityDays] = useState(3);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [weeklySummaryDay, setWeeklySummaryDay] = useState("sunday");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  const weeklyDayLabel = useMemo(() => {
    return WEEKLY_DAYS.find((d) => d.id === weeklySummaryDay)?.label ?? "Domingo";
  }, [weeklySummaryDay]);

  const reminderDaysLabel = useMemo(() => {
    if (reminderDays.length === DAYS.length) return "Todos los días";
    const labels = DAYS.filter((d) => reminderDays.includes(d.id)).map((d) => d.label);
    if (labels.length === 0) return "Sin días";
    return labels.join(", ");
  }, [reminderDays]);

  const workoutSummary = workoutReminder ? `${reminderTime} · ${reminderDaysLabel}` : "Desactivado";
  const inactivitySummary = inactivityAlert ? `${inactivityDays} día${inactivityDays === 1 ? "" : "s"}` : "Desactivado";
  const weeklySummaryText = weeklySummary ? weeklyDayLabel : "Desactivado";
  const pushSummaryText = pushNotifications ? "Activado" : "Desactivado";

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.get<NotificationSettings>("/client/notifications/settings");
      setWorkoutReminder(data.workoutReminder);
      setReminderTime(data.reminderTime);
      setReminderDays(data.reminderDays);
      setInactivityAlert(data.inactivityAlert);
      setInactivityDays(data.inactivityDays);
      setWeeklySummary(data.weeklySummary);
      setWeeklySummaryDay(data.weeklySummaryDay);
      setEmailNotifications(data.emailNotifications);
      setPushNotifications(data.pushNotifications);
    } catch {
      toast.error("Error al cargar preferencias");
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadSettings();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadSettings]);

  function toggleDay(day: string) {
    setReminderDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.put("/client/notifications/settings", {
        workoutReminder,
        reminderTime,
        reminderDays,
        inactivityAlert,
        inactivityDays,
        weeklySummary,
        weeklySummaryDay,
        emailNotifications,
        pushNotifications,
      });
      toast.success("Preferencias guardadas");
      router.back();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="notif-page">
      <div className="notif-header">
        <button onClick={() => router.back()} className="back-button">
          <Icon name="chevL" size={16} color="var(--text-mute)" />
          Volver
        </button>
        <div className="notif-title">Notificaciones</div>
        <div className="notif-subtitle">Configura cómo querés recibir alertas</div>
      </div>

      <div className="notif-content">
        {loading ? (
          <div className="notif-skeleton">
            <div className="skeleton-row" />
            <div className="skeleton-row skeleton-delay-1" />
            <div className="skeleton-row skeleton-delay-2" />
          </div>
        ) : (
          <>
            <div className="card-cuenta">
              <div className="card-cuenta-row" onClick={() => setExpanded((v) => (v === "workout" ? null : "workout"))}>
                <div className="card-cuenta-left">
                  <Icon name="bell" size={20} color="var(--lime)" />
                  <span>Recordatorios</span>
                </div>
                <div className="card-cuenta-right">
                  <div className="card-cuenta-value">{workoutSummary}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkoutReminder((v) => !v);
                    }}
                    className={`share-toggle ${workoutReminder ? "active" : ""}`}
                    aria-label="Recordatorios"
                  >
                    <div className="share-toggle-knob" />
                  </button>
                  <Icon name={expanded === "workout" ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                </div>
              </div>

              {expanded === "workout" && workoutReminder && (
                <div className="card-editor">
                  <div className="editor-row">
                    <div className="field-label">Horario</div>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="time-input"
                    />
                  </div>

                  <div className="field-label">Días</div>
                  <div className="days-selector">
                    {DAYS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDay(d.id)}
                        className={`day-btn ${reminderDays.includes(d.id) ? "active" : ""}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="card-cuenta-row"
                onClick={() => setExpanded((v) => (v === "inactivity" ? null : "inactivity"))}
              >
                <div className="card-cuenta-left">
                  <Icon name="alert" size={20} color="var(--lime)" />
                  <span>Alerta de inactividad</span>
                </div>
                <div className="card-cuenta-right">
                  <div className="card-cuenta-value">{inactivitySummary}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInactivityAlert((v) => !v);
                    }}
                    className={`share-toggle ${inactivityAlert ? "active" : ""}`}
                    aria-label="Alerta de inactividad"
                  >
                    <div className="share-toggle-knob" />
                  </button>
                  <Icon name={expanded === "inactivity" ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                </div>
              </div>

              {expanded === "inactivity" && inactivityAlert && (
                <div className="card-editor">
                  <div className="editor-row">
                    <div className="field-label">Días sin entrenar</div>
                    <select
                      value={inactivityDays}
                      onChange={(e) => setInactivityDays(Number(e.target.value))}
                      className="select-input"
                    >
                      <option value={2}>2 días</option>
                      <option value={3}>3 días</option>
                      <option value={5}>5 días</option>
                      <option value={7}>7 días</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="card-cuenta-row" onClick={() => setExpanded((v) => (v === "weekly" ? null : "weekly"))}>
                <div className="card-cuenta-left">
                  <Icon name="send" size={20} color="var(--lime)" />
                  <span>Resumen semanal</span>
                </div>
                <div className="card-cuenta-right">
                  <div className="card-cuenta-value">{weeklySummaryText}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWeeklySummary((v) => !v);
                    }}
                    className={`share-toggle ${weeklySummary ? "active" : ""}`}
                    aria-label="Resumen semanal"
                  >
                    <div className="share-toggle-knob" />
                  </button>
                  <Icon name={expanded === "weekly" ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                </div>
              </div>

              {expanded === "weekly" && weeklySummary && (
                <div className="card-editor">
                  <div className="editor-row">
                    <div className="field-label">Día de envío</div>
                    <select
                      value={weeklySummaryDay}
                      onChange={(e) => setWeeklySummaryDay(e.target.value)}
                      className="select-input"
                    >
                      {WEEKLY_DAYS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="card-cuenta">
              <div className="card-cuenta-row is-disabled">
                <div className="card-cuenta-left">
                  <Icon name="send" size={20} color="var(--lime)" />
                  <span>Notificaciones por email</span>
                </div>
                <div className="card-cuenta-right">
                  <button
                    type="button"
                    onClick={() => setEmailNotifications((v) => !v)}
                    className={`share-toggle ${emailNotifications ? "active" : ""}`}
                    aria-label="Notificaciones por email"
                  >
                    <div className="share-toggle-knob" />
                  </button>
                </div>
              </div>

              <div className="card-cuenta-row" onClick={() => setExpanded((v) => (v === "push" ? null : "push"))}>
                <div className="card-cuenta-left">
                  <Icon name="bell" size={20} color="var(--lime)" />
                  <span>Notificaciones push</span>
                </div>
                <div className="card-cuenta-right">
                  <div className="card-cuenta-value">{pushSummaryText}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPushNotifications((v) => !v);
                    }}
                    className={`share-toggle ${pushNotifications ? "active" : ""}`}
                    aria-label="Notificaciones push"
                  >
                    <div className="share-toggle-knob" />
                  </button>
                  <Icon name={expanded === "push" ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                </div>
              </div>

              {expanded === "push" && (
                <div className="card-editor">
                  <div className="helper-text">Este ajuste controla si la app puede enviarte notificaciones push.</div>
                </div>
              )}
            </div>

            <div className="notif-footer">
              <button onClick={handleSave} disabled={saving} className="save-btn">
                {saving ? "Guardando..." : "Guardar preferencias"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
