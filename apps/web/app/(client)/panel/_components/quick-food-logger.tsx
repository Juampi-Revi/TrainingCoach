"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { MealType, FoodQuality } from "@regen/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_OPTIONS: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Desayuno" },
  { id: "lunch",     label: "Almuerzo" },
  { id: "snack",     label: "Snack"    },
  { id: "dinner",    label: "Cena"     },
];

const QUALITY_OPTIONS: Array<{ id: FoodQuality; label: string; color: string; bg: string }> = [
  { id: "good",    label: "Buena",   color: "var(--lime)",   bg: "rgba(215,255,58,.12)"  },
  { id: "regular", label: "Regular", color: "#FF8E72",       bg: "rgba(255,142,114,.12)" },
  { id: "poor",    label: "Pobre",   color: "var(--danger)", bg: "rgba(255,80,80,.12)"   },
];

const MACRO_TAGS = ["Proteína", "Carbos", "Verduras", "Grasas buenas", "Procesado", "Postre", "Alcohol"];

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickFoodLogger({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const [meal, setMeal] = useState<MealType | null>(null);
  const [quality, setQuality] = useState<FoodQuality | null>(null);
  const [macros, setMacros] = useState<Set<string>>(new Set(["Proteína", "Carbos", "Verduras"]));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const step = !meal ? 1 : !quality ? 2 : 3;

  const toggleMacro = (tag: string) =>
    setMacros((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const save = async () => {
    if (!meal || !quality) return;
    setSaving(true);
    try {
      await api.post("/client/food", {
        mealType: meal,
        quality,
        macroTags: Array.from(macros),
        text: note.trim() || null,
      });
      onSaved();
      onClose();
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "var(--bg-1)", borderRadius: "20px 20px 0 0", padding: "0 0 32px" }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-2)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "10px 20px 16px", borderBottom: "1px solid var(--line)" }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>
            REGISTRAR COMIDA · PASO {step} / 3
          </div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {step === 1 ? "¿Qué momento?" : step === 2 ? "¿Cómo fue?" : "¿Qué comiste?"}
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Step 1: Meal type */}
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>MOMENTO</div>
            <div style={{ display: "flex", gap: 8 }}>
              {MEAL_OPTIONS.map((m) => {
                const sel = meal === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMeal(m.id)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                      background: sel ? "rgba(215,255,58,.12)" : "transparent",
                      color: sel ? "var(--lime)" : "var(--text-mute)",
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Quality */}
          {meal && (
            <div>
              <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>CALIDAD</div>
              <div style={{ display: "flex", gap: 8 }}>
                {QUALITY_OPTIONS.map((q) => {
                  const sel = quality === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q.id)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 10, cursor: "pointer",
                        border: `1px solid ${sel ? q.color : "var(--line-2)"}`,
                        background: sel ? q.bg : "transparent",
                        color: sel ? q.color : "var(--text-mute)",
                        fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Macros + note */}
          {meal && quality && (
            <>
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>MACROS (OPCIONAL)</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {MACRO_TAGS.map((tag) => {
                    const sel = macros.has(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleMacro(tag)}
                        style={{
                          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                          border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                          background: sel ? "rgba(215,255,58,.12)" : "transparent",
                          color: sel ? "var(--lime)" : "var(--text-mute)",
                          fontSize: 12, fontWeight: sel ? 700 : 500,
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>NOTA (OPCIONAL)</div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: arroz con pollo, ensalada..."
                  style={{
                    width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)",
                    borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--text)",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </>
          )}

          {/* CTA */}
          {meal && quality && (
            <button
              onClick={save}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "14px", background: "var(--lime)", color: "#000",
                border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Guardando…" : "Guardar comida"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
