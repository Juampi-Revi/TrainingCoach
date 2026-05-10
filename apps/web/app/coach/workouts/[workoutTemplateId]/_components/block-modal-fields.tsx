"use client";

import { Input } from "@/components/ui";
import { blockTypeLabel } from "@/lib/constants";
import type { BlockType, IntervalType } from "@regen/types";
import { BLOCK_TYPES, INTERVAL_PRESETS } from "./block-modal.constants";
import { BlockModalSummary } from "./block-modal-summary";

interface BlockModalFieldsProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  description: string;
  work: string;
  rest: string;
  rounds: string;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  targetZone: string;
  restAfterSeconds: string;
  setBlockType: (t: BlockType) => void;
  setIntervalType: (t: IntervalType | null) => void;
  setLabel: (v: string) => void;
  setDescription: (v: string) => void;
  setWork: (v: string) => void;
  setRest: (v: string) => void;
  setRounds: (v: string) => void;
  setTotal: (v: string) => void;
  setTargetMinutes: (v: string) => void;
  setRestBetweenExercises: (v: string) => void;
  setTargetZone: (v: string) => void;
  setRestAfterSeconds: (v: string) => void;
}

export function BlockModalFields({
  blockType,
  intervalType,
  label,
  description,
  work,
  rest,
  rounds,
  total,
  targetMinutes,
  restBetweenExercises,
  targetZone,
  restAfterSeconds,
  setBlockType,
  setIntervalType,
  setLabel,
  setDescription,
  setWork,
  setRest,
  setRounds,
  setTotal,
  setTargetMinutes,
  setRestBetweenExercises,
  setTargetZone,
  setRestAfterSeconds,
}: BlockModalFieldsProps) {
  const isInterval = blockType === "intervals";
  const isCardio = blockType === "cardio";
  const isWarmup = blockType === "warmup";
  const isCooldown = blockType === "cooldown";
  const isStrength = blockType === "strength";
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const showIntervalFields = isInterval && intervalType;
  const showWorkRest = showIntervalFields && !isEmom && !isAmrap;
  const showRounds = showIntervalFields && !isAmrap;
  const showTotal = showIntervalFields && (isAmrap || isEmom);
  const showUniversalConfig = isWarmup || isStrength || isCooldown;

  const emomRounds = parseInt(rounds);
  const calculatedEmomTotal = !isNaN(emomRounds) && emomRounds > 0 ? emomRounds * 60 : "";

  return (
    <div style={{ padding: 18, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
          Tipo de bloque
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => {
                setBlockType(t);
                if (t === "intervals" && !intervalType) setIntervalType("tabata");
                if (t !== "intervals") setIntervalType(null);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${blockType === t ? "var(--lime)" : "var(--line-2)"}`,
                background: blockType === t ? "rgba(215,255,58,.12)" : "transparent",
                color: blockType === t ? "var(--lime)" : "var(--text-mute)",
              }}
            >
              {blockTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {isInterval && (
        <div>
          <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            Tipo de intervalo
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {INTERVAL_PRESETS.map((p) => {
              const isSel = intervalType === p.intervalType;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setIntervalType(p.intervalType);
                    setWork(p.work);
                    setRest(p.rest);
                    setRounds(p.rounds);
                    setTotal(p.total);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${isSel ? "#FF8E72" : "var(--line-2)"}`,
                    background: isSel ? "rgba(255,142,114,.12)" : "transparent",
                    color: isSel ? "#FF8E72" : "var(--text-mute)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35 }}>
            Estos son presets. Podés ajustar el tiempo y las rondas abajo.
          </div>
        </div>
      )}

      <Input label="Nombre del bloque" placeholder="Ej: Tabata · 4 ejercicios" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Input label="Descripción (opcional)" placeholder="Notas sobre este bloque..." value={description} onChange={(e) => setDescription(e.target.value)} />

      <BlockModalSummary
        blockType={blockType}
        intervalType={intervalType}
        work={work}
        rest={rest}
        rounds={rounds}
        total={isEmom && calculatedEmomTotal ? String(calculatedEmomTotal) : total}
        targetMinutes={targetMinutes}
        restBetweenExercises={restBetweenExercises}
        restAfterSeconds={restAfterSeconds}
      />

      {showIntervalFields && (
        <>
          {isEmom && (
            <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.45 }}>
              En EMOM, el minuto se reinicia en cada ronda. Configurá los ejercicios del bloque como reps o por tiempo (seg) para definir el trabajo por minuto. El descanso es el resto del minuto.
            </div>
          )}

          {showWorkRest && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="Trabajo (seg)" placeholder="20" value={work} onChange={(e) => setWork(e.target.value)} />
              <Input label="Descanso (seg)" placeholder="10" value={rest} onChange={(e) => setRest(e.target.value)} />
            </div>
          )}

          {showRounds && (
            <>
              <Input
                label={isEmom ? "Minutos (rondas)" : "Rondas"}
                placeholder={isEmom ? "10" : "8"}
                value={rounds}
                onChange={(e) => {
                  setRounds(e.target.value);
                  if (isEmom) {
                    const r = parseInt(e.target.value);
                    if (!isNaN(r) && r > 0) setTotal(String(r * 60));
                  }
                }}
              />
              {isEmom && (
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: -10 }}>
                  Cada minuto empieza una nueva serie. El alumno completa el ejercicio y descansa el tiempo restante.
                </div>
              )}
            </>
          )}

          {showTotal && (
            <div style={{ display: "grid", gridTemplateColumns: isEmom ? "1fr 1fr" : "1fr", gap: 10 }}>
              <Input
                label={isEmom ? "Duración total (auto)" : "Duración total (seg)"}
                placeholder="600"
                value={isEmom ? (calculatedEmomTotal || total) : total}
                onChange={(e) => !isEmom && setTotal(e.target.value)}
                disabled={isEmom}
              />
              {isEmom && (
                <Input
                  label="En minutos"
                  value={calculatedEmomTotal ? String(Math.round(Number(calculatedEmomTotal) / 60)) : ""}
                  disabled
                />
              )}
            </div>
          )}

          <Input
            label="Descanso entre ejercicios (seg)"
            placeholder="Ej: 0, 15, 30"
            value={restBetweenExercises}
            onChange={(e) => setRestBetweenExercises(e.target.value)}
          />

          {isAmrap && (
            <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
              AMRAP = As Many Rounds As Possible. El alumno hace tantas rondas como pueda en el tiempo total.
            </div>
          )}
        </>
      )}

      {isCardio && (
        <>
          <Input label="Minutos objetivo" placeholder="20" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
          <Input label="Zona objetivo (opcional)" placeholder="Ej: Zona 2, 70-80% FCm" value={targetZone} onChange={(e) => setTargetZone(e.target.value)} />
        </>
      )}

      {showUniversalConfig && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Tiempo objetivo (min)" placeholder="Ej: 10" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
          <Input label="Descanso entre ejercicios (seg)" placeholder="Ej: 60" value={restBetweenExercises} onChange={(e) => setRestBetweenExercises(e.target.value)} />
        </div>
      )}

      <Input
        label="Descanso después del bloque (seg, opcional)"
        placeholder="Ej: 120"
        value={restAfterSeconds}
        onChange={(e) => setRestAfterSeconds(e.target.value)}
      />
    </div>
  );
}
