"use client";
import { Icon } from "@/components/ui";
import { EXERCISE_DIFFICULTY_LABEL, EXERCISE_OBJECTIVE_LABEL, MUSCLE_LABEL } from "@/lib/constants";
import type { ExerciseLibraryCatalogFilter } from "../_hooks/exercise-library.types";

export type ExerciseLibraryMediaFilter = "any" | "complete" | "missing" | "missingImage" | "missingVideo";

function chipColors(tone: "lime" | "success" | "warn") {
  if (tone === "success") return { border: "var(--success)", bg: "rgba(110,231,168,.12)", text: "var(--success)" };
  if (tone === "warn") return { border: "var(--warn)", bg: "rgba(255,181,71,.14)", text: "var(--warn)" };
  return { border: "var(--lime)", bg: "rgba(215,255,58,.12)", text: "var(--lime)" };
}

function Chip({
  active,
  tone,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: "lime" | "success" | "warn";
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onClick: () => void;
}) {
  const c = chipColors(tone);
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? c.border : "var(--line-2)"}`,
        background: active ? c.bg : "transparent",
        color: active ? c.text : "var(--text-mute)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name={icon} size={12} color={active ? c.text : "var(--text-mute)"} />
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 38,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          padding: "0 10px",
          color: value ? "var(--text)" : "var(--text-mute)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function ExerciseLibraryFilters({
  q,
  setQ,
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
  catalog,
  setCatalog,
  media,
  setMedia,
  facets,
  onClear,
}: {
  q: string;
  setQ: (v: string) => void;
  muscle: string;
  setMuscle: (v: string) => void;
  equipment: string;
  setEquipment: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  objective: string;
  setObjective: (v: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  catalog: ExerciseLibraryCatalogFilter;
  setCatalog: (v: ExerciseLibraryCatalogFilter) => void;
  media: ExerciseLibraryMediaFilter;
  setMedia: (v: ExerciseLibraryMediaFilter) => void;
  facets: { muscles: string[]; equipments: string[] } | null;
  onClear: () => void;
}) {
  const showClear = muscle || equipment || difficulty || objective || favoritesOnly || catalog !== "all" || media !== "any" || q.trim();

  function toggleCatalog(next: ExerciseLibraryCatalogFilter) {
    setCatalog(catalog === next ? "all" : next);
  }

  return (
    <>
      <div className="coach-mobile-search" style={{ display: "none", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px", marginBottom: 16 }}>
        <Icon name="search" size={14} color="var(--text-mute)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14, alignItems: "end" }}>
        <SelectField label="Músculo" value={muscle} onChange={setMuscle}>
          <option value="">Todos</option>
          {(facets?.muscles ?? Object.keys(MUSCLE_LABEL)).map((m) => <option key={m} value={m}>{MUSCLE_LABEL[m] ?? m}</option>)}
        </SelectField>
        <SelectField label="Equipo" value={equipment} onChange={setEquipment}>
          <option value="">Todos</option>
          {(facets?.equipments ?? []).map((eq) => <option key={eq} value={eq}>{eq}</option>)}
        </SelectField>
        <SelectField label="Dificultad" value={difficulty} onChange={setDifficulty}>
          <option value="">Todas</option>
          {Object.entries(EXERCISE_DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectField>
        <SelectField label="Objetivo" value={objective} onChange={setObjective}>
          <option value="">Todos</option>
          {Object.entries(EXERCISE_OBJECTIVE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectField>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Chip active={catalog === "illustrated"} tone="lime" icon="image" label="Con ilustración" onClick={() => toggleCatalog("illustrated")} />
        <Chip active={catalog === "basic"} tone="lime" icon="bolt" label="Básicos" onClick={() => toggleCatalog("basic")} />
        <Chip active={catalog === "guide"} tone="lime" icon="target" label="Guía visual" onClick={() => toggleCatalog("guide")} />
        <Chip active={catalog === "mine"} tone="lime" icon="user" label="Propios" onClick={() => toggleCatalog("mine")} />
        <Chip active={favoritesOnly} tone="lime" icon="star" label="Favoritos" onClick={() => setFavoritesOnly(!favoritesOnly)} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <Chip active={media === "complete"} tone="success" icon="check" label="Media completa" onClick={() => setMedia(media === "complete" ? "any" : "complete")} />
        <Chip active={media === "missing"} tone="warn" icon="alert" label="Falta media" onClick={() => setMedia(media === "missing" ? "any" : "missing")} />
        <Chip active={media === "missingImage"} tone="warn" icon="image" label="Falta imagen" onClick={() => setMedia(media === "missingImage" ? "any" : "missingImage")} />
        <Chip active={media === "missingVideo"} tone="warn" icon="video" label="Falta video" onClick={() => setMedia(media === "missingVideo" ? "any" : "missingVideo")} />
        {showClear && (
          <button onClick={onClear} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Limpiar
          </button>
        )}
      </div>
    </>
  );
}
