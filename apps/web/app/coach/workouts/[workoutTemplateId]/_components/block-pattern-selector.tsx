"use client";

import { Icon } from "@/components/ui";
import type { BlockType, IntervalType } from "@regen/types";

export type BlockPattern =
  | { type: "warmup"; label: string; desc: string; icon: IconName }
  | { type: "strength"; label: string; desc: string; icon: IconName }
  | { type: "intervals"; intervalType: IntervalType; label: string; desc: string; icon: IconName }
  | { type: "cardio"; label: string; desc: string; icon: IconName }
  | { type: "cooldown"; label: string; desc: string; icon: IconName };

type IconName = "flame" | "dumbbell" | "timer" | "repeat" | "moon";

export const BLOCK_PATTERNS: BlockPattern[] = [
  { type: "warmup", label: "Calentamiento", desc: "Movilidad y activación · sin registrar series", icon: "flame" },
  { type: "strength", label: "Fuerza", desc: "Series y repeticiones · con peso", icon: "dumbbell" },
  { type: "intervals", intervalType: "tabata", label: "Tabata", desc: "20s trabajo · 10s descanso · 8 rondas", icon: "timer" },
  { type: "intervals", intervalType: "hiit", label: "HIIT", desc: "Intervalos de alta intensidad · configurable", icon: "timer" },
  { type: "intervals", intervalType: "emom", label: "EMOM", desc: "Cada minuto un ejercicio · X minutos", icon: "timer" },
  { type: "intervals", intervalType: "amrap", label: "AMRAP", desc: "Tantas rondas como sea posible · tiempo fijo", icon: "timer" },
  { type: "cardio", label: "Cardio / Running", desc: "Pasadas con zonas de FC o ritmo", icon: "repeat" },
  { type: "cooldown", label: "Recuperación", desc: "Estiramiento y respiración · sin registrar series", icon: "moon" },
];

interface BlockPatternSelectorProps {
  value: BlockPattern | null;
  onChange: (pattern: BlockPattern) => void;
}

export function BlockPatternSelector({ value, onChange }: BlockPatternSelectorProps) {
  function isActive(p: BlockPattern): boolean {
    if (!value) return false;
    if (p.type !== value.type) return false;
    if (p.type === "intervals" && value.type === "intervals") {
      return p.intervalType === value.intervalType;
    }
    return true;
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
        ¿Cómo se ejecuta este bloque?
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {BLOCK_PATTERNS.map((p) => {
          const active = isActive(p);
          return (
            <button
              key={`${p.type}-${(p as any).intervalType ?? ""}`}
              onClick={() => onChange(p)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 6,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${active ? "var(--lime)" : "var(--line-2)"}`,
                background: active ? "rgba(215,255,58,.08)" : "var(--bg-2)",
                cursor: "pointer",
                color: active ? "var(--lime)" : "var(--text)",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name={p.icon} size={16} color={active ? "var(--lime)" : "var(--text-mute)"} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</span>
              </div>
              <span style={{ fontSize: 11, color: active ? "var(--lime)" : "var(--text-mute)", opacity: active ? 0.8 : 1, lineHeight: 1.4 }}>
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}