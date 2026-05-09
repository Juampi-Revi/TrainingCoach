"use client";

import { Button, Icon, StateBlock } from "@/components/ui";
import { SessionOption, RefPayload } from "../_types";

interface RefPickerProps {
  sessions: SessionOption[];
  onClose: () => void;
  onSelect: (ref: RefPayload) => void;
}

export function RefPicker({ sessions, onClose, onSelect }: RefPickerProps) {
  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <div>Referenciar</div>
          <button onClick={onClose} className="picker-close"><Icon name="x" size={18} /></button>
        </div>
        {sessions.length === 0 ? (
          <div className="picker-empty">No hay sesiones recientes para referenciar.</div>
        ) : (
          <div className="picker-list">
            {sessions.map(s => {
              const title = s.workoutTemplate?.title ?? "Sesión libre";
              const date = new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" });
              return (
                <div key={s.id} className="picker-item">
                  <div className="picker-item-header">
                    <div className="ta-ellipsis">{title}</div>
                    <div className="ta-mono picker-date">{date}</div>
                  </div>
                  <div className="picker-actions">
                    <Button variant="secondary" onClick={() => onSelect({ kind: "session", id: s.id, label: `${title} · ${date}` })} style={{ height: 34 }}>Sesión</Button>
                    {s.workoutTemplate?.id && (
                      <Button variant="secondary" onClick={() => onSelect({ kind: "workoutTemplate", id: s.workoutTemplate!.id, label: title })} style={{ height: 34 }}>Entrenamiento</Button>
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

interface RefDetailProps {
  ref: RefPayload;
  data: unknown;
  loading: boolean;
  isDesktop: boolean;
  onClose: () => void;
}

export function RefDetail({ ref, data, loading, isDesktop, onClose }: RefDetailProps) {
  const d = data as { title?: string; performedAt?: string; workoutTemplate?: { title: string }; exercises?: Array<{ id: string; exercise?: { name: string }; performedExercise?: { name: string } }> } | null;

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className={`ref-detail-panel ${isDesktop ? "desktop" : "mobile"}`} onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <div>{ref.kind === "session" ? "Sesión" : "Entrenamiento"}</div>
          <button onClick={onClose} className="picker-close"><Icon name="x" size={18} /></button>
        </div>
        {loading ? (
          <StateBlock kind="loading" title="Cargando…" />
        ) : d ? (
          <div className="ref-detail-content">
            <div className="ref-detail-title">
              {d.title ?? d.workoutTemplate?.title ?? ref.label ?? "Detalle"}
            </div>
            {ref.kind === "session" && d.performedAt && (
              <div className="ta-mono ref-detail-date">
                {new Date(d.performedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            <div className="ref-detail-exercises">
              {(d.exercises ?? []).slice(0, 12).map((ex, i) => (
                <div key={ex.id ?? i} className="ref-exercise-item">
                  <div className="ta-ellipsis">
                    {ex.exercise?.name ?? ex.performedExercise?.name ?? "Ejercicio"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="picker-empty">No se pudo cargar el detalle.</div>
        )}
      </div>
    </div>
  );
}