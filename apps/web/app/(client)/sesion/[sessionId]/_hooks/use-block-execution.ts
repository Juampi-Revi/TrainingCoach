"use client";

import { useState, useMemo, useCallback } from "react";
import type { SessionExercise, WorkoutBlockSummary } from "@regen/types";

export interface BlockExecutionState {
  currentBlockIndex: number;
  isRestingBetweenBlocks: boolean;
  restSecondsRemaining: number;
  completedBlocks: string[];
}

export function useBlockExecution(exercises: SessionExercise[]) {
  // Group exercises by block
  const blocks = useMemo(() => {
    const blockMap = new Map<string, { block: WorkoutBlockSummary; exercises: SessionExercise[] }>();
    
    for (const ex of exercises) {
      const blockId = ex.block.id;
      if (!blockMap.has(blockId)) {
        blockMap.set(blockId, { block: ex.block, exercises: [] });
      }
      blockMap.get(blockId)!.exercises.push(ex);
    }
    
    // Sort blocks by sortOrder and return
    return Array.from(blockMap.values())
      .sort((a, b) => a.block.sortOrder - b.block.sortOrder);
  }, [exercises]);

  // State
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;
  const hasMoreBlocks = currentBlockIndex < blocks.length - 1;
  const nextBlock = hasMoreBlocks ? blocks[currentBlockIndex + 1] : null;

  // Calculate total progress
  const totalBlocks = blocks.length;
  const completedCount = completedBlocks.size;
  const progress = totalBlocks > 0 ? (completedCount / totalBlocks) * 100 : 0;

  const startRestBetweenBlocks = useCallback((restSeconds: number) => {
    setRestSecondsRemaining(restSeconds);
    setIsResting(true);
  }, []);

  const tickRest = useCallback(() => {
    setRestSecondsRemaining((prev) => {
      if (prev <= 1) {
        setIsResting(false);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const completeCurrentBlock = useCallback(() => {
    if (!currentBlock) return;
    
    setCompletedBlocks((prev) => {
      const next = new Set(prev);
      next.add(currentBlock.block.id);
      return next;
    });

    const restAfter = currentBlock.block.restAfterSeconds;
    if (restAfter && restAfter > 0 && hasMoreBlocks) {
      startRestBetweenBlocks(restAfter);
    } else if (hasMoreBlocks) {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  }, [currentBlock, hasMoreBlocks, startRestBetweenBlocks]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestSecondsRemaining(0);
    if (hasMoreBlocks) {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  }, [hasMoreBlocks]);

  const startNextBlock = useCallback(() => {
    setIsResting(false);
    setRestSecondsRemaining(0);
    if (hasMoreBlocks) {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  }, [hasMoreBlocks]);

  const goToBlock = useCallback((index: number) => {
    if (index >= 0 && index < blocks.length) {
      setCurrentBlockIndex(index);
      setIsResting(false);
    }
  }, [blocks.length]);

  return {
    blocks,
    currentBlock,
    currentBlockIndex,
    nextBlock,
    isLastBlock,
    hasMoreBlocks,
    isResting,
    restSecondsRemaining,
    completedCount,
    totalBlocks,
    progress,
    completeCurrentBlock,
    skipRest,
    startNextBlock,
    tickRest,
    goToBlock,
  };
}
