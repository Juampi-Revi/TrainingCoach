"use client";

import { Button } from "@/components/ui";
import { SessionHeader } from "./session-header";
import { EnduranceStepsCard } from "@/components/features/training/endurance-steps-card";
import { fmtDuration } from "@/lib/constants";
import type { SessionDetail } from "@regen/types";
import { StravaSessionImport } from "./strava-session-import";
import { EnduranceManualLog } from "./endurance-manual-log";

interface SessionEnduranceViewProps {
  session: SessionDetail;
  workoutStartedAtMs: number | null;
  nowMs: number;
  completing: boolean;
  onComplete: (notes?: string) => void;
  onExit: () => void;
  onReload: () => void;
}

export function SessionEnduranceView({
  session,
  workoutStartedAtMs,
  nowMs,
  completing,
  onComplete,
  onExit,
  onReload,
}: SessionEnduranceViewProps) {
  const sessionEnduranceBlocks = session.blocks.filter((block) => (block.steps?.length ?? 0) > 0);
  const workoutElapsedMs = workoutStartedAtMs != null ? Math.max(0, nowMs - workoutStartedAtMs) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>
      <SessionHeader
        exNum={1}
        exTotal={sessionEnduranceBlocks.length}
        title={session.workoutTemplate?.title ?? "Sesión running"}
        subtitle="Seguí las pasadas. Strava es opcional."
        time={fmtDuration(workoutElapsedMs)}
        onExit={onExit}
      />
      {sessionEnduranceBlocks.map((block) => (
        <div key={block.id} style={{ marginTop: 10 }}>
          <EnduranceStepsCard title={block.label ? `Pasadas · ${block.label}` : "Pasadas"} steps={block.steps ?? []} />
        </div>
      ))}
      <StravaSessionImport
        sessionId={session.id}
        activities={session.activities ?? []}
        plannedBlocks={sessionEnduranceBlocks}
        onLinked={onReload}
      />
      <EnduranceManualLog
        elapsedSeconds={Math.round(workoutElapsedMs / 1000)}
        saving={completing}
        onSave={({ km, minutes, notes }) => {
          const lines = [
            "tipo: endurance",
            km ? `distancia: ${km} km` : null,
            minutes ? `tiempo: ${minutes} min` : null,
            notes || null,
          ].filter(Boolean);
          onComplete(lines.join("\n"));
        }}
      />
      <div style={{ padding: "16px", display: "flex", gap: 10 }}>
        <Button variant="outline" block onClick={onExit}>
          Volver
        </Button>
        <Button block disabled={completing} onClick={() => onComplete()}>
          {completing ? "Cerrando…" : "Completar sin datos"}
        </Button>
      </div>
    </div>
  );
}
