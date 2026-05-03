"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui";
import type { WorkoutBlockSummary, SessionExercise } from "@regen/types";
import { blockTypeLabel } from "@/lib/constants";
import { TabataRunner } from "./_runners/tabata-runner";
import { EmomRunner } from "./_runners/emom-runner";
import { AmrapRunner } from "./_runners/amrap-runner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlockRunnerProps {
  block: WorkoutBlockSummary;
  exercises: SessionExercise[];
  sessionId: string;
  api: { put: (url: string, body: Record<string, unknown>) => Promise<unknown> };
  onClose: () => void;
  onSaved: () => void;
}

// ─── Shared button style helper ───────────────────────────────────────────────

export function primaryButtonStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 20px",
    background: bg,
    color,
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "-.01em",
  };
}

// ─── Shared Overlay Shell ─────────────────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        zIndex: 1400,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function OverlayHeader({
  block,
  round,
  totalRounds,
  onClose,
}: {
  block: WorkoutBlockSummary;
  round?: number;
  totalRounds?: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "50px 16px 14px",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onClose}
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon name="x" size={14} />
      </button>
      <div style={{ flex: 1 }}>
        <div
          className="ta-mono"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--lime)",
            letterSpacing: ".08em",
          }}
        >
          {blockTypeLabel(block.type)}
          {block.label ? ` · ${block.label}` : ""}
        </div>
        {round !== undefined && totalRounds !== undefined && (
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
            RONDA {round} / {totalRounds}
          </div>
        )}
      </div>
    </div>
  );
}

export function DoneScreen({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(215,255,58,.12)",
          border: "2px solid var(--lime)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="check" size={36} color="var(--lime)" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>¡Bloque completado!</div>
      <div style={{ color: "var(--text-mute)", fontSize: 13 }}>
        Cerrando en 3 segundos…
      </div>
    </div>
  );
}

// ─── Root BlockRunner ─────────────────────────────────────────────────────────

export function BlockRunner(props: BlockRunnerProps) {
  const { block } = props;

  const sharedProps = {
    OverlayHeader,
    DoneScreen,
    primaryButtonStyle,
  };

  return (
    <Overlay>
      {(block.type === "tabata" || block.type === "hiit") && (
        <TabataRunner {...props} {...sharedProps} />
      )}
      {block.type === "emom" && <EmomRunner {...props} {...sharedProps} />}
      {block.type === "amrap" && <AmrapRunner {...props} {...sharedProps} />}
    </Overlay>
  );
}
