"use client";

import { Icon } from "@/components/ui";
import { blockTypeLabel, blockSummary } from "@/lib/constants";
import type { BlockType, IntervalType } from "@regen/types";

interface BlockPreviewProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  description: string;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRestSeconds: string;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  restAfterSeconds: string;
}

function toPosInt(raw: string): number | null {
  const n = parseInt(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function fmtSecs(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

export function BlockPreview({
  blockType,
  intervalType,
  label,
  description,
  prepare,
  work,
  rest,
  rounds,
  setCount,
  setRestSeconds,
  total,
  targetMinutes,
  restBetweenExercises,
  restAfterSeconds,
}: BlockPreviewProps) {
  const isInterval = blockType === "intervals" && !!intervalType;
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const showWorkRest = isInterval && !isEmom && !isAmrap;

  const prepareSecs = toPosInt(prepare);
  const wSecs = toPosInt(work);
  const rSecs = toPosInt(rest);
  const roundsN = toPosInt(rounds);
  const setsN = toPosInt(setCount) ?? 1;
  const setRestSecs = toPosInt(setRestSeconds);
  const restAfterSecs = toPosInt(restAfterSeconds);
  const restBetweenSecs = toPosInt(restBetweenExercises);

  const totalSecs = isInterval
    ? (isEmom
      ? (roundsN ? (prepareSecs ?? 0) + roundsN * 60 : null)
      : isAmrap
        ? (toPosInt(total) ? (prepareSecs ?? 0) + toPosInt(total)! : null)
        : (showWorkRest && roundsN && wSecs && rSecs
          ? (prepareSecs ?? 0) + ((wSecs + rSecs) * roundsN * setsN) + ((setRestSecs ?? 0) * Math.max(0, setsN - 1))
          : null))
    : (toPosInt(targetMinutes) ? toPosInt(targetMinutes)! * 60 : null);

  const blockColor = blockType === "warmup" ? "var(--warn)" : blockType === "cooldown" ? "var(--text-mute)" : blockType === "cardio" ? "var(--text-mute)" : "var(--lime)";

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg-1)", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>
          VISTA DEL ALUMNO
        </div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          Así se ve este bloque en la sesión
        </div>
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Block header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `${blockColor}18`,
            border: `1px solid ${blockColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon
              name={blockType === "warmup" ? "flame" : blockType === "cooldown" ? "moon" : blockType === "cardio" ? "repeat" : blockType === "intervals" ? "timer" : "dumbbell"}
              size={13}
              color={blockColor}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {blockTypeLabel(blockType, intervalType)} {label ? `· ${label}` : ""}
            </div>
            {description && (
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {prepareSecs && prepareSecs > 0 && (
            <PreviewStep color="var(--text-mute)" label="Preparación" value={fmtSecs(prepareSecs)} />
          )}

          {showWorkRest && roundsN && wSecs && rSecs && (
            <>
              <PreviewStep color="var(--lime)" label="Trabajo" value={`${fmtSecs(wSecs)} × ${roundsN} rondas`} />
              <PreviewStep color="var(--text-mute)" label="Descanso" value={`${fmtSecs(rSecs)} entre rondas`} />
              {setsN > 1 && (
                <>
                  <PreviewStep color="var(--warn)" label="Series" value={`${setsN} series`} />
                  {setRestSecs && <PreviewStep color="var(--text-mute)" label="Descanso entre series" value={fmtSecs(setRestSecs)} />}
                </>
              )}
            </>
          )}

          {isEmom && roundsN && (
            <>
              <PreviewStep color="var(--lime)" label="EMOM" value={`${roundsN} minutos`} />
              <PreviewStep color="var(--text-mute)" label="Cada minuto" value="1 ejercicio · reps según target" />
            </>
          )}

          {isAmrap && toPosInt(total) && (
            <>
              <PreviewStep color="var(--lime)" label="AMRAP" value={`${fmtSecs(toPosInt(total))}`} />
              <PreviewStep color="var(--text-mute)" label="Objetivo" value="Tantas rondas como sea posible" />
            </>
          )}

          {(blockType === "cardio" || blockType === "warmup" || blockType === "cooldown" || blockType === "strength") && toPosInt(targetMinutes) && (
            <PreviewStep color="var(--lime)" label="Duración" value={`${toPosInt(targetMinutes)} minutos`} />
          )}

          {restBetweenSecs && restBetweenSecs > 0 && (
            <PreviewStep color="var(--text-mute)" label="Descanso entre ejercicios" value={fmtSecs(restBetweenSecs)} />
          )}

          {restAfterSecs && restAfterSecs > 0 && (
            <PreviewStep color="var(--text-mute)" label="Descanso después del bloque" value={fmtSecs(restAfterSecs)} />
          )}
        </div>

        {/* Total */}
        {totalSecs && totalSecs > 0 && (
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line-2)" }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>
              DURACIÓN TOTAL DEL BLOQUE
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: "var(--lime)" }}>
              {fmtSecs(totalSecs)}
            </div>
            {restAfterSecs && restAfterSecs > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                + {fmtSecs(restAfterSecs)} de descanso antes del siguiente bloque
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewStep({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: "var(--text-mute)" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginLeft: "auto" }}>
        {value}
      </div>
    </div>
  );
}