"use client";

import { Input } from "@/components/ui";

export function RecoveryBlockBuilder({
  targetMinutes,
  restBetweenExercises,
  setTargetMinutes,
  setRestBetweenExercises,
}: {
  targetMinutes: string;
  restBetweenExercises: string;
  setTargetMinutes: (next: string) => void;
  setRestBetweenExercises: (next: string) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.45 }}>
        Usalo para movilidad, estiramientos, respiración o vuelta a la calma. Lo importante es que el alumno entienda la intención del bloque.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input
          label="Tiempo objetivo (min)"
          placeholder="10"
          value={targetMinutes}
          onChange={(e) => setTargetMinutes(e.target.value)}
        />
        <Input
          label="Descanso entre ejercicios (seg, opcional)"
          placeholder="30"
          value={restBetweenExercises}
          onChange={(e) => setRestBetweenExercises(e.target.value)}
        />
      </div>
    </>
  );
}
