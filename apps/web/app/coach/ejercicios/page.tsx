"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { EXERCISE_DIFFICULTY_LABEL, EXERCISE_OBJECTIVE_LABEL, MUSCLE_LABEL } from "@/lib/constants";
import { useExerciseLibrary } from "./_hooks/use-exercise-library";
import { ExerciseFormModal } from "./_components/exercise-form-modal";
import { ExerciseLibraryGrid } from "./_components/exercise-library-grid";

export default function EjerciciosPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [media, setMedia] = useState<import("./_hooks/use-exercise-library").ExerciseLibraryQuery["media"]>("any");
  const [modal, setModal] = useState<{ open: true; exercise?: import("./_hooks/use-exercise-library").ExerciseLibraryItem } | null>(null);

  const addContext = useMemo(() => {
    const templateId = searchParams.get("templateId");
    const blockId = searchParams.get("blockId");
    if (!templateId || !blockId) return null;
    return { templateId, blockId };
  }, [searchParams]);

  const query = useMemo(
    () => ({
      q,
      muscles: muscle ? [muscle] : [],
      equipments: equipment ? [equipment] : [],
      difficulties: difficulty ? [difficulty] : [],
      objectives: objective ? [objective] : [],
      favoritesOnly,
      media,
      limit: 120,
    }),
    [q, muscle, equipment, difficulty, objective, favoritesOnly, media],
  );

  const { items, facets, setFavorite, reload } = useExerciseLibrary(query);

  const list = items ?? [];

  async function addToWorkout(exerciseId: string) {
    if (!addContext) return;
    try {
      await api.post(`/coach/workouts/${addContext.templateId}/exercises`, { exerciseId, workoutBlockId: addContext.blockId });
      toast.success("Ejercicio agregado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agregar");
    }
  }

  return (
    <>
      <DesktopShell
        active="library"
        title="Ejercicios"
        subtitle={`${list.length} ejercicios`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <div
              className="coach-header-action-secondary"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: 240, height: 36,
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                borderRadius: 10, padding: "0 12px",
              }}
            >
              <Icon name="search" size={14} color="var(--text-mute)" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                }}
                placeholder="Buscar ejercicio…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)",
                }}
              />
            </div>
            <Button size="sm" icon="plus" onClick={() => setModal({ open: true })}>
              Nuevo ejercicio
            </Button>
          </>
        }
      >
        <div className="coach-pad">
          {/* Mobile search */}
          <div
            className="coach-mobile-search"
            style={{
              display: "none", alignItems: "center", gap: 8,
              height: 40, background: "var(--bg-2)",
              border: "1px solid var(--line-2)", borderRadius: 10,
              padding: "0 12px", marginBottom: 16,
            }}
          >
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
              }}
              placeholder="Buscar ejercicio…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 10,
              marginBottom: 14,
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Músculo</div>
              <select
                value={muscle}
                onChange={(e) => setMuscle(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "0 10px",
                  color: muscle ? "var(--text)" : "var(--text-mute)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                }}
              >
                <option value="">Todos</option>
                {(facets?.muscles ?? Object.keys(MUSCLE_LABEL)).map((m) => (
                  <option key={m} value={m}>
                    {MUSCLE_LABEL[m] ?? m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Equipo</div>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "0 10px",
                  color: equipment ? "var(--text)" : "var(--text-mute)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                }}
              >
                <option value="">Todos</option>
                {(facets?.equipments ?? []).map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Dificultad</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "0 10px",
                  color: difficulty ? "var(--text)" : "var(--text-mute)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                }}
              >
                <option value="">Todas</option>
                {Object.entries(EXERCISE_DIFFICULTY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6, fontWeight: 600 }}>Objetivo</div>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "0 10px",
                  color: objective ? "var(--text)" : "var(--text-mute)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                }}
              >
                <option value="">Todos</option>
                {Object.entries(EXERCISE_OBJECTIVE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => setFavoritesOnly((p) => !p)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${favoritesOnly ? "var(--lime)" : "var(--line-2)"}`,
                background: favoritesOnly ? "rgba(215,255,58,.12)" : "transparent",
                color: favoritesOnly ? "var(--lime)" : "var(--text-mute)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="star" size={12} color={favoritesOnly ? "var(--lime)" : "var(--text-mute)"} />
              Favoritos
            </button>
            <button
              onClick={() => setMedia((p) => (p === "complete" ? "any" : "complete"))}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${media === "complete" ? "var(--success)" : "var(--line-2)"}`,
                background: media === "complete" ? "rgba(110,231,168,.12)" : "transparent",
                color: media === "complete" ? "var(--success)" : "var(--text-mute)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="check" size={12} color={media === "complete" ? "var(--success)" : "var(--text-mute)"} />
              Media completa
            </button>
            <button
              onClick={() => setMedia((p) => (p === "missing" ? "any" : "missing"))}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${media === "missing" ? "var(--warn)" : "var(--line-2)"}`,
                background: media === "missing" ? "rgba(255,181,71,.14)" : "transparent",
                color: media === "missing" ? "var(--warn)" : "var(--text-mute)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="alert" size={12} color={media === "missing" ? "var(--warn)" : "var(--text-mute)"} />
              Falta media
            </button>
            {(muscle || equipment || difficulty || objective || favoritesOnly || media !== "any" || q.trim()) && (
              <button
                onClick={() => {
                  setQ("");
                  setMuscle("");
                  setEquipment("");
                  setDifficulty("");
                  setObjective("");
                  setFavoritesOnly(false);
                  setMedia("any");
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--line-2)",
                  background: "transparent",
                  color: "var(--text-mute)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Limpiar
              </button>
            )}
          </div>

          <ExerciseLibraryGrid
            items={items}
            addContext={addContext}
            onEdit={(ex) => setModal({ open: true, exercise: ex })}
            onToggleFavorite={(exerciseId, next) => void setFavorite(exerciseId, next)}
            onAddToWorkout={(exerciseId) => void addToWorkout(exerciseId)}
          />
        </div>
      </DesktopShell>

      {modal && (
        <ExerciseFormModal
          exercise={modal.exercise}
          onClose={() => setModal(null)}
          onSaved={() => void reload()}
          onDeleted={() => void reload()}
        />
      )}
    </>
  );
}
