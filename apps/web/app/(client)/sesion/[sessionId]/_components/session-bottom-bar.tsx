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
  onReset,
  onStartBlock,
}: SessionBottomBarProps) {
  if (warmupExists && !warmupDone) return null;
  if (loggerOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: keyboardOffset,
        padding: "4px 16px 28px",
        background: "linear-gradient(to top, var(--bg) 70%, transparent)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            color: "var(--danger)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Reiniciar
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {completedExs === workExercises.length ? (
          <Button size="xl" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={onComplete}>
            {completing ? "Completando…" : "Finalizar sesión"}
          </Button>
        ) : (
          <>
            <Button
              size="xl"
              block
              icon={ex?.block?.type === "intervals" ? "timer" : "book"}
              style={{ fontSize: 16 }}
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
              {ex?.block?.type === "intervals" ? "Iniciar bloque" : "Registrar series"}
            </Button>
            <Button
              size="lg"
              block
              variant="secondary"
              icon="check"
              disabled={completing}
              onClick={onComplete}
            >
              {completing ? "Completando…" : "Terminar entrenamiento"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
