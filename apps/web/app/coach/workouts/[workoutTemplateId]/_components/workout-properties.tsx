"use client";

import { Input } from "@/components/ui";
import { GROUP_COLORS, groupLabel } from "@/lib/constants";

export function WorkoutProperties({ title, setTitle, description, setDescription, usedGroups, groupSizes }: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  usedGroups: string[];
  groupSizes: Record<string, number>;
}) {
  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>PROPIEDADES</div>
      <Input label="Nombre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Músculo · grupo muscular" />

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
