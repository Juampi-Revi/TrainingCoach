"use client";

import { Input } from "@/components/ui";
import type { IntervalExerciseStrategy, IntervalType } from "@regen/types";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* EMOM */}
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

      {/* AMRAP */}
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

      {/* Tabata / HIIT */}
      {!isEmom && !isAmrap && (
        <>
          <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
            El alumno trabaja durante X segundos, descansa Y segundos, y repite Z rondas.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Input
              label="Segundos de trabajo"
              placeholder="Ej: 20"
              value={work}
              onChange={(e) => setWork(e.target.value)}
            />
            <Input
              label="Segundos de descanso"
              placeholder="Ej: 10"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
            />
            <Input
              label="Rondas por serie"
              placeholder="Ej: 8"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input
              label="¿Cuántas series?"
              placeholder="Ej: 3"
              value={setCount}
              onChange={(e) => setSetCount(e.target.value)}
            />
            <Input
              label="Descanso entre series (seg)"
              placeholder="Ej: 60"
              value={setRestSeconds}
              onChange={(e) => setSetRestSeconds(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input
              label="Segundos de preparación antes de empezar"
              placeholder="Ej: 10"
              value={prepare}
              onChange={(e) => setPrepare(e.target.value)}
            />
            <Input
              label="Descanso entre ejercicios (seg, opcional)"
              placeholder="0"
              value={restBetweenExercises}
              onChange={(e) => setRestBetweenExercises(e.target.value)}
            />
          </div>

          {/* Exercise assignment for Tabata/HIIT */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              ¿Cómo se alternan los ejercicios?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "repeat_single", label: "Repetir el mismo" },
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

            {/* Ejemplo visual según la estrategia seleccionada */}
            <div style={{ marginTop: 10, border: "1px solid var(--line-2)", borderRadius: 10, padding: 12, background: "var(--bg-2)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-mute)", letterSpacing: ".08em", marginBottom: 6, textTransform: "uppercase" }}>
                Ejemplo con 3 ejercicios y 8 rondas:
              </div>
              {intervalExerciseStrategy === "repeat_single" && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                  <div>• Ejercicio 1: 8 rondas</div>
                  <div>• Ejercicio 2: 8 rondas</div>
                  <div>• Ejercicio 3: 8 rondas</div>
                  <div style={{ marginTop: 4, color: "var(--text-dim)", fontStyle: "italic" }}>
                    Cada ejercicio se repite completo. Total: 24 rondas.
                  </div>
                </div>
              )}
              {intervalExerciseStrategy === "rotate_per_round" && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                  <div>• Ronda 1: Ejercicio 1</div>
                  <div>• Ronda 2: Ejercicio 2</div>
                  <div>• Ronda 3: Ejercicio 3</div>
                  <div>• Ronda 4: Ejercicio 1</div>
                  <div>• ...y así sucesivamente</div>
                  <div style={{ marginTop: 4, color: "var(--text-dim)", fontStyle: "italic" }}>
                    Cambia cada ronda. Los 3 ejercicios se mezclan dentro de las 8 rondas.
                  </div>
                </div>
              )}
              {intervalExerciseStrategy === "rotate_per_set" && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                  <div>• Serie 1: Ejercicio 1 (8 rondas)</div>
                  <div>• Serie 2: Ejercicio 2 (8 rondas)</div>
                  <div>• Serie 3: Ejercicio 3 (8 rondas)</div>
                  <div style={{ marginTop: 4, color: "var(--text-dim)", fontStyle: "italic" }}>
                    Cada ejercicio se hace completo antes de pasar al siguiente. Total: 3 series.
                  </div>
                </div>
              )}
              {intervalExerciseStrategy === "custom" && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                  <div style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
                    El orden de los ejercicios lo definís vos manualmente en el entrenamiento.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}