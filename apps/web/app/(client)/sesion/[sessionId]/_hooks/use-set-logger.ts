"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "../_components/_types";
import { useLoggerEffects } from "./use-logger-effects";
import { useLoggerActions } from "./use-logger-actions";
import { useSaveSheet } from "./use-save-sheet";

export function useSetLogger({
  sessionId,
  currentExIdx,
  session,
  enqueue,
  load,
}: {
  sessionId: string;
  currentExIdx: number;
  session: SessionDetail | null;
  enqueue: (item: { wseId: string; setNumber: number; body: Record<string, string> }) => Promise<void>;
  load: () => void;
}) {
  const { api } = useAuth();

  const [effortMode, setEffortMode] = useState<EffortMode>("RPE");
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [equipmentType, setEquipmentType] = useState<"barra" | "mancuernas" | "maquina" | null>(null);
  const [activeTimerRow, setActiveTimerRow] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerEndsAtMs, setTimerEndsAtMs] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);
  const [restSuggestion, setRestSuggestion] = useState<string | null>(null);
  const [restFromLogger, setRestFromLogger] = useState(false);
  const [lastRefMap, setLastRefMap] = useState<Record<string, LastRef>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [prefillExId, setPrefillExId] = useState<string | null>(null);

  const lastRef = session ? lastRefMap[session.exercises[currentExIdx]?.exercise.id] ?? null : null;

  useLoggerEffects({
    sessionId,
    session,
    currentExIdx,
    loggerOpen,
    sheetRows,
    setSheetRows,
    effortMode,
    lastRef,
    lastRefMap,
    setLastRefMap,
    api,
    activeTimerRow,
    setActiveTimerRow,
    timerSecondsLeft,
    setTimerSecondsLeft,
    timerEndsAtMs,
    setTimerEndsAtMs,
    restSeconds,
    setRestSeconds,
    restFromLogger,
    setRestFromLogger,
    setLoggerOpen,
    prefillExId,
    setPrefillExId,
    setEffortMode,
  });

  const { openLogger, deleteSet } = useLoggerActions({
    sessionId, currentExIdx, session, load, setEquipmentType, sheetRows, setSheetRows, setLoggerOpen, lastRef,
  });

  const saveSheet = useSaveSheet({
    sessionId, currentExIdx, session, enqueue, load, effortMode, equipmentType, sheetRows, setSheetRows,
    setLoggerOpen, setRestSeconds, setRestTotal, setRestFromLogger, setRestSuggestion, setLastSaved, setSheetSaving,
  });

  return {
    effortMode, setEffortMode, loggerOpen, setLoggerOpen, sheetRows, setSheetRows, sheetSaving,
    equipmentType, setEquipmentType, activeTimerRow, setActiveTimerRow, timerSecondsLeft, setTimerSecondsLeft, timerEndsAtMs, setTimerEndsAtMs,
    restSeconds, setRestSeconds, restTotal, restSuggestion, lastRef, lastSaved, openLogger, saveSheet, deleteSet,
  };
}
