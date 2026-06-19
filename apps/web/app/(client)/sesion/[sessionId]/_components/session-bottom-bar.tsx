"use client";

import { Button, Icon } from "@/components/ui";
import type { SessionExercise } from "@regen/types";

interface SessionBottomBarProps {
  keyboardOffset: number;
  warmupExists: boolean;
  warmupDone: boolean;
  loggerOpen: boolean;
  ex: SessionExercise | undefined;
  prevRealIdx: number | null;
  nextRealIdx: number | null;
  completedExs: number;
  workExercises: SessionExercise[];
  completing: boolean;
  onPrev: () => void;
  onNext: () => void;
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
  prevRealIdx,
  nextRealIdx,
  completedExs,
  workExercises,
  completing,
  onPrev,
  onNext,
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
      <div style={{ display: "flex", gap: 8 }}>
        {prevRealIdx != null && prevRealIdx >= 0 && (
          <button
            onClick={onPrev}
            style={{
              width: 56,
              height: 64,
              borderRadius: 14,
              border: "1px solid var(--line-2)",
              background: "var(--bg-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text)",
              flexShrink: 0,
            }}
          >
            <Icon name="chevL" size={20} />
          </button>
        )}
        {completedExs === workExercises.length ? (
          <Button size="xl" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={onComplete}>
            {completing ? "Completando…" : "Finalizar sesión"}
          </Button>
        ) : (
          <>
            {nextRealIdx != null && nextRealIdx >= 0 && (
              <button
                onClick={onNext}
                style={{
                  width: 56,
                  height: 64,
                  borderRadius: 14,
                  border: "1px solid var(--line-2)",
                  background: "var(--bg-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text)",
                  flexShrink: 0,
                }}
              >
                <Icon name="chevR" size={20} />
              </button>
            )}
            <Button
              size="xl"
              icon={ex?.block?.type === "intervals" ? "timer" : "book"}
              style={{ flex: 1, fontSize: 16 }}
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
            <button
              onClick={onComplete}
              disabled={completing}
              style={{
                width: 56,
                height: 64,
                borderRadius: 14,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)",
                cursor: completing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text)",
                flexShrink: 0,
                opacity: completing ? 0.6 : 1,
              }}
            >
              <Icon name="check" size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}