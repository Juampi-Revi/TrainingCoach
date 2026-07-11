"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock } from "@/components/ui";
import { groupLabel, fmtDuration } from "@/lib/constants";
import { BlockRunner } from "./block-runner";
import { SessionHeader } from "./_components/session-header";
import { ExercisePicker } from "./_components/exercise-picker";
import { ExerciseList } from "./_components/exercise-list";
import { PreSelectSheet } from "./_components/pre-select-sheet";
import { MediaLightbox } from "./_components/media-lightbox";
import { ExerciseMediaViewer } from "./_components/exercise-media-viewer";
import { SwapSheet } from "./_components/swap-sheet";
import { RestTimerOverlay } from "./_components/rest-timer-overlay";
import { WarmupOverlay } from "./_components/warmup-overlay";
import { LoggerSheet } from "./_components/logger-sheet";
import { BlockRestScreen } from "./_components/block-rest-screen";
import { ResetModal } from "./_components/reset-modal";
import { BlockRunnerOverlay } from "./_components/block-runner-overlay";
import { SessionEnduranceView } from "./_components/session-endurance-view";
import { SessionBottomBar } from "./_components/session-bottom-bar";
import { useSession } from "./_hooks/use-session";
import { useSetLogger } from "./_hooks/use-set-logger";
import { useBlockExecution } from "./_hooks/use-block-execution";

