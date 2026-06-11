"use client";

import { Input } from "@/components/ui";
import type { IntervalExerciseStrategy, IntervalType } from "@regen/types";
import { INTERVAL_PRESETS } from "./block-modal.constants";
import { EmomBlockBuilder } from "./emom-block-builder";
import { AmrapBlockBuilder } from "./amrap-block-builder";

interface IntervalBlockBuilderProps {
  intervalType: IntervalType | null;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRestSeconds: string;
  intervalExerciseStrategy: IntervalExerciseStrategy;
  total: string;
  restBetweenExercises: string;
  restAfterSeconds: string;
  setIntervalType: (next: IntervalType | null) => void;
  setPrepare: (next: string) => void;
  setWork: (next: string) => void;
  setRest: (next: string) => void;
  setRounds: (next: string) => void;
  setSetCount: (next: string) => void;
  setSetRestSeconds: (next: string) => void;
  setIntervalExerciseStrategy: (next: IntervalExerciseStrategy) => void;
  setTotal: (next: string) => void;
  setRestBetweenExercises: (next: string) => void;
  setRestAfterSeconds: (next: string) => void;
}

function RecipeHint({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, background: "var(--bg-2)" }}>
      <div className="ta-mono" style={{ fontSize: 10, color: "var(--accent-text)", fontWeight: 700, letterSpacing: ".08em" }}>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-mute)", lineHeight: 1.45 }}>
        {body}
      </div>
    </div>
  );
}

export function IntervalBlockBuilder({
  intervalType,
  prepare,
  work,
  rest,
  rounds,
  setCount,
  setRestSeconds,
  intervalExerciseStrategy,
  total,
  restBetweenExercises,
  restAfterSeconds,
  setIntervalType,
  setPrepare,
  setWork,
  setRest,
  setRounds,
  setSetCount,
  setSetRestSeconds,
  setIntervalExerciseStrategy,
  setTotal,
  setRestBetweenExercises,
  setRestAfterSeconds,
}: IntervalBlockBuilderProps) {
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const isTabataOrHiit = intervalType === "tabata" || intervalType === "hiit";

  return (
    <>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Modo de timer
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {INTERVAL_PRESETS.map((preset) => {
            const active = intervalType === preset.intervalType;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setIntervalType(preset.intervalType);
                  setPrepare(preset.prepare);
                  setWork(preset.work);
                  setRest(preset.rest);
                  setRounds(preset.rounds);
                  setSetCount(preset.setCount);
                  setSetRestSeconds(preset.setRest);
                  setTotal(preset.total);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${active ? "var(--lime)" : "var(--line-2)"}`,
                  background: active ? "rgba(215,255,58,.1)" : "transparent",
                  color: active ? "var(--lime)" : "var(--text-mute)",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <RecipeHint
        title="CONFIGURACIÓN TIPO RECETA"
        body={
          isEmom
            ? "Definí cuántos minutos dura el bloque. El trabajo de cada minuto lo marcan los ejercicios del bloque."
            : isAmrap
              ? "Definí una duración total. El alumno repite la ronda de ejercicios durante todo el tiempo."
              : "Configurá preparación, trabajo, descanso, rondas y series. Es el formato más natural para Tabata o HIIT."
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Preparación (seg)" placeholder="10" value={prepare} onChange={(e) => setPrepare(e.target.value)} />
        <Input label="Descanso final (seg)" placeholder="120" value={restAfterSeconds} onChange={(e) => setRestAfterSeconds(e.target.value)} />
      </div>

      {!isEmom && !isAmrap && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Input label="Trabajo (seg)" placeholder="20" value={work} onChange={(e) => setWork(e.target.value)} />
            <Input label="Descanso (seg)" placeholder="10" value={rest} onChange={(e) => setRest(e.target.value)} />
            <Input label="Rondas" placeholder="8" value={rounds} onChange={(e) => setRounds(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Series / tabatas" placeholder="1" value={setCount} onChange={(e) => setSetCount(e.target.value)} />
            <Input label="Descanso entre series (seg)" placeholder="60" value={setRestSeconds} onChange={(e) => setSetRestSeconds(e.target.value)} />
          </div>
        </>
      )}

      {isEmom && (
        <EmomBlockBuilder
          prepare={prepare}
          minutes={rounds}
          restBetweenExercises={restBetweenExercises}
          setPrepare={setPrepare}
          setMinutes={setRounds}
          setRestBetweenExercises={setRestBetweenExercises}
        />
      )}

      {isAmrap && (
        <AmrapBlockBuilder
          prepare={prepare}
          totalSeconds={total}
          restBetweenExercises={restBetweenExercises}
          setPrepare={setPrepare}
          setTotalSeconds={setTotal}
          setRestBetweenExercises={setRestBetweenExercises}
        />
      )}

      {!isEmom && !isAmrap && (
        <>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              Asignación de ejercicios
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "repeat_single", label: "Repetir 1 ejercicio" },
                { id: "rotate_per_round", label: "Rotar por ronda" },
                { id: "rotate_per_set", label: "Rotar por serie" },
                { id: "custom", label: "Custom" },
              ].map((opt) => {
                const active = intervalExerciseStrategy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIntervalExerciseStrategy(opt.id as IntervalExerciseStrategy)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: `1px solid ${active ? "var(--lime)" : "var(--line-2)"}`,
                      background: active ? "rgba(215,255,58,.08)" : "transparent",
                      color: active ? "var(--lime)" : "var(--text-mute)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.45 }}>
              {isTabataOrHiit
                ? "Tip: el orden de los ejercicios del bloque define la rotación. Podés reordenarlos desde la lista del entrenamiento."
                : "Disponible solo para Tabata/HIIT."}
            </div>
          </div>

          <Input label="Descanso entre ejercicios (seg, opcional)" placeholder="0" value={restBetweenExercises} onChange={(e) => setRestBetweenExercises(e.target.value)} />
        </>
      )}
    </>
  );
}
