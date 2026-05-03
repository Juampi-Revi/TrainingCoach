"use client";

import { Input } from "@/components/ui";
import { GROUP_COLORS, groupLabel } from "@/lib/constants";

export function WorkoutProperties({ title, setTitle, description, setDescription, warmup, setWarmup, warmupMinutes, setWarmupMinutes, usedGroups, groupSizes }: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  warmup: string; setWarmup: (v: string) => void;
  warmupMinutes: string; setWarmupMinutes: (v: string) => void;
  usedGroups: string[];
  groupSizes: Record<string, number>;
}) {
  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>PROPIEDADES</div>
      <Input label="Nombre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Músculo · grupo muscular" />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Calentamiento</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number" min={1} max={60} value={warmupMinutes}
            onChange={(e) => setWarmupMinutes(e.target.value)}
            placeholder="—"
            style={{ width: 52, height: 34, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-mute)" }}>minutos</span>
        </div>
        <textarea
          value={warmup}
          onChange={(e) => setWarmup(e.target.value)}
          placeholder="Instrucciones generales de calentamiento…"
          rows={3}
          style={{ background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {usedGroups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Grupos</span>
          {usedGroups.map((g) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: GROUP_COLORS[g] ?? "var(--bg-3)", flexShrink: 0 }} />
              <span style={{ color: GROUP_COLORS[g] ?? "var(--text-mute)", fontWeight: 600 }}>Grupo {g}</span>
              <span style={{ color: "var(--text-mute)" }}>— {groupLabel(groupSizes[g] ?? 1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
