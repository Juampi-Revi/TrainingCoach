"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
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
    sessionNotes, setSessionNotes,
    warmupDone, setWarmupDone,
    warmupTimer,
    queueKey, warmupDoneKey, warmupTimerKey,
    load, flushQueue, saveNotes,
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
    restSeconds, setRestSeconds,
    restTotal,
    lastRef,
    lastSaved,
    openLogger,
    saveSheet,
    deleteSet,
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
    // Skip logger for warmup exercises
    if (target && target.block.type === "warmup") {
      setLoggerOpen(false);
      setBlockRunnerOpen(false);
      return;
    }
    // For interval blocks, open the block runner
    if (target && target.block.type === "intervals") {
      setBlockRunnerOpen(true);
    } else if (target) {
      openLogger(target);
    }
  }

  function confirmGoToEx(i: number) {
    setPreSelectExIdx(null);
    setCurrentExIdx(i);
    setMediaOpen(false);
    setSwapOpen(false);
    const target = session?.exercises[i];
    // Skip logger for warmup exercises
    if (target && target.block.type === "warmup") {
      setLoggerOpen(false);
      setBlockRunnerOpen(false);
      return;
    }
    // For interval blocks, open the block runner
    if (target && target.block.type === "intervals") {
      setBlockRunnerOpen(true);
    } else if (target) {
      openLogger(target);
    }
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
      const res = await api.post<{ id: string }>("/client/sessions", { workoutTemplateId: session.workoutTemplate.id });
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
    if (ex.supersetGroup) parts.push(`${ex.supersetGroup} · ${groupLabel(groupSizes[ex.supersetGroup] ?? 1).toUpperCase()}`);
    if (ex.target?.sets) parts.push(`${ex.target.sets} series`);
    if (ex.target?.intensityType && ex.target?.intensityTarget) parts.push(`${ex.target.intensityType.toUpperCase()} ${ex.target.intensityTarget}`);
    if (parts.length) exSubtitle = parts.join(" · ");
  }

  const hasMedia = (ex?.media?.length ?? 0) > 0;

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

      {ex?.target?.notes && (
        <div style={{ margin: "10px 16px 0", padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>NOTA DEL COACH</div>
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>{ex.target.notes}</div>
        </div>
      )}

      {ex && !loggerOpen && ex.block?.type !== "strength" && (
        <div style={{ padding: "10px 16px 0" }}>
          <button onClick={() => openLogger(ex)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-1)", cursor: "pointer", color: "var(--text)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="book" size={14} color="var(--text-mute)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Series de este ejercicio</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Abrir</span>
          </button>
        </div>
      )}

      <ExerciseList
        session={session} workExercises={workExercises} currentExIdx={currentExIdx}
        warmupExists={warmupExists} warmupDone={warmupDone} warmupTargetMs={warmupTargetMs}
        onSelectEx={goToEx} onAddEx={() => setShowPicker(true)}
        onToggleWarmup={() => setWarmupDone(false)}
        onStartBlock={(block) => { setCurrentBlockId(block.id); setBlockRunnerOpen(true); }}
      />

      <div style={{ padding: "4px 16px 8px" }}>
        <button onClick={() => setNotesOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: "var(--text-mute)", fontSize: 13, fontWeight: 600 }}>
          <Icon name="edit" size={13} color="var(--text-mute)" />
          {notesOpen ? "Cerrar notas" : sessionNotes ? "Notas de sesión" : "Agregar nota de sesión"}
        </button>
        {notesOpen && (
          <div style={{ marginTop: 6, padding: 12, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 10 }}>
            <textarea
              value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} onBlur={() => saveNotes(sessionNotes)}
              placeholder="¿Cómo te sentiste? ¿Algo que destacar de la sesión?" rows={3}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "none" }}
            />
          </div>
        )}
      </div>

      {!(warmupExists && !warmupDone) && !loggerOpen && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: keyboardOffset, padding: "4px 16px 28px", background: "linear-gradient(to top, var(--bg) 70%, transparent)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {completedExs < workExercises.length && (
              <button onClick={completeSession} disabled={completing} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: "var(--text-dim)", fontSize: 12, fontWeight: 600 }}>
                Terminar entrenamiento
              </button>
            )}
            <button onClick={() => setShowReset(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>
              Reiniciar
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {prevRealIdx != null && prevRealIdx >= 0 && (
              <Button size="xl" variant="secondary" style={{ width: 56 }} onClick={() => goToEx(prevRealIdx)} icon="chevL" />
            )}
            {completedExs === workExercises.length ? (
              <Button size="xl" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={completeSession}>
                {completing ? "Completando…" : "Finalizar sesión"}
              </Button>
            ) : (
              <>
                {nextRealIdx != null && nextRealIdx >= 0 && (
                  <Button size="xl" variant="secondary" style={{ width: 56 }} onClick={() => goToEx(nextRealIdx)} icon="chevR" />
                )}
                <Button size="xl" icon={ex?.block?.type === "intervals" ? "timer" : "book"} style={{ flex: 1, fontSize: 16 }} disabled={!ex}
                  onClick={() => {
                    if (!ex) return;
                    if (ex.block?.type === "intervals") {
                      setCurrentBlockId(ex.block.id);
                      setBlockRunnerOpen(true);
                    } else {
                      openLogger(ex);
                    }
                  }}
                >
                  {ex?.block?.type === "intervals" ? "Iniciar bloque" : "Registrar series"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {loggerOpen && ex && (
        <LoggerSheet
          ex={ex} sessionId={sessionId}
          sheetRows={sheetRows} setSheetRows={setSheetRows}
          effortMode={effortMode} setEffortMode={setEffortMode}
          equipmentType={equipmentType} setEquipmentType={setEquipmentType}
          activeTimerRow={activeTimerRow} setActiveTimerRow={setActiveTimerRow}
          timerSecondsLeft={timerSecondsLeft} setTimerSecondsLeft={setTimerSecondsLeft}
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

      {blockRunnerOpen && (
        (() => {
          // Find the block to run - either selected by user or current from execution flow
          const blockToRun = currentBlockId 
            ? blocks.find(b => b.block.id === currentBlockId)
            : currentBlock;
          
          if (!blockToRun) return null;
          
          return (
            <BlockRunner
              block={blockToRun.block}
              exercises={blockToRun.exercises}
              sessionId={sessionId}
              api={api}
              onClose={() => {
                const completedBlockId = currentBlockId || currentBlock?.block.id;
                setBlockRunnerOpen(false);
                setCurrentBlockId(null);
                // Refresh session data to show completed work
                load();
              }}
              onSaved={load}
            />
          );
        })()
      )}

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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1200 }} onClick={() => setShowReset(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "24px 20px 36px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Reiniciar entrenamiento</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 20, lineHeight: 1.5 }}>
              Se descartará el progreso actual y empezarás desde cero. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={() => setShowReset(false)}>Cancelar</Button>
              <button onClick={() => { setShowReset(false); void resetSession(); }} disabled={resetting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--danger)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                {resetting ? "Reiniciando…" : "Sí, reiniciar"}
              </button>
            </div>
          </div>
        </div>
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
