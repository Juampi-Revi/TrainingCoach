"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL, GROUP_COLORS, GROUP_LETTERS, groupLabel, blockTypeLabel, blockSummary } from "@/lib/constants";
import type { WorkoutTemplateDetail } from "@regen/types";
import type { WE } from "./_types";
import { AlternativesPanel } from "./alternatives-panel";
import { MediaManager } from "./media-manager";

export function ExerciseInspector({ we, templateId, blocks, usedGroups, groupSizes, nextGroup, onUpdate, onSetGroup, onToggleWarmup, onClose }: {
  we: WE;
  templateId: string;
  blocks: WorkoutTemplateDetail["blocks"];
  usedGroups: string[];
  groupSizes: Record<string, number>;
  nextGroup: string;
  onUpdate: (patch: Partial<WE>) => void;
  onSetGroup: (group: string | null) => void;
  onToggleWarmup: () => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [localSets, setLocalSets] = useState(String(we.targetSets ?? ""));
  const [localReps, setLocalReps] = useState(we.targetReps ?? "");
  const [localDuration, setLocalDuration] = useState(String(we.durationSeconds ?? ""));
  const [localBlockId, setLocalBlockId] = useState(we.workoutBlockId ?? "");
  const [localIntType, setLocalIntType] = useState<"rpe" | "rir" | "">(
    (we.intensityType?.toLowerCase() as "rpe" | "rir") ?? ""
  );
  const [localIntVal, setLocalIntVal] = useState(we.intensityTarget ?? "");
  const [localRest, setLocalRest] = useState(String(we.restSeconds ?? ""));
  const [localNotes, setLocalNotes] = useState(we.notes ?? "");
  const [localGroupNote, setLocalGroupNote] = useState(we.groupNote ?? "");
  const [localYoutubeUrl, setLocalYoutubeUrl] = useState(we.exercise.youtubeUrl ?? "");
  
  // Media state
  const [exerciseMedia, setExerciseMedia] = useState<Array<{
    id: string;
    mediaType: "image" | "video";
    url: string;
    publicId?: string | null;
    thumbnailUrl?: string;
    previewUrl?: string;
    isPrimary?: boolean;
    displayOrder?: number;
    videoId?: string;
    embedUrl?: string;
  }>>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const prevId = useRef(we.id);
  useEffect(() => {
    if (prevId.current === we.id) return;
    prevId.current = we.id;
    setLocalSets(String(we.targetSets ?? ""));
    setLocalReps(we.targetReps ?? "");
    setLocalDuration(String(we.durationSeconds ?? ""));
    setLocalBlockId(we.workoutBlockId ?? "");
    setLocalIntType((we.intensityType?.toLowerCase() as "rpe" | "rir") ?? "");
    setLocalIntVal(we.intensityTarget ?? "");
    setLocalRest(String(we.restSeconds ?? ""));
    setLocalNotes(we.notes ?? "");
    setLocalGroupNote(we.groupNote ?? "");
    setLocalYoutubeUrl(we.exercise.youtubeUrl ?? "");
    // Load media when exercise changes
    loadMedia();
  }, [we]);
  
  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, []);
  
  async function loadMedia() {
    setMediaLoading(true);
    try {
      const res = await api.get<{
        images: Array<{
          id: string;
          mediaType: "image";
          url: string;
          publicId?: string;
          thumbnailUrl?: string;
          previewUrl?: string;
          isPrimary?: boolean;
          displayOrder?: number;
        }>;
        videos: Array<{
          id: string;
          mediaType: "video";
          url: string;
          publicId?: string;
          videoId?: string;
          embedUrl?: string;
          thumbnailUrl?: string;
        }>;
      }>(`/coach/exercises/${we.exercise.id}/media`);
      
      const allMedia = [
        ...res.images.map(img => ({ ...img, mediaType: "image" as const })),
        ...res.videos.map(vid => ({ ...vid, mediaType: "video" as const })),
      ];
      setExerciseMedia(allMedia);
    } catch (e) {
      console.error("Error loading media:", e);
    } finally {
      setMediaLoading(false);
    }
  }

  async function save(patch: Record<string, unknown>) {
    onUpdate(patch as Partial<WE>);
    try {
      await api.patch(`/coach/workouts/${templateId}/exercises/${we.id}`, patch);
    } catch (e) {
      console.error(e);
    }
  }

  function commitSets() {
    const n = parseInt(localSets);
    if (!isNaN(n) && n > 0) save({ targetSets: n });
  }

  function commitReps() { save({ targetReps: localReps || null }); }

  function commitDuration() {
    const n = parseInt(localDuration);
    if (!isNaN(n) && n > 0) save({ durationSeconds: n });
    else if (!localDuration) save({ durationSeconds: null });
  }

  function commitInt() {
    if (localIntType && localIntVal) {
      save({ intensityType: localIntType, intensityTarget: localIntVal });
    } else if (!localIntVal) {
      save({ intensityType: null, intensityTarget: null });
    }
  }

  function commitRest() {
    const n = parseInt(localRest);
    if (!isNaN(n) && n > 0) save({ restSeconds: n });
    else if (!localRest) save({ restSeconds: null });
  }

  function commitNotes() { save({ notes: localNotes || null }); }

  function commitGroupNote() {
    const trimmed = localGroupNote.trim().slice(0, 100);
    if (trimmed !== localGroupNote) setLocalGroupNote(trimmed);
    save({ groupNote: trimmed || null });
  }

  async function commitYoutubeUrl() {
    try {
      await api.patch(`/coach/exercises/${we.exercise.id}`, { youtubeUrl: localYoutubeUrl.trim() || null });
      onUpdate({ exercise: { ...we.exercise, youtubeUrl: localYoutubeUrl.trim() || null } });
    } catch (e) { console.error(e); }
  }

  const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const groupmates = we.supersetGroup
    ? `Grupo ${we.supersetGroup} · ${groupLabel(groupSizes[we.supersetGroup] ?? 1)}`
    : null;
  const allGroupOptions: (string | null)[] = [null, ...GROUP_LETTERS.slice(0, Math.max(usedGroups.length + 1, 1))];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 3 }}>EDITAR EJERCICIO</div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{we.exercise.name}</div>
          {we.exercise.primaryMuscle && (
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
              {MUSCLE_LABEL[we.exercise.primaryMuscle] ?? we.exercise.primaryMuscle}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mute)", flexShrink: 0 }}
        >
          <Icon name="x" size={13} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

        {blocks.length > 0 && (
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>BLOQUE</div>
            <select
              value={localBlockId}
              disabled={we.isWarmup}
              onChange={(e) => {
                const v = e.target.value;
                setLocalBlockId(v);
                save({ workoutBlockId: v || null });
              }}
              style={{
                width: "100%", height: 36, borderRadius: 8,
                background: "var(--bg-2)",
                border: `1px solid ${we.isWarmup ? "var(--line)" : "var(--line-2)"}`,
                color: we.isWarmup ? "var(--text-dim)" : "var(--text)",
                fontSize: 13, padding: "0 10px", outline: "none",
              }}
            >
              <option value="">Sin bloque (logger normal)</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {blockTypeLabel(b.type)}{b.label ? ` · ${b.label}` : ""} · {blockSummary(b)}
                </option>
              ))}
            </select>
            {we.isWarmup && (
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                Los ejercicios de calentamiento no van dentro de bloques.
              </div>
            )}
          </div>
        )}

        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>SUPERSET / GRUPO</div>
          <div style={{ display: "flex", gap: 4 }}>
            {allGroupOptions.map((g) => {
              const gColor = g ? (GROUP_COLORS[g] ?? "var(--text-mute)") : null;
              const sel = we.supersetGroup === g;
              return (
                <button
                  key={g ?? "none"}
                  onClick={() => onSetGroup(g)}
                  style={{
                    flex: 1, height: 36, borderRadius: 8,
                    background: sel ? (gColor ?? "var(--bg-3)") : "var(--bg-2)",
                    border: `1px solid ${sel ? (gColor ?? "var(--line)") : "var(--line-2)"}`,
                    color: sel ? (g ? "#0B0B0C" : "var(--text)") : (g ? (gColor ?? "var(--text-mute)") : "var(--text-mute)"),
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {g ?? "—"}
                </button>
              );
            })}
          </div>
          {groupmates && (
            <div style={{ fontSize: 11, color: gc ?? "var(--text-mute)", marginTop: 6 }}>{groupmates}</div>
          )}
        </div>

        <div
          onClick={onToggleWarmup}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer" }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Marcar como calentamiento</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>Va en la fase 1, sin tracking de RPE</div>
          </div>
          <div style={{
            width: 36, height: 22, borderRadius: 11,
            background: we.isWarmup ? "var(--lime)" : "var(--bg-3)",
            border: `1px solid ${we.isWarmup ? "var(--lime)" : "var(--line-2)"}`,
            position: "relative", transition: "background .15s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: we.isWarmup ? 16 : 2,
              width: 16, height: 16, borderRadius: 8,
              background: we.isWarmup ? "#0B0B0C" : "var(--text-mute)",
              transition: "left .15s",
            }} />
          </div>
        </div>

        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>OBJETIVO</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Series</span>
              <input
                type="number" value={localSets}
                onChange={(e) => setLocalSets(e.target.value)}
                onBlur={commitSets}
                placeholder="3"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>
                {localDuration ? "Duración (seg)" : "Reps"}
              </span>
              {localDuration ? (
                <input
                  type="number" value={localDuration}
                  onChange={(e) => setLocalDuration(e.target.value)}
                  onBlur={commitDuration}
                  placeholder="30"
                  style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--lime)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--lime)", outline: "none", textAlign: "center", width: "100%" }}
                />
              ) : (
                <input
                  value={localReps}
                  onChange={(e) => setLocalReps(e.target.value)}
                  onBlur={commitReps}
                  placeholder="8-12"
                  style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
                />
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (localDuration) { setLocalDuration(""); save({ durationSeconds: null }); }
              else { setLocalReps(""); save({ targetReps: null, durationSeconds: null }); setLocalDuration("30"); }
            }}
            style={{
              marginTop: 4, padding: "5px 10px", borderRadius: 7,
              border: `1px solid ${localDuration ? "var(--lime)" : "var(--line-2)"}`,
              background: "transparent",
              color: localDuration ? "var(--lime)" : "var(--text-mute)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start",
            }}
          >
            {localDuration ? "⏱ Por tiempo · cambiar a reps" : "⏱ Cambiar a por tiempo"}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, marginTop: 8, alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Tipo</span>
              <div style={{ display: "flex", padding: 3, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8 }}>
                {(["rpe", "rir", ""] as const).map((t) => (
                  <button
                    key={t || "none"}
                    onClick={() => { setLocalIntType(t); if (t !== localIntType) save({ intensityType: t || null, intensityTarget: localIntVal || null }); }}
                    style={{
                      padding: "5px 8px", borderRadius: 6,
                      background: localIntType === t ? "var(--bg-3)" : "transparent",
                      border: "none", color: localIntType === t ? "var(--text)" : "var(--text-mute)",
                      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t ? t.toUpperCase() : "—"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Valor</span>
              <input
                type="number" value={localIntVal}
                onChange={(e) => setLocalIntVal(e.target.value)}
                onBlur={commitInt}
                placeholder="8"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Descanso (segundos)</span>
              <input
                type="number" value={localRest}
                onChange={(e) => setLocalRest(e.target.value)}
                onBlur={commitRest}
                placeholder="90"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 3 }}>EJERCICIO ALTERNATIVO</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>Si el equipo no está disponible el cliente puede cambiar al alternativo.</div>
          <AlternativesPanel weId={we.id} templateId={templateId} />
        </div>

        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>NOTA TÉCNICA</div>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Ej: Bajar controlado 3 seg, mantener tensión…"
            rows={3}
            style={{
              width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)",
              borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)",
              fontSize: 13, color: "var(--text)", lineHeight: 1.45,
              resize: "none", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {we.supersetGroup && (
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: gc ?? "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
              NOTA DEL BLOQUE {we.supersetGroup}
            </div>
            <textarea
              value={localGroupNote}
              onChange={(e) => setLocalGroupNote(e.target.value.slice(0, 100))}
              onBlur={commitGroupNote}
              placeholder="Nota visible al lado del título del bloque…"
              rows={2}
              maxLength={100}
              style={{
                width: "100%", background: "var(--bg-2)", border: `1px solid ${gc ?? "var(--line-2)"}`,
                borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)",
                fontSize: 13, color: "var(--text)", lineHeight: 1.45,
                resize: "none", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: "var(--text-dim)", textAlign: "right", marginTop: 2 }}>{localGroupNote.length}/100</div>
          </div>
        )}

        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>YOUTUBE URL</div>
          <input
            type="url"
            value={localYoutubeUrl}
            onChange={(e) => setLocalYoutubeUrl(e.target.value)}
            onBlur={commitYoutubeUrl}
            placeholder="https://youtube.com/watch?v=…"
            disabled={we.exercise.isSystem}
            title={we.exercise.isSystem ? "Los ejercicios del sistema no se pueden modificar" : undefined}
            style={{
              height: 36, width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)",
              borderRadius: 8, padding: "0 10px", fontSize: 12, color: "var(--text)",
              outline: "none", boxSizing: "border-box", opacity: we.exercise.isSystem ? 0.5 : 1,
            }}
          />
          {we.exercise.isSystem && (
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>Solo lectura — ejercicio del sistema</div>
          )}
        </div>

        {/* Media Manager Section */}
        <div style={{ borderTop: "2px solid var(--lime)", paddingTop: 16, marginTop: 8 }}>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", letterSpacing: ".12em", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
            📸 Media del Ejercicio
          </div>
          <MediaManager
            exerciseId={we.exercise.id}
            exerciseName={we.exercise.name}
            media={exerciseMedia}
            onMediaChange={loadMedia}
            limits={{ maxImages: 3, maxVideos: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
