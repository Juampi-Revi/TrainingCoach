"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL, GROUP_COLORS, GROUP_LETTERS } from "@/lib/constants";
import type { WorkoutTemplateDetail } from "@regen/types";
import type { WE } from "./_types";
import { ExerciseInspectorMeta } from "./exercise-inspector-meta";
import { ExerciseInspectorObjective } from "./exercise-inspector-objective";
import { ExerciseInspectorDetails } from "./exercise-inspector-details";

export function ExerciseInspector({ we, templateId, blocks, usedGroups, groupSizes, nextGroup, onUpdate, onSetGroup, onClose }: {
  we: WE;
  templateId: string;
  blocks: WorkoutTemplateDetail["blocks"];
  usedGroups: string[];
  groupSizes: Record<string, number>;
  nextGroup: string;
  onUpdate: (patch: Partial<WE>) => void;
  onSetGroup: (group: string | null) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
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

  const loadMedia = useCallback(async () => {
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
        ...res.images.map((img) => ({ ...img, mediaType: "image" as const })),
        ...res.videos.map((vid) => ({ ...vid, mediaType: "video" as const })),
      ];
      setExerciseMedia(allMedia);
    } catch {
      toast.error("No se pudo cargar la media del ejercicio");
    }
  }, [api, toast, we.exercise.id]);

  const prevId = useRef<string | null>(null);
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
  }, [we, loadMedia]);

  async function save(patch: Record<string, unknown>) {
    onUpdate(patch as Partial<WE>);
    try {
      await api.patch(`/coach/workouts/${templateId}/exercises/${we.id}`, patch);
    } catch {
      toast.error("No se pudo guardar el ejercicio");
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
    } catch {
      toast.error("No se pudo guardar la URL");
    }
  }

  const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const nextGroupIdx = GROUP_LETTERS.indexOf(nextGroup);
  const maxGroupCount = Math.max(usedGroups.length + 1, nextGroupIdx >= 0 ? nextGroupIdx + 1 : 1, 1);
  const allGroupOptions: (string | null)[] = [null, ...GROUP_LETTERS.slice(0, maxGroupCount)];
  const currentBlock = blocks.find((b) => b.id === localBlockId) ?? null;
  const isIntervalBlock = currentBlock?.type === "intervals";
  const isEmomBlock = isIntervalBlock && currentBlock?.intervalType === "emom";

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

        <ExerciseInspectorMeta
          blocks={blocks}
          localBlockId={localBlockId}
          onChangeBlockId={(blockId) => {
            setLocalBlockId(blockId);
            save({ workoutBlockId: blockId });
          }}
          allGroupOptions={allGroupOptions}
          selectedGroup={we.supersetGroup}
          groupSizes={groupSizes}
          onSetGroup={onSetGroup}
        />

        <ExerciseInspectorObjective
          isIntervalBlock={!!isIntervalBlock}
          isEmomBlock={!!isEmomBlock}
          localSets={localSets}
          setLocalSets={setLocalSets}
          commitSets={commitSets}
          localReps={localReps}
          setLocalReps={setLocalReps}
          commitReps={commitReps}
          localDuration={localDuration}
          setLocalDuration={setLocalDuration}
          commitDuration={commitDuration}
          onToggleDuration={() => {
            if (localDuration) {
              setLocalDuration("");
              save({ durationSeconds: null });
              return;
            }
            setLocalReps("");
            setLocalDuration("30");
            save({ targetReps: null, durationSeconds: 30 });
          }}
          localIntType={localIntType}
          setLocalIntType={setLocalIntType}
          localIntVal={localIntVal}
          setLocalIntVal={setLocalIntVal}
          commitInt={commitInt}
          localRest={localRest}
          setLocalRest={setLocalRest}
          commitRest={commitRest}
          onQuickSetIntensityType={(next) => {
            if (next === localIntType) return;
            save({ intensityType: next || null, intensityTarget: localIntVal || null });
          }}
        />

        <ExerciseInspectorDetails
          templateId={templateId}
          we={we}
          gc={gc}
          localNotes={localNotes}
          setLocalNotes={setLocalNotes}
          commitNotes={commitNotes}
          localGroupNote={localGroupNote}
          setLocalGroupNote={setLocalGroupNote}
          commitGroupNote={commitGroupNote}
          localYoutubeUrl={localYoutubeUrl}
          setLocalYoutubeUrl={setLocalYoutubeUrl}
          commitYoutubeUrl={commitYoutubeUrl}
          exerciseMedia={exerciseMedia}
          onReloadMedia={loadMedia}
        />
      </div>
    </div>
  );
}
