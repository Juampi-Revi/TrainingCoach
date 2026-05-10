"use client";

import { useRouter } from "next/navigation";
import { Icon, StateBlock } from "@/components/ui";
import type { SessionSummary } from "@regen/types";
import { daysSince, normalizeEnergyRating, fmtSessionDuration } from "./_utils";

type SessionSummaryWithVolume = SessionSummary & { totalVolumeKg?: number | null };

interface SessionsListProps {
  sessions: SessionSummaryWithVolume[];
  clientUserId: string;
  limit?: number;
  showStatus?: boolean;
}

export function SessionsList({ sessions, clientUserId, limit, showStatus = false }: SessionsListProps) {
  const router = useRouter();
  const items = limit ? sessions.slice(0, limit) : sessions;

  if (sessions.length === 0) {
    return (
      <StateBlock
        kind="empty"
        title="Sin sesiones"
        body="Este alumno aún no completó ninguna sesión."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((s, idx) => {
        const d = fmtSessionDuration(s.performedAt, s.completedAt);
        const e = normalizeEnergyRating(s.energyRating);
        const prev = items[idx + 1];
        const currentVol = typeof s.totalVolumeKg === "number" ? s.totalVolumeKg : null;
        const prevVol = prev && typeof prev.totalVolumeKg === "number" ? prev.totalVolumeKg : null;
        const improved = currentVol != null && prevVol != null && currentVol > prevVol;
        return (
          <div
            key={s.id}
            onClick={() => router.push(`/coach/alumnos/${clientUserId}/sesiones/${s.id}`)}
            style={{
              padding: 12,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            className="ta-row"
          >
            {showStatus && (
              <div style={{
                width: 10, height: 10, borderRadius: 5,
                background: s.status === "completed" ? "var(--lime)" : "var(--bg-2)",
                border: `2px solid ${s.status === "completed" ? "var(--lime)" : "var(--line-2)"}`,
                flexShrink: 0,
              }} />
            )}
            <div className="ta-mono" style={{ width: 64, fontSize: 11, color: "var(--text-mute)" }}>
              {new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {showStatus ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.workoutTemplate?.title ?? "Sesión libre"}
                    </div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                      {s.status === "completed" ? "OK" : "EN CURSO"}
                    </div>
                  </div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                    {s.status === "completed" ? `${s.setsCount}/${s.targetSetsCount} series` : `${s.setsCount} series`}
                    {d ? ` · ${d}` : ""}
                    {e ? ` · Energía ${e}/5` : ""}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.workoutTemplate?.title ?? "Sesión libre"}
                  </div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                    {s.status === "completed" ? `${s.setsCount} series` : "En curso"}
                    {d ? ` · ${d}` : ""}
                    {e ? ` · Energía ${e}/5` : ""}
                  </div>
                </>
              )}
            </div>
            {improved && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <Icon name="trendingUp" size={16} color="var(--success)" />
                <Icon name="star" size={14} color="var(--success)" />
              </div>
            )}
            <Icon name="chevR" size={14} color="var(--text-mute)" />
          </div>
        );
      })}
    </div>
  );
}

export { daysSince };
