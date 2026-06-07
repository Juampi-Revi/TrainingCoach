"use client";

import { Button, Icon } from "@/components/ui";
import type { ClientDetailResponse, RefPayload } from "./chat-types";

export function RefPickerModal({
  open,
  sessions,
  onClose,
  onSelect,
}: {
  open: boolean;
  sessions: ClientDetailResponse["recentSessions"];
  onClose: () => void;
  onSelect: (ref: RefPayload) => void;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 2000,
        padding: "0 14px 14px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 14,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Referenciar (sesiones recientes)</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-mute)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-mute)" }}>No hay sesiones recientes.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice(0, 10).map((s) => {
              const title = s.workoutTemplate?.title ?? "Sesión libre";
              const date = new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" });
              return (
                <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, background: "var(--bg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", flexShrink: 0 }}>{date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Button variant="secondary" onClick={() => onSelect({ kind: "session", id: s.id, label: `${title} · ${date}` })} style={{ height: 34 }}>
                      Sesión
                    </Button>
                    {s.workoutTemplate?.id && (
                      <Button variant="secondary" onClick={() => onSelect({ kind: "workoutTemplate", id: s.workoutTemplate!.id, label: title })} style={{ height: 34 }}>
                        Entrenamiento
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
