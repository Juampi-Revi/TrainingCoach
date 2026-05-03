"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { ExerciseOption, AltItem } from "./_types";

export function AlternativesPanel({ weId, templateId }: { weId: string; templateId: string }) {
  const { api } = useAuth();
  const [alts, setAlts] = useState<AltItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ExerciseOption[] | null>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<AltItem[]>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`)
      .then(setAlts)
      .catch((e) => { console.error(e); setAlts([]); });
  }, [api, weId, templateId]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    api.get<ExerciseOption[]>(`/coach/exercises?q=${encodeURIComponent(q)}`)
      .then(setOptions)
      .catch((e) => { console.error(e); setOptions([]); });
  }, [api, search]);

  async function addAlt(ex: ExerciseOption) {
    setAdding(ex.id);
    try {
      const alt = await api.post<AltItem>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`, { exerciseId: ex.id });
      setAlts((p) => (p ? [...p, alt] : [alt]));
      setSearch("");
      setOptions([]);
    } catch (e) { console.error(e); }
    finally { setAdding(null); }
  }

  async function removeAlt(altId: string) {
    setDeletingId(altId);
    try {
      await api.del(`/coach/workouts/${templateId}/exercises/${weId}/alternatives/${altId}`);
      setAlts((p) => (p ? p.filter((a) => a.id !== altId) : p));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  }

  return (
    <div>
      {alts === null ? (
        <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "4px 0" }}>Cargando…</div>
      ) : (
        <>
          {alts.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Sin alternativas configuradas.</div>
          )}
          {alts.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={13} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.exercise.name}</div>
                {a.exercise.primaryMuscle && (
                  <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 1 }}>
                    {(MUSCLE_LABEL[a.exercise.primaryMuscle] ?? a.exercise.primaryMuscle).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeAlt(a.id)}
                disabled={deletingId === a.id}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: deletingId === a.id ? 0.3 : 1 }}
              >
                <Icon name="trash" size={12} color="var(--text-dim)" />
              </button>
            </div>
          ))}
          {alts.length < 5 && (
            <div style={{ marginTop: 6, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px" }}>
                <Icon name="search" size={12} color="var(--text-mute)" />
                <input
                  value={search}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearch(next);
                    setOptions(next.trim() ? null : []);
                  }}
                  placeholder="Agregar alternativa…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text)" }}
                />
                {options === null && !!search.trim() && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>…</span>}
              </div>
              {options !== null && options.length > 0 && (
                <div style={{ position: "absolute", top: 34, left: 0, right: 0, zIndex: 50, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 8, maxHeight: 180, overflowY: "auto", boxShadow: "0 6px 20px rgba(0,0,0,.3)" }}>
                  {options.slice(0, 6).map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => addAlt(opt)}
                      style={{ padding: "8px 12px", fontSize: 13, cursor: adding === opt.id ? "wait" : "pointer", opacity: adding === opt.id ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}
                      className="ta-row"
                    >
                      <span style={{ flex: 1, fontWeight: 500 }}>{opt.name}</span>
                      {opt.primaryMuscle && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{MUSCLE_LABEL[opt.primaryMuscle] ?? opt.primaryMuscle}</span>}
                      <Icon name="plus" size={12} color="var(--text-mute)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
