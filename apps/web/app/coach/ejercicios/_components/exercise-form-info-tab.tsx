"use client";

import { EXERCISE_DIFFICULTY_LABEL, EXERCISE_OBJECTIVE_LABEL, MUSCLE_LABEL } from "@/lib/constants";
import type { ExerciseLibraryItem } from "../_hooks/use-exercise-library";

export type ExerciseFormValue = Pick<
  ExerciseLibraryItem,
  "name" | "primaryMuscle" | "equipment" | "difficulty" | "objective" | "youtubeUrl"
>;

export const DIFFICULTY_LABEL = EXERCISE_DIFFICULTY_LABEL;
export const OBJECTIVE_LABEL = EXERCISE_OBJECTIVE_LABEL;

export function ExerciseFormInfoTab({
  value,
  setValue,
  onSave,
  readOnly = false,
  equipmentSuggestions,
}: {
  value: ExerciseFormValue;
  setValue: (next: (prev: ExerciseFormValue) => ExerciseFormValue) => void;
  onSave: () => void;
  readOnly?: boolean;
  equipmentSuggestions?: string[];
}) {
  const equipListId = "exercise-equip-suggestions";
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
          Nombre *
        </label>
        <div
          style={{
            padding: "0 12px",
            height: 44,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            autoFocus={!readOnly}
            value={value.name}
            onChange={(e) => {
              if (readOnly) return;
              setValue((p) => ({ ...p, name: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (readOnly) return;
              if (e.key === "Enter") onSave();
            }}
            placeholder="Ej: Press de banca"
            disabled={readOnly}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: readOnly ? "var(--text-mute)" : "var(--text)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
            Dificultad
          </label>
          <div
            style={{
              padding: "0 12px",
              height: 44,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            <select
              value={value.difficulty ?? ""}
              onChange={(e) => {
                if (readOnly) return;
                setValue((p) => ({ ...p, difficulty: e.target.value || null }));
              }}
              disabled={readOnly}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: value.difficulty ? "var(--text)" : "var(--text-mute)",
              }}
            >
              <option value="">Sin especificar</option>
              {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
            Objetivo
          </label>
          <div
            style={{
              padding: "0 12px",
              height: 44,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            <select
              value={value.objective ?? ""}
              onChange={(e) => {
                if (readOnly) return;
                setValue((p) => ({ ...p, objective: e.target.value || null }));
              }}
              disabled={readOnly}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: value.objective ? "var(--text)" : "var(--text-mute)",
              }}
            >
              <option value="">Sin especificar</option>
              {Object.entries(OBJECTIVE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
          Músculo principal
        </label>
        <div
          style={{
            padding: "0 12px",
            height: 44,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <select
            value={value.primaryMuscle ?? ""}
            onChange={(e) => {
              if (readOnly) return;
              setValue((p) => ({ ...p, primaryMuscle: e.target.value || null }));
            }}
            disabled={readOnly}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: value.primaryMuscle ? "var(--text)" : "var(--text-mute)",
            }}
          >
            <option value="">Sin especificar</option>
            {Object.entries(MUSCLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
          Equipamiento
        </label>
        <div
          style={{
            padding: "0 12px",
            height: 44,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            value={value.equipment ?? ""}
            onChange={(e) => {
              if (readOnly) return;
              setValue((p) => ({ ...p, equipment: e.target.value || null }));
            }}
            placeholder="Ej: Barra, Mancuernas, Máquina…"
            disabled={readOnly}
            list={equipmentSuggestions?.length ? equipListId : undefined}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: readOnly ? "var(--text-mute)" : "var(--text)",
            }}
          />
        </div>
        {!!equipmentSuggestions?.length && (
          <datalist id={equipListId}>
            {equipmentSuggestions.map((eq) => (
              <option key={eq} value={eq} />
            ))}
          </datalist>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
          YouTube (opcional)
        </label>
        <div
          style={{
            padding: "0 12px",
            height: 44,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            value={value.youtubeUrl ?? ""}
            onChange={(e) => {
              if (readOnly) return;
              setValue((p) => ({ ...p, youtubeUrl: e.target.value || null }));
            }}
            placeholder="https://youtube.com/…"
            disabled={readOnly}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: readOnly ? "var(--text-mute)" : "var(--text)",
            }}
          />
        </div>
      </div>
    </>
  );
}
