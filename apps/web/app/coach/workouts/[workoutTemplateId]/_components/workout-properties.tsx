"use client";

import { Input } from "@/components/ui";
import { GROUP_COLORS, groupLabel } from "@/lib/constants";
import type { WorkoutSport } from "@regen/types";

export function WorkoutProperties({ title, setTitle, description, setDescription, sport, setSport, usedGroups, groupSizes }: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  sport: WorkoutSport;
  setSport: (v: WorkoutSport) => void;
  usedGroups: string[];
  groupSizes: Record<string, number>;
}) {
  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>PROPIEDADES</div>
      <Input label="Nombre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Músculo · grupo muscular" />
      <div>
        <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Deporte</div>
        <select
          value={sport}
          onChange={(e) => setSport((e.target.value as WorkoutSport) || "generic")}
          style={{
            width: "100%",
            height: 38,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            padding: "0 10px",
            color: "var(--text)",
            outline: "none",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
          }}
        >
          <option value="generic">General</option>
          <option value="run">Running</option>
          <option value="ride">Bicicleta</option>
        </select>
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
