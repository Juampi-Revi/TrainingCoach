"use client";

import { useCallback, useRef, useState } from "react";

const DEFAULT_MAX = 20;

/**
 * Snapshot / command undo-redo stack (max N entries).
 * Call push() before applying a mutation; undo/redo return the restored value.
 */
export function useHistoryStack<T>(maxEntries = DEFAULT_MAX) {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const push = useCallback(
    (snapshot: T) => {
      pastRef.current = [...pastRef.current, snapshot].slice(-maxEntries);
      futureRef.current = [];
      bump();
    },
    [bump, maxEntries],
  );

  const undo = useCallback(
    (current: T): T | null => {
      if (pastRef.current.length === 0) return null;
      const prev = pastRef.current[pastRef.current.length - 1]!;
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [...futureRef.current, current];
      bump();
      return prev;
    },
    [bump],
  );

  const redo = useCallback(
    (current: T): T | null => {
      if (futureRef.current.length === 0) return null;
      const next = futureRef.current[futureRef.current.length - 1]!;
      futureRef.current = futureRef.current.slice(0, -1);
      pastRef.current = [...pastRef.current, current].slice(-maxEntries);
      bump();
      return next;
    },
    [bump, maxEntries],
  );

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  return {
    push,
    undo,
    redo,
    clear,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
