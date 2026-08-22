"use client";

import { ConfirmModal } from "@/components/ui";
import type { SessionDetail, SessionExercise, WorkoutBlockSummary } from "@regen/types";
import { ExercisePicker } from "./exercise-picker";
import { MediaLightbox } from "./media-lightbox";
import { SwapSheet } from "./swap-sheet";
import { RestTimerOverlay } from "./rest-timer-overlay";
import { WarmupOverlay } from "./warmup-overlay";
import { LoggerSheet } from "./logger-sheet";
import { BlockRestScreen } from "./block-rest-screen";
import { ResetModal } from "./reset-modal";
import { BlockRunnerOverlay } from "./block-runner-overlay";
import { PreSelectSheet } from "./pre-select-sheet";
import type { EffortMode, SheetRow, LastRef } from "./_types";

type BlockBucket = { block: WorkoutBlockSummary; exercises: SessionExercise[] };

export function SessionOverlays({
  session,
  sessionId,
  api,
  load,
  setSession,
  setCurrentExIdx,
  loggerOpen,
  setLoggerOpen,
  ex,
  sheetRows,
  setSheetRows,
  effortMode,
  setEffortMode,
  equipmentType,
  setEquipmentType,
  activeTimerRow,
  setActiveTimerRow,
  timerSecondsLeft,
  setTimerSecondsLeft,
  timerEndsAtMs,
  setTimerEndsAtMs,
  lastRef,
  sheetSaving,
  saveSheet,
  deleteSet,
  warmupExists,
  warmupDone,
  warmupElapsedMs,
  warmupTargetMs,
  warmupTimer,
  toggleWarmup,
  resetWarmup,
  finishWarmup,
  blockRunnerOpen,
  setBlockRunnerOpen,
  currentBlockId,
  setCurrentBlockId,
  blocks,
  currentBlock,
  nextBlock,
  isResting,
  restSecondsRemaining,
  totalBlocks,
  completedCount,
  skipRest,
  startNextBlock,
  restSeconds,
  restTotal,
  restSuggestion,
  setRestSeconds,
  nextEx,
  showPicker,
  setShowPicker,
  mediaOpen,
  setMediaOpen,
  swapOpen,
  setSwapOpen,
  showReset,
  setShowReset,
  resetting,
  onResetConfirm,
  showEarlyFinish,
  setShowEarlyFinish,
  onEarlyFinishConfirm,
  preSelectExIdx,
  setPreSelectExIdx,
  confirmGoToEx,
}: {
  session: SessionDetail;
  sessionId: string;
  api: {
    put: (url: string, body: Record<string, unknown>) => Promise<unknown>;
    patch: (url: string, body?: Record<string, unknown>) => Promise<unknown>;
  };
  load: () => void;
  setSession: React.Dispatch<React.SetStateAction<SessionDetail | null>>;
  setCurrentExIdx: (i: number) => void;
  loggerOpen: boolean;
  setLoggerOpen: (v: boolean) => void;
  ex: SessionExercise | undefined;
  sheetRows: SheetRow[];
  setSheetRows: React.Dispatch<React.SetStateAction<SheetRow[]>>;
  effortMode: EffortMode;
  setEffortMode: React.Dispatch<React.SetStateAction<EffortMode>>;
  equipmentType: "barra" | "mancuernas" | "maquina" | null;
  setEquipmentType: React.Dispatch<React.SetStateAction<"barra" | "mancuernas" | "maquina" | null>>;
  activeTimerRow: number | null;
  setActiveTimerRow: React.Dispatch<React.SetStateAction<number | null>>;
  timerSecondsLeft: number;
  setTimerSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  timerEndsAtMs: number | null;
  setTimerEndsAtMs: React.Dispatch<React.SetStateAction<number | null>>;
  lastRef: LastRef | null;
  sheetSaving: boolean;
  saveSheet: (opts?: { startRest?: boolean; rows?: SheetRow[] }) => Promise<void>;
  deleteSet: (setNumber: number) => Promise<void>;
  warmupExists: boolean;
  warmupDone: boolean;
  warmupElapsedMs: number;
  warmupTargetMs: number | null;
  warmupTimer: { runningSince: number | null };
  toggleWarmup: () => void;
  resetWarmup: () => void;
  finishWarmup: () => void;
  blockRunnerOpen: boolean;
  setBlockRunnerOpen: (v: boolean) => void;
  currentBlockId: string | null;
  setCurrentBlockId: (v: string | null) => void;
  blocks: BlockBucket[];
  currentBlock: BlockBucket | null;
  nextBlock: BlockBucket | null;
  isResting: boolean;
  restSecondsRemaining: number;
  totalBlocks: number;
  completedCount: number;
  skipRest: () => void;
  startNextBlock: () => void;
  restSeconds: number | null;
  restTotal: number;
  restSuggestion: string | null;
  setRestSeconds: React.Dispatch<React.SetStateAction<number | null>>;
  nextEx: SessionExercise | null;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  mediaOpen: boolean;
  setMediaOpen: (v: boolean) => void;
  swapOpen: boolean;
  setSwapOpen: (v: boolean) => void;
  showReset: boolean;
  setShowReset: (v: boolean) => void;
  resetting: boolean;
  onResetConfirm: () => void;
  showEarlyFinish: boolean;
  setShowEarlyFinish: (v: boolean) => void;
  onEarlyFinishConfirm: () => void;
  preSelectExIdx: number | null;
  setPreSelectExIdx: (v: number | null) => void;
  confirmGoToEx: (i: number) => void;
}) {
  return (
    <>
      {loggerOpen && ex && (
        <LoggerSheet
          ex={ex} sessionId={sessionId}
          sheetRows={sheetRows} setSheetRows={setSheetRows}
          effortMode={effortMode} setEffortMode={setEffortMode}
          equipmentType={equipmentType} setEquipmentType={setEquipmentType}
          activeTimerRow={activeTimerRow} setActiveTimerRow={setActiveTimerRow}
          timerSecondsLeft={timerSecondsLeft} setTimerSecondsLeft={setTimerSecondsLeft}
          timerEndsAtMs={timerEndsAtMs} setTimerEndsAtMs={setTimerEndsAtMs}
          lastRef={lastRef} sheetSaving={sheetSaving}
          saveSheet={saveSheet} deleteSet={deleteSet}
          onClose={() => setLoggerOpen(false)}
        />
      )}

      {warmupExists && !warmupDone && (
        <WarmupOverlay
          elapsedMs={warmupElapsedMs} targetMs={warmupTargetMs}
          exercises={session.exercises.filter((e) => e.block?.type === "warmup")}
          running={warmupTimer.runningSince != null}
          onToggle={toggleWarmup} onReset={resetWarmup} onDone={finishWarmup}
          onSkip={finishWarmup}
        />
      )}

      <BlockRunnerOverlay
        blockRunnerOpen={blockRunnerOpen}
        currentBlockId={currentBlockId}
        blocks={blocks}
        currentBlock={currentBlock}
        sessionId={sessionId}
        api={api}
        onClose={() => {
          setBlockRunnerOpen(false);
          setCurrentBlockId(null);
          load();
        }}
        onSaved={load}
      />

      {isResting && (
        <BlockRestScreen
          currentBlock={currentBlock}
          nextBlock={nextBlock}
          restSecondsRemaining={restSecondsRemaining}
          totalBlocks={totalBlocks}
          completedCount={completedCount}
          onSkip={skipRest}
          onStartNext={startNextBlock}
        />
      )}

      {restSeconds != null && restSeconds > 0 && (
        <RestTimerOverlay
          seconds={restSeconds} total={restTotal} nextEx={nextEx}
          suggestion={restSuggestion}
          onSkip={() => setRestSeconds(null)}
          onAdjust={(delta) => setRestSeconds((s) => (s != null ? Math.max(1, s + delta) : null))}
        />
      )}

      {showPicker && (
        <ExercisePicker sessionId={sessionId}
          onAdd={(wse) => {
            setSession((prev) => prev ? { ...prev, exercises: [...prev.exercises, wse] } : prev);
            setCurrentExIdx(session.exercises.length);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {mediaOpen && ex && ex.media.length > 0 && (
        <MediaLightbox
          media={ex.media.map((m) => ({ ...m, mediaType: m.mediaType as "image" | "video" }))}
          exerciseName={ex.exercise.name}
          onClose={() => setMediaOpen(false)}
        />
      )}
      {swapOpen && ex && <SwapSheet ex={ex} sessionId={sessionId} onSwapped={() => load()} onClose={() => setSwapOpen(false)} />}

      {showReset && (
        <ResetModal
          resetting={resetting}
          onCancel={() => setShowReset(false)}
          onConfirm={() => { setShowReset(false); onResetConfirm(); }}
        />
      )}

      {showEarlyFinish && (
        <ConfirmModal
          message="Todavía hay series pendientes. ¿Terminar la sesión incompleta?"
          confirmLabel="Terminar incompleto"
          cancelLabel="Seguir entrenando"
          destructive
          onCancel={() => setShowEarlyFinish(false)}
          onConfirm={() => {
            setShowEarlyFinish(false);
            onEarlyFinishConfirm();
          }}
        />
      )}

      {preSelectExIdx !== null && session.exercises[preSelectExIdx] && (
        <PreSelectSheet
          target={session.exercises[preSelectExIdx]!}
          onConfirm={() => confirmGoToEx(preSelectExIdx)}
          onSwap={async (exerciseId) => {
            const target = session.exercises[preSelectExIdx]!;
            setPreSelectExIdx(null);
            await api.patch(`/client/sessions/${sessionId}/exercises/${target.id}`, { swapExerciseId: exerciseId });
            await load();
            confirmGoToEx(preSelectExIdx);
          }}
          onDismiss={() => { setPreSelectExIdx(null); confirmGoToEx(preSelectExIdx); }}
        />
      )}
    </>
  );
}
