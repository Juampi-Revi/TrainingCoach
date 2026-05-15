"use client";

import { useRouter } from "next/navigation";
import { Button, Icon, StateBlock } from "@/components/ui";
import type { SessionSummary } from "@regen/types";
import { daysSince, normalizeEnergyRating, fmtSessionDuration } from "./_utils";

type SessionSummaryWithVolume = SessionSummary & { totalVolumeKg?: number | null };

interface SessionsListProps {
  sessions: SessionSummaryWithVolume[];
  clientUserId: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  limit?: number;
  showStatus?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "completed", label: "Completadas" },
  { value: "in_progress", label: "En curso" },
  { value: "discarded", label: "Descartadas" },
] as const;

export function SessionsList({
  sessions,
  clientUserId,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  limit,
  showStatus = false,
  statusFilter = "",
  onStatusFilterChange,
}: SessionsListProps) {
  const router = useRouter();
  const items = limit ? sessions.slice(0, limit) : sessions;

  if (loading) {
    return <StateBlock kind="loading" title="Cargando sesiones…" />;
  }

  if (sessions.length === 0 && !loadingMore) {
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
      {onStatusFilterChange && (
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${statusFilter === opt.value ? "var(--lime)" : "var(--line-2)"}`,
                background: statusFilter === opt.value ? "rgba(215,255,58,.12)" : "transparent",
                color: statusFilter === opt.value ? "var(--lime)" : "var(--text-mute)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

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
                background: s.status === "completed" ? "var(--lime)" : s.status === "in_progress" ? "#FFB547" : "var(--bg-2)",
                border: `2px solid ${s.status === "completed" ? "var(--lime)" : s.status === "in_progress" ? "#FFB547" : "var(--line-2)"}`,
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
                    <div className="ta-mono" style={{ fontSize: 11, color: s.status === "discarded" ? "var(--text-dim)" : "var(--text-mute)" }}>
                      {s.status === "completed" ? "OK" : s.status === "in_progress" ? "EN CURSO" : "DESCARTADA"}
                    </div>
                  </div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                    {s.setsCount != null && `${s.setsCount} series`}
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
                    {s.status === "completed" ? `${s.setsCount != null ? s.setsCount : 0} series` : "En curso"}
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

      {loadingMore && (
        <div style={{ textAlign: "center", padding: 12 }}>
          <StateBlock kind="loading" title="Cargando más…" />
        </div>
      )}

      {hasMore && !loadingMore && onLoadMore && (
        <Button variant="outline" onClick={() => onLoadMore?.()} style={{ width: "100%" }}>
          Cargar más
        </Button>
      )}
    </div>
  );
}

export { daysSince };
