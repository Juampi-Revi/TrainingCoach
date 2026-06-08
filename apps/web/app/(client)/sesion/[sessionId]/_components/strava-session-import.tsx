"use client";

import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { SessionActivitySummary, WorkoutBlockSummary } from "@regen/types";
import { formatSecondsShort, summarizeEnduranceSteps } from "@/lib/constants";

type RecentActivity = {
  externalActivityId: string;
  sport: string;
  title: string | null;
  startedAt: string | null;
  movingTimeSeconds: number | null;
  distanceMeters: number | null;
  averageHeartrate: number | null;
  linked: boolean;
};

function fmtMinutes(seconds: number | null) {
  if (!seconds) return "—";
  return `${Math.round(seconds / 60)} min`;
}

function fmtDistance(meters: number | null) {
  if (!meters) return "—";
  return `${(meters / 1000).toFixed(2)} km`;
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function distanceDeltaLabel(planned: number, actual: number | null) {
  if (!planned || !actual) return null;
  const deltaKm = (actual - planned) / 1000;
  const sign = deltaKm > 0 ? "+" : "";
  return `${sign}${deltaKm.toFixed(2)} km`;
}

function timeDeltaLabel(planned: number, actual: number | null) {
  if (!planned || !actual) return null;
  const deltaMin = Math.round((actual - planned) / 60);
  const sign = deltaMin > 0 ? "+" : "";
  return `${sign}${deltaMin} min`;
}

export function StravaSessionImport({
  sessionId,
  activities,
  plannedBlocks,
  onLinked,
}: {
  sessionId: string;
  activities: SessionActivitySummary[];
  plannedBlocks: WorkoutBlockSummary[];
  onLinked: () => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RecentActivity[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const planned = plannedBlocks.reduce(
    (acc, block) => {
      const summary = summarizeEnduranceSteps(block.steps);
      acc.distance += summary.totalDistanceMeters;
      acc.duration += summary.totalDurationSeconds;
      acc.steps += summary.steps;
      return acc;
    },
    { distance: 0, duration: 0, steps: 0 },
  );
  const linked = activities[0] ?? null;

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    api.get<{ items: RecentActivity[] }>(`/client/sessions/${sessionId}/activities/strava`)
      .then((res) => setItems(res.items))
      .catch((e) => {
        const message = e instanceof Error ? e.message : "No se pudo cargar Strava";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [api, expanded, sessionId, toast]);

  async function linkActivity(externalActivityId: string) {
    setSavingId(externalActivityId);
    try {
      await api.post(`/client/sessions/${sessionId}/activities/strava`, { externalActivityId });
      toast.success("Actividad vinculada");
      await onLinked();
      setItems((prev) => prev.map((item) => ({ ...item, linked: item.externalActivityId === externalActivityId })));
    } catch (e) {
      const message = e instanceof Error ? e.message : "No se pudo vincular la actividad";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ margin: "10px 16px 0", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--bg-1)" }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div className="ta-mono" style={{ fontSize: 10, color: "#FC4C02", fontWeight: 700, letterSpacing: ".1em" }}>
            STRAVA
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 2 }}>
            {activities.length > 0 ? "Actividad vinculada a esta sesión" : "Importar actividad del reloj"}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ocultar" : "Buscar"}
        </Button>
      </div>

      {planned.steps > 0 && (
        <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "rgba(255,255,255,.02)" }}>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--accent-text)", fontWeight: 700, letterSpacing: ".08em", marginBottom: 6 }}>
              PLANIFICADO
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-mute)" }}>
              <span>{planned.steps} pasos</span>
              {planned.distance > 0 && <span>{fmtDistance(planned.distance)}</span>}
              {planned.duration > 0 && <span>{formatSecondsShort(planned.duration)}</span>}
            </div>
          </div>
          {linked && (
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "rgba(252,76,2,.06)" }}>
              <div className="ta-mono" style={{ fontSize: 10, color: "#FC4C02", fontWeight: 700, letterSpacing: ".08em", marginBottom: 6 }}>
                EJECUTADO
              </div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                {linked.title ?? linked.sport ?? "Actividad"}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>
                <span>{fmtDistance(linked.distanceMeters)}</span>
                <span>{formatSecondsShort(linked.movingTimeSeconds ?? 0)}</span>
                {linked.averageHeartrate ? <span>{linked.averageHeartrate} bpm</span> : null}
                <span>{fmtDate(linked.startedAt)}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
                {distanceDeltaLabel(planned.distance, linked.distanceMeters) ? <span>Delta distancia {distanceDeltaLabel(planned.distance, linked.distanceMeters)}</span> : null}
                {timeDeltaLabel(planned.duration, linked.movingTimeSeconds) ? <span>Delta tiempo {timeDeltaLabel(planned.duration, linked.movingTimeSeconds)}</span> : null}
              </div>
            </div>
          )}
        </div>
      )}

      {activities.length > 0 && (
        <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          {activities.map((activity) => (
            <div key={activity.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                  {activity.title ?? activity.sport ?? "Actividad"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
                  {fmtDistance(activity.distanceMeters)} · {fmtMinutes(activity.movingTimeSeconds)}
                  {activity.averageHeartrate ? ` · ${activity.averageHeartrate} bpm` : ""}
                  {activity.startedAt ? ` · ${fmtDate(activity.startedAt)}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontSize: 12, fontWeight: 700 }}>
                <Icon name="check" size={13} color="var(--success)" />
                Vinculada
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          {loading && <div style={{ fontSize: 12, color: "var(--text-mute)" }}>Cargando actividades…</div>}
          {!loading && items.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-mute)" }}>
              No encontramos actividades recientes. Verificá que Amazfit/Zepp esté sincronizando con Strava.
            </div>
          )}
          {items.map((item) => (
            <div key={item.externalActivityId} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                  {item.title ?? item.sport}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
                  {fmtDistance(item.distanceMeters)} · {fmtMinutes(item.movingTimeSeconds)}
                  {item.averageHeartrate ? ` · ${item.averageHeartrate} bpm` : ""}
                  {item.startedAt ? ` · ${fmtDate(item.startedAt)}` : ""}
                </div>
              </div>
              <Button
                size="sm"
                variant={item.linked ? "secondary" : "primary"}
                disabled={item.linked || savingId === item.externalActivityId}
                onClick={() => linkActivity(item.externalActivityId)}
              >
                {item.linked ? "Vinculada" : savingId === item.externalActivityId ? "Guardando…" : "Vincular"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
