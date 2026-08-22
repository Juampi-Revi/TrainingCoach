"use client";

import { Button, Icon } from "@/components/ui";
import { SessionHeader } from "./session-header";
import { EnduranceStepsCard } from "@/components/features/training/endurance-steps-card";
import { fmtDuration } from "@/lib/constants";
import type { SessionDetail } from "@regen/types";

interface SessionEnduranceViewProps {
  session: SessionDetail;
  workoutStartedAtMs: number | null;
  nowMs: number;
  completing: boolean;
  onComplete: () => void;
  onExit: () => void;
}

export function SessionEnduranceView({
  session,
  workoutStartedAtMs,
  nowMs,
  completing,
  onComplete,
  onExit,
}: SessionEnduranceViewProps) {
  const sessionEnduranceBlocks = session.blocks.filter((block) => (block.steps?.length ?? 0) > 0);
  const workoutElapsedMs = workoutStartedAtMs != null ? Math.max(0, nowMs - workoutStartedAtMs) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>
      <SessionHeader
        exNum={1}
        exTotal={sessionEnduranceBlocks.length}
        title={session.workoutTemplate?.title ?? "Sesión running"}
        subtitle="Seguí las pasadas y vinculá la actividad de Strava"
        time={fmtDuration(workoutElapsedMs)}
        onExit={onExit}
      />
      {sessionEnduranceBlocks.map((block) => (
        <div key={block.id} style={{ marginTop: 10 }}>
          <EnduranceStepsCard title={block.label ? `Pasadas · ${block.label}` : "Pasadas"} steps={block.steps ?? []} />
        </div>
      ))}
      <div style={{ padding: "16px", display: "flex", gap: 10 }}>
        <Button variant="outline" block onClick={onExit}>
          Volver
        </Button>
        <Button block disabled={completing} onClick={onComplete}>
          {completing ? "Cerrando…" : "Completar sesión"}
        </Button>
      </div>
    </div>
  );
}