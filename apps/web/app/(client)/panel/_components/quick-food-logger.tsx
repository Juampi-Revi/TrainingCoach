"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { MealType, FoodQuality } from "@regen/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_OPTIONS: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Desayuno" },
  { id: "lunch", label: "Almuerzo" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Cena" },
];

const QUALITY_OPTIONS: Array<{ id: FoodQuality; label: string; color: string; bg: string; desc: string }> = [
  { id: "good", label: "Buena", color: "var(--success)", bg: "rgba(110,231,168,.12)", desc: "Saludable, balanceada" },
  { id: "regular", label: "Regular", color: "#FF8E72", bg: "rgba(255,142,114,.12)", desc: "Aceptable, mejorable" },
  { id: "poor", label: "Pobre", color: "var(--danger)", bg: "rgba(255,91,91,.12)", desc: "Procesados, pesado" },
];

const MACRO_TAGS = ["Proteína", "Carbos", "Verduras", "Grasas buenas", "Procesado", "Postre", "Alcohol"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useCurrentTime() {
  return useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }, []);
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QuickFoodLoggerProps {
  onClose?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

export function QuickFoodLogger({ onClose, onSaved, embedded = false }: QuickFoodLoggerProps) {
  const { api } = useAuth();
  const toast = useToast();
  const currentTime = useCurrentTime();

  const [meal, setMeal] = useState<MealType | null>(null);
  const [quality, setQuality] = useState<FoodQuality | null>(null);
  const [macros, setMacros] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = meal !== null && quality !== null;

  const toggleMacro = useCallback((tag: string) => {
    setMacros((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!meal || !quality) return;
    setSaving(true);
    try {
      await api.post("/client/food", {
        mealType: meal,
        quality,
        macroTags: Array.from(macros),
        text: note.trim() || null,
      });
      toast.success("Comida registrada");
      // Reset form
      setMeal(null);
      setQuality(null);
      setMacros(new Set());
      setNote("");
      onSaved?.();
      if (!embedded) {
        onClose?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!embedded) {
      onClose?.();
    }
  };

  const containerClass = embedded ? "qfl-embedded" : "qfl-modal";

  return (
    <div className={containerClass}>
      <style jsx>{`
        .qfl-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.6);
          z-index: 1200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 0 env(safe-area-inset-bottom);
        }
        
        .qfl-embedded {
          width: 100%;
        }
        
        .qfl-inner {
          background: var(--bg-1);
          width: 100%;
        }
        
        .qfl-modal .qfl-inner {
          max-width: 480px;
          border-radius: 20px 20px 0 0;
        }
        
        .qfl-embedded .qfl-inner {
          border: 1px solid var(--line);
          border-radius: 16px;
        }
        
        /* Handle (modal only) */
        .qfl-handle {
          display: flex;
          justify-content: center;
          padding: 12px 0 4px;
        }
        
        .qfl-handle-bar {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: var(--line-2);
        }
        
        /* Header */
        .qfl-header {
          padding: 10px 20px 16px;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        
        .qfl-embedded .qfl-header {
          padding: 20px 24px 20px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-header {
            padding: 28px 32px 24px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-header {
            padding: 32px 40px 28px;
          }
        }
        
        .qfl-time {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          letter-spacing: .14em;
          font-weight: 700;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-time {
            font-size: 11px;
          }
        }
        
        .qfl-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -.02em;
          margin-top: 4px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-title {
            font-size: 32px;
            margin-top: 6px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-title {
            font-size: 40px;
          }
        }
        
        .qfl-close {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--bg-1);
          border: 1px solid var(--line-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-mute);
          cursor: pointer;
        }
        
        /* Content */
        .qfl-content {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        
        .qfl-embedded .qfl-content {
          padding: 20px 24px 24px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-content {
            padding: 28px 32px 32px;
            gap: 28px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-content {
            padding: 32px 40px 40px;
            gap: 32px;
          }
        }
        
        /* Step header */
        .qfl-step-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .qfl-step-num {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--lime);
          letter-spacing: .12em;
          font-weight: 700;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-step-num {
            font-size: 11px;
          }
        }
        
        .qfl-step-line {
          height: 1px;
          flex: 1;
          background: var(--line);
        }
        
        .qfl-step-title {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          letter-spacing: .12em;
          font-weight: 700;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-step-title {
            font-size: 11px;
          }
        }
        
        .qfl-step-sub {
          font-size: 10px;
          color: var(--text-dim);
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-step-sub {
            font-size: 12px;
          }
        }
        
        /* Meal buttons */
        .qfl-meal-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 10px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-meal-grid {
            gap: 12px;
            margin-top: 16px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-meal-grid {
            gap: 16px;
          }
        }
        
        .qfl-meal-btn {
          padding: 10px 4px;
          border-radius: 9px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--line-2);
          background: var(--bg-1);
          color: var(--text);
          transition: all 0.15s;
        }
        
        .qfl-meal-btn:hover {
          border-color: var(--lime);
        }
        
        .qfl-meal-btn.selected {
          background: var(--lime);
          border-color: var(--lime);
          color: #0B0B0C;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-meal-btn {
            padding: 16px 8px;
            font-size: 14px;
            border-radius: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-meal-btn {
            padding: 20px 12px;
            font-size: 16px;
          }
        }
        
        /* Quality buttons */
        .qfl-quality-grid {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-quality-grid {
            gap: 16px;
            margin-top: 20px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-quality-grid {
            gap: 20px;
          }
        }
        
        .qfl-quality-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          border: 1px solid var(--line);
          background: var(--bg-1);
          transition: all 0.15s;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-quality-btn {
            padding: 20px;
            border-radius: 14px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-quality-btn {
            padding: 28px;
          }
        }
        
        .qfl-quality-circle {
          width: 22px;
          height: 22px;
          border-radius: 11px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-quality-circle {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            margin-bottom: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-quality-circle {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            margin-bottom: 16px;
          }
        }
        
        .qfl-quality-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-quality-label {
            font-size: 16px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-quality-label {
            font-size: 20px;
          }
        }
        
        .qfl-quality-desc {
          font-size: 10px;
          color: var(--text-mute);
          margin-top: 2px;
          line-height: 1.3;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-quality-desc {
            font-size: 13px;
            margin-top: 6px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-quality-desc {
            font-size: 14px;
          }
        }
        
        /* Macro tags */
        .qfl-macro-grid {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-macro-grid {
            gap: 10px;
            margin-top: 16px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-macro-grid {
            gap: 12px;
            margin-top: 20px;
          }
        }
        
        .qfl-macro-btn {
          padding: 6px 10px;
          border-radius: 14px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--line-2);
          background: transparent;
          color: var(--text-mute);
          transition: all 0.15s;
        }
        
        .qfl-macro-btn:hover {
          border-color: var(--lime);
          color: var(--lime);
        }
        
        .qfl-macro-btn.selected {
          background: rgba(215,255,58,.12);
          border-color: var(--lime);
          color: var(--lime);
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-macro-btn {
            padding: 10px 16px;
            font-size: 14px;
            border-radius: 20px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-macro-btn {
            padding: 12px 20px;
            font-size: 15px;
          }
        }
        
        /* Note input */
        .qfl-note-label {
          font-size: 10px;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-note-label {
            font-size: 12px;
            margin-bottom: 10px;
          }
        }
        
        .qfl-note-input {
          width: 100%;
          background: var(--bg-2);
          border: 1px solid var(--line-2);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        
        .qfl-note-input:focus {
          border-color: var(--lime);
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-note-input {
            padding: 16px 20px;
            font-size: 16px;
            border-radius: 14px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-note-input {
            padding: 20px 24px;
            font-size: 18px;
          }
        }
        
        /* CTA Button */
        .qfl-cta {
          padding-top: 4px;
        }
        
        .qfl-cta-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .qfl-cta-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .qfl-cta-btn.active {
          background: var(--lime);
          color: #0B0B0C;
        }
        
        .qfl-cta-btn.inactive {
          background: var(--bg-3);
          color: var(--text-mute);
        }
        
        @media (min-width: 900px) {
          .qfl-embedded .qfl-cta-btn {
            padding: 20px;
            font-size: 18px;
            border-radius: 14px;
          }
        }
        
        @media (min-width: 1400px) {
          .qfl-embedded .qfl-cta-btn {
            padding: 24px;
            font-size: 20px;
          }
        }
      `}</style>
      
      {!embedded && <div className="qfl-overlay" onClick={handleClose} />}
      
      <div className="qfl-inner" onClick={(e) => e.stopPropagation()}>
        {/* Handle (only in modal) */}
        {!embedded && (
          <div className="qfl-handle">
            <div className="qfl-handle-bar" />
          </div>
        )}

        {/* Header */}
        <div className="qfl-header">
          <div>
            <div className="qfl-time">REGISTRAR · {currentTime}</div>
            <div className="qfl-title">¿Qué comiste?</div>
          </div>
          {!embedded && (
            <button className="qfl-close" onClick={handleClose}>
              <XIcon />
            </button>
          )}
        </div>

        <div className="qfl-content">
          {/* Step 1 — Momento */}
          <div>
            <div className="qfl-step-header">
              <div className="qfl-step-num">01</div>
              <div className="qfl-step-line" />
              <div className="qfl-step-title">MOMENTO</div>
            </div>
            <div className="qfl-meal-grid">
              {MEAL_OPTIONS.map((m) => {
                const sel = meal === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMeal(m.id)}
                    className={`qfl-meal-btn ${sel ? 'selected' : ''}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Calidad */}
          <div>
            <div className="qfl-step-header">
              <div className="qfl-step-num">02</div>
              <div className="qfl-step-line" />
              <div className="qfl-step-title">CALIDAD</div>
              <span className="qfl-step-sub">¿Cómo se sintió esa comida?</span>
            </div>
            <div className="qfl-quality-grid">
              {QUALITY_OPTIONS.map((q) => {
                const sel = quality === q.id;
                const borderColor = sel ? q.color : 'var(--line)';
                const bgColor = sel ? q.bg : 'var(--bg-1)';
                return (
                  <button
                    key={q.id}
                    onClick={() => setQuality(q.id)}
                    className="qfl-quality-btn"
                    style={{ borderColor, background: bgColor }}
                  >
                    <div className="qfl-quality-circle" style={{ background: q.color }}>
                      {sel && <CheckIcon size={12} />}
                    </div>
                    <div className="qfl-quality-label">{q.label}</div>
                    <div className="qfl-quality-desc">{q.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — Macros */}
          <div>
            <div className="qfl-step-header">
              <div className="qfl-step-num">03</div>
              <div className="qfl-step-line" />
              <div className="qfl-step-title">MACROS APROXIMADAS</div>
              <span className="qfl-step-sub">Opcional · 1 tap</span>
            </div>
            <div className="qfl-macro-grid">
              {MACRO_TAGS.map((tag) => {
                const sel = macros.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleMacro(tag)}
                    className={`qfl-macro-btn ${sel ? 'selected' : ''}`}
                  >
                    {sel ? "✓ " : "+ "}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <div className="qfl-note-label">Nota (opcional)</div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: milanesa con ensalada"
              className="qfl-note-input"
            />
          </div>

          {/* CTA */}
          <div className="qfl-cta">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`qfl-cta-btn ${canSave ? 'active' : 'inactive'}`}
            >
              <CheckIcon size={14} />
              {saving ? "Guardando…" : "Guardar · 2 seg"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
