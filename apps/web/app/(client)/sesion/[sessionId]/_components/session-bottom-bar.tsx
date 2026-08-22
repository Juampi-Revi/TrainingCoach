"use client";

import { Button } from "@/components/ui";
import type { SessionExercise } from "@regen/types";

interface SessionBottomBarProps {
  keyboardOffset: number;
  warmupExists: boolean;
  warmupDone: boolean;
  loggerOpen: boolean;
  ex: SessionExercise | undefined;
  completedExs: number;
  workExercises: SessionExercise[];
  completing: boolean;
  onOpenLogger: (ex: SessionExercise) => void;
  onComplete: () => void;
  /** Called when user wants to finish with pending sets — parent should confirm. */
  onRequestEarlyFinish: () => void;
  onReset: () => void;
  onStartBlock: (blockId: string) => void;
}

export function SessionBottomBar({
  keyboardOffset,
  warmupExists,
  warmupDone,
  loggerOpen,
  ex,
  completedExs,
  workExercises,
  completing,
  onOpenLogger,
  onComplete,
  onRequestEarlyFinish,
  onReset,
  onStartBlock,
}: SessionBottomBarProps) {
  if (warmupExists && !warmupDone) return null;
  if (loggerOpen) return null;

  const allDone = workExercises.length > 0 && completedExs === workExercises.length;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: keyboardOffset,
        padding: "8px 16px calc(12px + env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, var(--bg) 75%, transparent)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
            color: "var(--danger)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Reiniciar sesión
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {allDone ? (
          <Button size="lg" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={onComplete}>
            {completing ? "Completando…" : "Finalizar sesión"}
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              block
              icon={ex?.block?.type === "intervals" ? "timer" : ex?.target?.durationSeconds && !ex.target?.sets ? "timer" : "book"}
              style={{ fontSize: 15, minHeight: 52 }}
              disabled={!ex}
              onClick={() => {
                if (!ex) return;
                if (ex.block?.type === "intervals") {
                  onStartBlock(ex.block.id);
                } else {
                  onOpenLogger(ex);
                }
              }}
            >
              {ex?.block?.type === "intervals"
                ? "Iniciar bloque"
                : ex?.target?.durationSeconds && !ex.target?.sets
                  ? "Registrar tiempo"
                  : "Registrar series"}
            </Button>
            <button
              type="button"
              disabled={completing}
              onClick={onRequestEarlyFinish}
              style={{
                background: "none",
                border: "none",
                cursor: completing ? "default" : "pointer",
                padding: "6px 0",
                color: "var(--text-mute)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {completing ? "Completando…" : "Terminar incompleto…"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
