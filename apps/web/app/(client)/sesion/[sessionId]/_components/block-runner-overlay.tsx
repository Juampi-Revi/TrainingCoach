"use client";

import { BlockRunner } from "../block-runner";
import type { WorkoutBlockSummary, SessionExercise } from "@regen/types";

interface BlockRunnerOverlayProps {
  blockRunnerOpen: boolean;
  currentBlockId: string | null;
  blocks: Array<{ block: WorkoutBlockSummary; exercises: SessionExercise[] }>;
  currentBlock: { block: WorkoutBlockSummary; exercises: SessionExercise[] } | null;
  sessionId: string;
  api: { put: (url: string, body: Record<string, unknown>) => Promise<unknown> };
  onClose: () => void;
  onSaved: () => void;
}

export function BlockRunnerOverlay({
  blockRunnerOpen,
  currentBlockId,
  blocks,
  currentBlock,
  sessionId,
  api,
  onClose,
  onSaved,
}: BlockRunnerOverlayProps) {
  if (!blockRunnerOpen) return null;

  const blockToRun = currentBlockId
    ? blocks.find((b) => b.block.id === currentBlockId)
    : currentBlock;

  if (!blockToRun) return null;

  return (
    <BlockRunner
      block={blockToRun.block}
      exercises={blockToRun.exercises}
      sessionId={sessionId}
      api={api}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}