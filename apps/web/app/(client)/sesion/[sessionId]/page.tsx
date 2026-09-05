"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon, StateBlock } from "@/components/ui";
import { fmtDuration } from "@/lib/constants";
import { SessionHeader } from "./_components/session-header";
import { ExerciseList } from "./_components/exercise-list";
import { ExerciseMediaViewer } from "./_components/exercise-media-viewer";
import { SessionEnduranceView } from "./_components/session-endurance-view";
import { SessionBottomBar } from "./_components/session-bottom-bar";
import { SessionBriefing } from "./_components/session-briefing";
import { SessionProgressBar } from "./_components/session-progress-bar";
import { SessionOfflineBanner, SessionExtrasBanner } from "./_components/session-banners";
import { SessionOverlays } from "./_components/session-overlays";
import { useSession } from "./_hooks/use-session";
import { useSetLogger } from "./_hooks/use-set-logger";
import { useBlockExecution } from "./_hooks/use-block-execution";
import { useToast } from "@/lib/toast";
import { clearOfflineSets } from "./_lib/offline-idb";
import { precacheUrls } from "@/lib/precache-media";
import { sessionWorkSplit, exerciseSubtitle } from "./_lib/session-view";
import "./_styles.css";

export default function SessionInProgressPage() {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const {
    session, setSession, loading,
    currentExIdx, setCurrentExIdx,
    workoutStartedAtMs, nowMs,
    offlineCount,
    warmupDone, setWarmupDone,
    warmupTimer,
    queueKey, warmupDoneKey, warmupTimerKey, clockKey,
    load, flushQueue, enqueue,
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
    restSuggestion,
    lastRef,
    lastSaved,
    openLogger,
    saveSheet, deleteSet,
  } = useSetLogger({ sessionId, currentExIdx, session, enqueue, load });

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

  useEffect(() => {
    if (!session) return;
    const urls = session.exercises.flatMap((e) => [
      e.exercise.thumbnailUrl,
      ...e.media.map((m) => m.url),
    ]).filter((u): u is string => !!u);
    precacheUrls(urls);
  }, [session]);

  const [completing, setCompleting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showEarlyFinish, setShowEarlyFinish] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preSelectExIdx, setPreSelectExIdx] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [blockRunnerOpen, setBlockRunnerOpen] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [briefingDone, setBriefingDone] = useState(false);
  const briefingKey = `regen_briefing_done_${sessionId}`;

  useEffect(() => {
    try {
      setBriefingDone(window.localStorage.getItem(briefingKey) === "1");
    } catch {
      setBriefingDone(false);
    }
  }, [briefingKey]);

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

  async function completeSession(sessionNotes?: string) {
    setCompleting(true);
    try {
      const remaining = await flushQueue();
      if (remaining > 0) {
        toast.error("Todavía hay series pendientes de sincronizar antes de cerrar la sesión");
        setCompleting(false);
        return;
      }
      load();
      await api.patch(`/client/sessions/${sessionId}`, {
        status: "completed",
        ...(sessionNotes ? { sessionNotes } : {}),
      });
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la sesión");
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
      try { localStorage.removeItem(briefingKey); } catch {}
      try { localStorage.removeItem(clockKey); } catch {}
      void clearOfflineSets(sessionId);
      router.replace(`/sesion/${res.id}`);
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
  }

  if (loading || !session) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando sesión…" /></div>;
  }

  if (!briefingDone) {
    return (
      <SessionBriefing
        session={session}
        onStart={() => {
          try { localStorage.setItem(briefingKey, "1"); } catch { /* ignore */ }
          setBriefingDone(true);
        }}
      />
    );
  }

  const sessionEnduranceBlocks = (session.blocks ?? []).filter((block) => (block.steps?.length ?? 0) > 0);
  if (session.exercises.length === 0 && sessionEnduranceBlocks.length > 0) {
    return (
      <SessionEnduranceView
        session={session}
        workoutStartedAtMs={workoutStartedAtMs}
        nowMs={nowMs}
        completing={completing}
        onComplete={completeSession}
        onExit={() => router.push("/semana")}
        onReload={load}
      />
    );
  }

  const ex = session.exercises[currentExIdx];
  const { warmupExercises, workExercises, requiredExercises, completedExs, extraBlockCount, extraGroupCount } = sessionWorkSplit(session);
  const warmupExists = warmupExercises.length > 0;
  const warmupTargetMs = null;
  const workoutElapsedMs = workoutStartedAtMs != null ? Math.max(0, nowMs - workoutStartedAtMs) : 0;
  const warmupElapsedMs = warmupTimer.accMs + (warmupTimer.runningSince ? nowMs - warmupTimer.runningSince : 0);
  const headerExIdx = ex ? workExercises.findIndex((e) => e.id === ex.id) : -1;
  const headerExTotal = workExercises.length || session.exercises.length;
  const headerExNum = headerExIdx >= 0 ? headerExIdx + 1 : currentExIdx + 1;
  const nextEx = session.exercises[currentExIdx + 1] ?? null;
  const exSubtitle = exerciseSubtitle(ex, workExercises);

  const hasMedia = (ex?.media?.length ?? 0) > 0;
  const bottomBarVisible = !(warmupExists && !warmupDone) && !loggerOpen;
  const bottomBarPadding = bottomBarVisible
    ? keyboardOffset + (completedExs === requiredExercises.length ? 140 : 180)
    : 120;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: bottomBarPadding }}>
      <SessionHeader
        exNum={headerExNum} exTotal={headerExTotal}
        title={ex?.exercise.name ?? "—"} subtitle={exSubtitle}
        time={fmtDuration(workoutElapsedMs)}
        onExit={() => router.push("/semana")}
      />

      <SessionProgressBar exercises={workExercises} currentId={ex?.id} />

      <SessionOfflineBanner count={offlineCount} onRetry={flushQueue} />
      <SessionExtrasBanner extraBlockCount={extraBlockCount} extraGroupCount={extraGroupCount} />

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
                Alternativas
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
        onSwapEx={(i) => {
          setCurrentExIdx(i);
          setSwapOpen(true);
        }}
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
        workExercises={requiredExercises}
        completing={completing}
        onOpenLogger={openLogger}
        onComplete={completeSession}
        onRequestEarlyFinish={() => setShowEarlyFinish(true)}
        onReset={() => setShowReset(true)}
        onStartBlock={(blockId) => { setCurrentBlockId(blockId); setBlockRunnerOpen(true); }}
      />

      <SessionOverlays
        session={session}
        sessionId={sessionId}
        api={api}
        load={load}
        setSession={setSession}
        setCurrentExIdx={setCurrentExIdx}
        loggerOpen={loggerOpen}
        setLoggerOpen={setLoggerOpen}
        ex={ex}
        sheetRows={sheetRows}
        setSheetRows={setSheetRows}
        effortMode={effortMode}
        setEffortMode={setEffortMode}
        equipmentType={equipmentType}
        setEquipmentType={setEquipmentType}
        activeTimerRow={activeTimerRow}
        setActiveTimerRow={setActiveTimerRow}
        timerSecondsLeft={timerSecondsLeft}
        setTimerSecondsLeft={setTimerSecondsLeft}
        timerEndsAtMs={timerEndsAtMs}
        setTimerEndsAtMs={setTimerEndsAtMs}
        lastRef={lastRef}
        sheetSaving={sheetSaving}
        saveSheet={saveSheet}
        deleteSet={deleteSet}
        warmupExists={warmupExists}
        warmupDone={warmupDone}
        warmupElapsedMs={warmupElapsedMs}
        warmupTargetMs={warmupTargetMs}
        warmupTimer={warmupTimer}
        toggleWarmup={toggleWarmup}
        resetWarmup={resetWarmup}
        finishWarmup={finishWarmup}
        blockRunnerOpen={blockRunnerOpen}
        setBlockRunnerOpen={setBlockRunnerOpen}
        currentBlockId={currentBlockId}
        setCurrentBlockId={setCurrentBlockId}
        blocks={blocks}
        currentBlock={currentBlock}
        nextBlock={nextBlock}
        isResting={isResting}
        restSecondsRemaining={restSecondsRemaining}
        totalBlocks={totalBlocks}
        completedCount={completedCount}
        skipRest={skipRest}
        startNextBlock={startNextBlock}
        restSeconds={restSeconds}
        restTotal={restTotal}
        restSuggestion={restSuggestion}
        setRestSeconds={setRestSeconds}
        nextEx={nextEx}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        mediaOpen={mediaOpen}
        setMediaOpen={setMediaOpen}
        swapOpen={swapOpen}
        setSwapOpen={setSwapOpen}
        showReset={showReset}
        setShowReset={setShowReset}
        resetting={resetting}
        onResetConfirm={() => { void resetSession(); }}
        showEarlyFinish={showEarlyFinish}
        setShowEarlyFinish={setShowEarlyFinish}
        onEarlyFinishConfirm={() => { void completeSession(); }}
        preSelectExIdx={preSelectExIdx}
        setPreSelectExIdx={setPreSelectExIdx}
        confirmGoToEx={confirmGoToEx}
      />
    </div>
  );
}