export default function SessionInProgressPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const {
    session, setSession, loading,
    currentExIdx, setCurrentExIdx,
    workoutStartedAtMs, nowMs,
    offlineCount, setOfflineCount,
    warmupDone, setWarmupDone,
    warmupTimer,
    queueKey, warmupDoneKey, warmupTimerKey,
    load, flushQueue,
    toggleWarmup, resetWarmup, finishWarmup,
  } = useSession(sessionId);

  const {
    effortMode, setEffortMode,
    loggerOpen, setLoggerOpen,
    sheetRows, setSheetRows,
    sheetSaving,
    equipmentType, setEquipmentType,
    activeTimerRow, setActiveTimerRow,
    timerSecondsLeft, setTimerSecondsLeft,
    timerEndsAtMs, setTimerEndsAtMs,
    restSeconds, setRestSeconds,
    restTotal,
    lastRef,
    lastSaved,
    openLogger,
    saveSheet, deleteSet,
  } = useSetLogger({ sessionId, currentExIdx, session, queueKey, setOfflineCount, load });

  // Block execution management
  const {
    blocks,
    currentBlock,
    nextBlock,
    isResting,
    restSecondsRemaining,
    completedCount,
    totalBlocks,
    completeCurrentBlock,
    skipRest,
    startNextBlock,
    tickRest,
  } = useBlockExecution(session?.exercises ?? []);

  // Rest timer effect
  useEffect(() => {
    if (!isResting) return;
    const id = setInterval(tickRest, 1000);
    return () => clearInterval(id);
  }, [isResting, tickRest]);

  const [completing, setCompleting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preSelectExIdx, setPreSelectExIdx] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [blockRunnerOpen, setBlockRunnerOpen] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKeyboardOffset(Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  function goToEx(i: number) {
    const target = session?.exercises[i];
    if (target && (target?.alternatives?.length ?? 0) > 0 && (target?.sets?.length ?? 0) === 0) {
      setPreSelectExIdx(i);
      return;
    }
    setCurrentExIdx(i);
    setMediaOpen(false);
    setSwapOpen(false);
    // Don't auto-open tools — the user should click "Iniciar" or "Registrar series" explicitly
  }

  function confirmGoToEx(i: number) {
    setPreSelectExIdx(null);
    setCurrentExIdx(i);
    setMediaOpen(false);
    setSwapOpen(false);
    // Don't auto-open tools — the user should click "Iniciar" or "Registrar series" explicitly
  }

  async function completeSession() {
    setCompleting(true);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "completed" });
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
      console.error(e);
      setCompleting(false);
    }
  }

  async function resetSession() {
    if (!session?.workoutTemplate) return;
    setResetting(true);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "discarded" });
    } catch (e) {
      console.error(e);
      setResetting(false);
      return;
    }
    try {
      const res = await api.post<{ id: string }>("/client/sessions", { workoutTemplateId: session.workoutTemplate.id, planWeekWorkoutId: session.planWeekWorkoutId });
      try { localStorage.removeItem(warmupDoneKey); } catch {}
      try { localStorage.removeItem(warmupTimerKey); } catch {}
      try { localStorage.removeItem(queueKey); } catch {}
      router.replace(`/sesion/${res.id}`);
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
  }

  if (loading || !session) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando sesión…" /></div>;
  }

  const sessionEnduranceBlocks = session.blocks.filter((block) => block.steps.length > 0);
  if (session.exercises.length === 0 && sessionEnduranceBlocks.length > 0) {
    return (
      <SessionEnduranceView
        session={session}
        workoutStartedAtMs={workoutStartedAtMs}
        nowMs={nowMs}
        completing={completing}
        onComplete={completeSession}
        onExit={() => router.push("/semana")}
      />
    );
  }

  const ex = session.exercises[currentExIdx];
  const warmupExercises = session.exercises.filter((e) => e.block?.type === "warmup");
  const workExercises = session.exercises.filter((e) => e.block?.type !== "warmup");
  const completedExs = workExercises.filter((e) => e.sets.length >= (e.target?.sets ?? 3)).length;
  const warmupExists = warmupExercises.length > 0;
  const warmupTargetMs = null; // No longer using warmupMinutes from template
  const workoutElapsedMs = workoutStartedAtMs != null ? Math.max(0, nowMs - workoutStartedAtMs) : 0;
  const warmupElapsedMs = warmupTimer.accMs + (warmupTimer.runningSince ? nowMs - warmupTimer.runningSince : 0);
  const headerExIdx = ex ? workExercises.findIndex((e) => e.id === ex.id) : -1;
  const headerExTotal = workExercises.length || session.exercises.length;
  const headerExNum = headerExIdx >= 0 ? headerExIdx + 1 : currentExIdx + 1;
  const groupSizes = workExercises.reduce<Record<string, number>>((acc, e) => { if (e.supersetGroup) acc[e.supersetGroup] = (acc[e.supersetGroup] ?? 0) + 1; return acc; }, {});
  const nextEx = session.exercises[currentExIdx + 1] ?? null;
  const currentWorkPos = ex ? workExercises.findIndex((e) => e.id === ex.id) : -1;
  const prevRealIdx = currentWorkPos > 0 ? session.exercises.findIndex((s) => s.id === workExercises[currentWorkPos - 1]!.id) : null;
  const nextRealIdx = currentWorkPos >= 0 && currentWorkPos < workExercises.length - 1
    ? session.exercises.findIndex((s) => s.id === workExercises[currentWorkPos + 1]!.id) : null;

  let exSubtitle: string | undefined;
  if (ex) {
    const parts: string[] = [];
    const isInterval = ex.block.type === "intervals";
    if (ex.supersetGroup) parts.push(`${ex.supersetGroup} · ${groupLabel(groupSizes[ex.supersetGroup] ?? 1).toUpperCase()}`);
    if (ex.target?.sets && !isInterval) parts.push(`${ex.target.sets} series`);
    if (ex.target?.intensityType && ex.target?.intensityTarget) parts.push(`${ex.target.intensityType.toUpperCase()} ${ex.target.intensityTarget}`);
    if (parts.length) exSubtitle = parts.join(" · ");
  }

  const hasMedia = (ex?.media?.length ?? 0) > 0;
  const activeBlockId = currentBlockId ?? currentBlock?.block.id ?? null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>
      <SessionHeader
        exNum={headerExNum} exTotal={headerExTotal}
        title={ex?.exercise.name ?? "—"} subtitle={exSubtitle}
        time={fmtDuration(workoutElapsedMs)}
        onExit={() => router.push("/semana")}
      />

      {offlineCount > 0 && (
        <div style={{ background: "var(--warn)", color: "#0B0B0C", padding: "8px 16px", margin: "8px 16px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="alert" size={13} color="#0B0B0C" />
          {offlineCount} serie{offlineCount !== 1 ? "s" : ""} pendiente{offlineCount !== 1 ? "s" : ""} · se sincronizarán al reconectar
          <button onClick={flushQueue} style={{ background: "rgba(0,0,0,.15)", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#0B0B0C" }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Exercise Media Viewer */}
      {hasMedia && ex && (
        <ExerciseMediaViewer
          media={(ex.media || []).map(m => ({ ...m, mediaType: m.mediaType as "image" | "video" }))}
          exerciseName={ex.exercise.name}
          youtubeUrl={ex.exercise.youtubeUrl}
          onOpenLightbox={() => setMediaOpen(true)}
        />
      )}

      {!hasMedia && ex && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(ex.alternatives?.length ?? 0) > 0 && (
              <button onClick={() => setSwapOpen(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Icon name="repeat" size={12} color="var(--text-mute)" />
                Cambiar
              </button>
            )}
            {ex.exercise.youtubeUrl && (
              <a href={ex.exercise.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,0,0,.4)", background: "transparent", color: "#ff4444", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
                ▶ YouTube
              </a>
            )}
          </div>
          {lastSaved && <span style={{ fontSize: 11, color: "var(--success)" }}>✓ {lastSaved}</span>}
        </div>
      )}

      <ExerciseList
        session={session} workExercises={workExercises} currentExIdx={currentExIdx}
        warmupExists={warmupExists} warmupDone={warmupDone} warmupTargetMs={warmupTargetMs}
        onSelectEx={goToEx}
        onStartEx={(i) => {
          const target = session?.exercises[i];
          if (target && target.block.type !== "warmup") {
            openLogger(target);
          }
        }}
        onAddEx={() => setShowPicker(true)}
        onToggleWarmup={() => setWarmupDone(false)}
        onStartBlock={(block) => { setCurrentBlockId(block.id); setBlockRunnerOpen(true); }}
      />

      <SessionBottomBar
        keyboardOffset={keyboardOffset}
        warmupExists={warmupExists}
        warmupDone={warmupDone}
        loggerOpen={loggerOpen}
        ex={ex}
        completedExs={completedExs}
        workExercises={workExercises}
        completing={completing}
        onOpenLogger={openLogger}
        onComplete={completeSession}
        onReset={() => setShowReset(true)}
        onStartBlock={(blockId) => { setCurrentBlockId(blockId); setBlockRunnerOpen(true); }}
      />

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
          exercises={warmupExercises}
          running={warmupTimer.runningSince != null}
          onToggle={toggleWarmup} onReset={resetWarmup} onDone={finishWarmup}
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
          onSkip={() => setRestSeconds(null)}
          onAdjust={(delta) => setRestSeconds((s) => s != null ? Math.max(1, s + delta) : null)}
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

      {mediaOpen && ex?.media?.length > 0 && (
        <MediaLightbox
          media={ex.media.map(m => ({ ...m, mediaType: m.mediaType as "image" | "video" }))}
          exerciseName={ex.exercise.name}
          onClose={() => setMediaOpen(false)}
        />
      )}
      {swapOpen && ex && <SwapSheet ex={ex} sessionId={sessionId} onSwapped={() => load()} onClose={() => setSwapOpen(false)} />}

      {showReset && (
        <ResetModal
          resetting={resetting}
          onCancel={() => setShowReset(false)}
          onConfirm={() => { setShowReset(false); void resetSession(); }}
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
    </div>
  );
}
