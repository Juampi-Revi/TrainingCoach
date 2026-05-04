"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui";
import type { WorkoutBlockSummary } from "@regen/types";
import { blockTypeLabel, BLOCK_COLORS } from "@/lib/constants";

interface BlockRestScreenProps {
  currentBlock: { block: WorkoutBlockSummary } | null;
  nextBlock: { block: WorkoutBlockSummary } | null;
  restSecondsRemaining: number;
  totalBlocks: number;
  completedCount: number;
  onSkip: () => void;
  onStartNext: () => void;
}

export function BlockRestScreen({
  currentBlock,
  nextBlock,
  restSecondsRemaining,
  totalBlocks,
  completedCount,
  onSkip,
  onStartNext,
}: BlockRestScreenProps) {
  // Auto-start next block when rest is over
  useEffect(() => {
    if (restSecondsRemaining <= 0) {
      const t = setTimeout(onStartNext, 500);
      return () => clearTimeout(t);
    }
  }, [restSecondsRemaining, onStartNext]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const nextBlockColor = nextBlock ? BLOCK_COLORS[nextBlock.block.type] : "var(--lime)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 1500,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px 16px 20px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-mute)", letterSpacing: ".12em" }}>
          DESCANSO ENTRE BLOQUES
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 32,
        }}
      >
        {/* Current block completed */}
        {currentBlock && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "16px 24px",
              background: "rgba(215,255,58,.08)",
              border: "1px solid var(--lime)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--lime)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Completado
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {blockTypeLabel(currentBlock.block.type, currentBlock.block.intervalType)}
              {currentBlock.block.label ? ` · ${currentBlock.block.label}` : ""}
            </div>
          </div>
        )}

        {/* Big timer */}
        <div style={{ textAlign: "center" }}>
          <div
            className="ta-mono"
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-.04em",
              lineHeight: 1,
              color: restSecondsRemaining <= 10 ? "var(--lime)" : "var(--text)",
            }}
          >
            {formatTime(restSecondsRemaining)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 8 }}>
            {restSecondsRemaining > 0 ? "Descansando…" : "¡Listo para continuar!"}
          </div>
        </div>

        {/* Next block preview */}
        {nextBlock && (
          <div
            style={{
              width: "100%",
              maxWidth: 320,
              padding: 16,
              background: "var(--bg-1)",
              border: `2px solid ${nextBlockColor}`,
              borderRadius: 12,
            }}
          >
            <div
              className="ta-mono"
              style={{
                fontSize: 9,
                color: nextBlockColor,
                fontWeight: 700,
                letterSpacing: ".12em",
                marginBottom: 6,
              }}
            >
              PRÓXIMO BLOQUE
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {blockTypeLabel(nextBlock.block.type, nextBlock.block.intervalType)}
              {nextBlock.block.label ? ` · ${nextBlock.block.label}` : ""}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-mute)" }}>
              {nextBlock.block.targetMinutes ? `${nextBlock.block.targetMinutes} min` : ""}
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 280 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--text-mute)",
              marginBottom: 6,
            }}
          >
            <span>Progreso</span>
            <span className="ta-mono">
              {completedCount} / {totalBlocks}
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "var(--bg-2)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completedCount / totalBlocks) * 100}%`,
                background: "var(--lime)",
                transition: "width .3s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div
        style={{
          padding: "16px 20px 28px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          onClick={onStartNext}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "var(--lime)",
            color: "#0B0B0C",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="play" size={16} color="#0B0B0C" />
          {restSecondsRemaining > 0 ? "Empezar ahora" : "Continuar"}
        </button>
        {restSecondsRemaining > 5 && (
          <button
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "transparent",
              color: "var(--text-mute)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Saltar descanso
          </button>
        )}
      </div>
    </div>
  );
}
