"use client";

import { Icon } from "@/components/ui";
import { EXERCISE_DIFFICULTY_LABEL, EXERCISE_OBJECTIVE_LABEL, MUSCLE_LABEL } from "@/lib/constants";

export function ExercisePickerFilters({
  search,
  setSearch,
  muscle,
  setMuscle,
  equipment,
  setEquipment,
  difficulty,
  setDifficulty,
  objective,
  setObjective,
  favoritesOnly,
  setFavoritesOnly,
  onDirty,
  onClear,
}: {
  search: string;
  setSearch: (next: string) => void;
  muscle: string;
  setMuscle: (next: string) => void;
  equipment: string;
  setEquipment: (next: string) => void;
  difficulty: string;
  setDifficulty: (next: string) => void;
  objective: string;
  setObjective: (next: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (next: boolean) => void;
  onDirty: () => void;
  onClear: () => void;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
        <Icon name="search" size={14} color="var(--text-mute)" />
        <input
          autoFocus
          value={search}
          onChange={(e) => { setSearch(e.target.value); onDirty(); }}
          placeholder="Buscar ejercicio…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <select
          value={muscle}
          onChange={(e) => { setMuscle(e.target.value); onDirty(); }}
          style={{ height: 34, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", fontSize: 12, color: muscle ? "var(--text)" : "var(--text-mute)", outline: "none" }}
        >
          <option value="">Músculo</option>
          {Object.entries(MUSCLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          value={equipment}
          onChange={(e) => { setEquipment(e.target.value); onDirty(); }}
          placeholder="Equipo (opcional)"
          style={{ height: 34, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", fontSize: 12, color: "var(--text)", outline: "none" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); onDirty(); }}
          style={{ height: 34, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", fontSize: 12, color: difficulty ? "var(--text)" : "var(--text-mute)", outline: "none" }}
        >
          <option value="">Dificultad</option>
          {Object.entries(EXERCISE_DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={objective}
          onChange={(e) => { setObjective(e.target.value); onDirty(); }}
          style={{ height: 34, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px", fontSize: 12, color: objective ? "var(--text)" : "var(--text-mute)", outline: "none" }}
        >
          <option value="">Objetivo</option>
          {Object.entries(EXERCISE_OBJECTIVE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <button
          onClick={() => { setFavoritesOnly(!favoritesOnly); onDirty(); }}
          style={{ height: 32, padding: "0 10px", borderRadius: 999, border: `1px solid ${favoritesOnly ? "var(--lime)" : "var(--line-2)"}`, background: favoritesOnly ? "rgba(215,255,58,.12)" : "transparent", color: favoritesOnly ? "var(--lime)" : "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="star" size={12} color={favoritesOnly ? "var(--lime)" : "var(--text-mute)"} />
          Favoritos
        </button>
        {(muscle || equipment.trim() || difficulty || objective || favoritesOnly) && (
          <button
            onClick={() => { onClear(); onDirty(); }}
            style={{ height: 32, padding: "0 10px", borderRadius: 999, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Limpiar
          </button>
        )}
      </div>
    </>
  );
}

