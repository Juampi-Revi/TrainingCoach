"use client";

import { Icon } from "@/components/ui";
import { BLOCK_PATTERNS, type BlockPattern } from "./block-pattern-selector";

interface BlockModalSelectorProps {
  currentPattern: BlockPattern | null;
  onChange: (p: BlockPattern) => void;
}

export function BlockModalSelector({ currentPattern, onChange }: BlockModalSelectorProps) {
  return (
    <div style={{ borderRight: "1px solid var(--line)", background: "var(--bg)", overflow: "auto", padding: 16 }}>
      <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
        Tipo de bloque
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {BLOCK_PATTERNS.map((p) => {
          const pInterval = p.type === "intervals" ? p.intervalType : null;
          const cInterval = currentPattern?.type === "intervals" ? currentPattern.intervalType : null;
          const isActive = currentPattern
            ? p.type === currentPattern.type && (p.type !== "intervals" || pInterval === cInterval)
            : false;
          return (
            <button
              key={`${p.type}-${pInterval ?? ""}`}
              onClick={() => onChange(p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                border: `1px solid ${isActive ? "var(--lime)" : "var(--line-2)"}`,
                background: isActive ? "rgba(215,255,58,.08)" : "transparent",
                cursor: "pointer",
                color: isActive ? "var(--lime)" : "var(--text)",
                textAlign: "left",
              }}
            >
              <Icon name={p.icon} size={14} color={isActive ? "var(--lime)" : "var(--text-mute)"} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
