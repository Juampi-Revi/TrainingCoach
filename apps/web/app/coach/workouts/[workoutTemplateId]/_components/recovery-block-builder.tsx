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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
        Movilidad, estiramientos, respiración o vuelta a la calma. El alumno no registra series ni peso.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input
          label="¿Cuántos minutos aproximadamente?"
          placeholder="Ej: 10"
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
    </div>
  );
}