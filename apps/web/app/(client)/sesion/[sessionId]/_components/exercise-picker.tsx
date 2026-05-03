"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { SessionExercise } from "@regen/types";

interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  thumbnailUrl: string | null;
}

export function ExercisePicker({
  sessionId, onAdd, onClose,
}: {
  sessionId: string;
  onAdd: (ex: SessionExercise) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ExerciseOption[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const q = search.trim();
    api.get<ExerciseOption[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setOptions)
      .catch((e) => { console.error(e); setOptions([]); });
  }, [api, search]);

  async function handleAdd(opt: ExerciseOption) {
    setAdding(opt.id);
    try {
      const wse = await api.post<SessionExercise>(`/client/sessions/${sessionId}/exercises`, { exerciseId: opt.id });
      onAdd(wse);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, maxHeight: "75dvh", background: "var(--bg-1)", borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Agregar ejercicio</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOptions(null); }}
              placeholder="Buscar…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {options === null ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
          ) : options.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Sin resultados</div>
          ) : options.map((opt) => (
            <div key={opt.id} onClick={() => handleAdd(opt)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)", cursor: adding === opt.id ? "wait" : "pointer", opacity: adding === opt.id ? 0.5 : 1 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.name}</div>
                {opt.primaryMuscle && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[opt.primaryMuscle] ?? opt.primaryMuscle}</div>}
              </div>
              <Icon name="plus" size={16} color="var(--text-mute)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
