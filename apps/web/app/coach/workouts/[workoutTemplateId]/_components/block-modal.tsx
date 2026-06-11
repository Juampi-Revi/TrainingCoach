"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { BlockType, IntervalExerciseStrategy, IntervalType, WorkoutBlockStepSummary } from "@regen/types";
import type { WB } from "./_types";
import { BlockModalView } from "./block-modal-view";

export function BlockModal({ templateId, block, onClose, onSaved, onDeleted }: {
  templateId: string;
  block: WB | null;
  onClose: () => void;
  onSaved: (next: WB) => void;
  onDeleted: (id: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  
  // Block type state
  const [blockType, setBlockType] = useState<BlockType>(block?.type ?? "intervals");
  const [intervalType, setIntervalType] = useState<IntervalType | null>(
    block?.type === "intervals" ? (block.intervalType ?? "tabata") : null
  );
  
  // Common fields
  const [label, setLabel] = useState(block?.label ?? "");
  const [description, setDescription] = useState(block?.description ?? "");
  const [restAfterSeconds, setRestAfterSeconds] = useState(String(block?.restAfterSeconds ?? ""));
  
  // Interval-specific fields
  const [prepare, setPrepare] = useState(String(block?.prepareSeconds ?? ""));
  const [work, setWork] = useState(String(block?.workSeconds ?? ""));
  const [rest, setRest] = useState(String(block?.restSeconds ?? ""));
  const [rounds, setRounds] = useState(String(block?.rounds ?? ""));
  const [setCount, setSetCount] = useState(String(block?.setCount ?? ""));
  const [setRestSecondsValue, setSetRestSecondsValue] = useState(String(block?.restBetweenSetsSeconds ?? ""));
  const [intervalExerciseStrategy, setIntervalExerciseStrategy] = useState<IntervalExerciseStrategy>(
    (block?.intervalExerciseStrategy as IntervalExerciseStrategy | null) ?? "repeat_single",
  );
  const [total, setTotal] = useState(String(block?.totalDurationSeconds ?? ""));

  // Universal config fields (warmup/strength/cooldown/cardio)
  const [targetMinutes, setTargetMinutes] = useState(String(block?.targetMinutes ?? ""));
  const [restBetweenExercises, setRestBetweenExercises] = useState(String(block?.restBetweenExercisesSeconds ?? ""));

  // Cardio-specific fields
  const [targetZone, setTargetZone] = useState(block?.targetZone ?? "");
  const [steps, setSteps] = useState<WorkoutBlockStepSummary[]>(block?.steps ?? []);
  
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setBlockType(block?.type ?? "intervals");
      setIntervalType(block?.type === "intervals" ? (block.intervalType ?? "tabata") : null);
      setLabel(block?.label ?? "");
      setDescription(block?.description ?? "");
      setRestAfterSeconds(String(block?.restAfterSeconds ?? ""));
      setPrepare(String(block?.prepareSeconds ?? ""));
      setWork(String(block?.workSeconds ?? ""));
      setRest(String(block?.restSeconds ?? ""));
      setRounds(String(block?.rounds ?? ""));
      setSetCount(String(block?.setCount ?? ""));
      setSetRestSecondsValue(String(block?.restBetweenSetsSeconds ?? ""));
      setIntervalExerciseStrategy(((block?.intervalExerciseStrategy as IntervalExerciseStrategy | null) ?? "repeat_single"));
      setTotal(String(block?.totalDurationSeconds ?? ""));
      setTargetMinutes(String(block?.targetMinutes ?? ""));
      setRestBetweenExercises(String(block?.restBetweenExercisesSeconds ?? ""));
      setTargetZone(block?.targetZone ?? "");
      setSteps(block?.steps ?? []);
    }, 0);
    return () => clearTimeout(t);
  }, [block]);

  async function save() {
    setSaving(true);

    const w = parseInt(work);
    const r = parseInt(rest);
    const ro = parseInt(rounds);
    const prep = parseInt(prepare);
    const sets = parseInt(setCount);
    const setRestSeconds = parseInt(setRestSecondsValue);
    const t = parseInt(total);
    const restAfter = parseInt(restAfterSeconds);
    const restBetweenEx = parseInt(restBetweenExercises);
    const targetMins = parseInt(targetMinutes);

    try {
      const basePayload = {
        label: label || null,
        description: description || null,
        restAfterSeconds: !isNaN(restAfter) && restAfter > 0 ? restAfter : null,
      };

      let payload;

      if (blockType === "intervals" && intervalType) {
        // EMOM: rounds = minutes, total = rounds * 60
        // AMRAP: only total duration
        // Tabata/HIIT: work, rest, rounds
        if (intervalType === "emom") {
          const emomRounds = !isNaN(ro) && ro > 0 ? ro : null;
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            prepareSeconds: !isNaN(prep) && prep > 0 ? prep : null,
            rounds: emomRounds,
            totalDurationSeconds: emomRounds ? emomRounds * 60 : null,
            workSeconds: null,
            restSeconds: null,
            setCount: null,
            restBetweenSetsSeconds: null,
            intervalExerciseStrategy: null,
            restBetweenExercisesSeconds: !isNaN(restBetweenEx) && restBetweenEx > 0 ? restBetweenEx : null,
          };
        } else if (intervalType === "amrap") {
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            prepareSeconds: !isNaN(prep) && prep > 0 ? prep : null,
            totalDurationSeconds: !isNaN(t) && t > 0 ? t : null,
            workSeconds: null,
            restSeconds: null,
            rounds: null,
            setCount: null,
            restBetweenSetsSeconds: null,
            intervalExerciseStrategy: null,
            restBetweenExercisesSeconds: !isNaN(restBetweenEx) && restBetweenEx > 0 ? restBetweenEx : null,
          };
        } else {
          // Tabata / HIIT
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            prepareSeconds: !isNaN(prep) && prep > 0 ? prep : null,
            workSeconds: !isNaN(w) && w > 0 ? w : null,
            restSeconds: !isNaN(r) && r > 0 ? r : null,
            rounds: !isNaN(ro) && ro > 0 ? ro : null,
            setCount: !isNaN(sets) && sets > 0 ? sets : 1,
            restBetweenSetsSeconds: !isNaN(setRestSeconds) && setRestSeconds > 0 ? setRestSeconds : null,
            intervalExerciseStrategy: intervalExerciseStrategy ?? "repeat_single",
            totalDurationSeconds: null,
            restBetweenExercisesSeconds: !isNaN(restBetweenEx) && restBetweenEx > 0 ? restBetweenEx : null,
          };
        }
      } else if (blockType === "cardio") {
        payload = {
          ...basePayload,
          type: blockType,
          targetMinutes: !isNaN(targetMins) && targetMins > 0 ? targetMins : null,
          targetZone: targetZone || null,
          steps: steps.map((step) => ({
            kind: step.kind,
            label: step.label,
            instruction: step.instruction,
            durationSeconds: step.durationSeconds,
            distanceMeters: step.distanceMeters,
            targetType: step.targetType,
            targetLabel: step.targetLabel,
            targetValueLow: step.targetValueLow,
            targetValueHigh: step.targetValueHigh,
            targetUnit: step.targetUnit,
          })),
        };
      } else {
        // warmup, strength, cooldown - configurable duration and rest between exercises
        payload = {
          ...basePayload,
          type: blockType,
          targetMinutes: !isNaN(targetMins) && targetMins > 0 ? targetMins : null,
          restBetweenExercisesSeconds: !isNaN(restBetweenEx) && restBetweenEx > 0 ? restBetweenEx : null,
          steps: [],
        };
      }

      if (block) {
        const updated = await api.patch<WB>(`/coach/workouts/${templateId}/blocks/${block.id}`, payload);
        onSaved(updated);
        toast.success("Bloque guardado");
      } else {
        const created = await api.post<WB>(`/coach/workouts/${templateId}/blocks`, payload);
        onSaved(created);
        toast.success("Bloque creado. Agregá ejercicios al bloque.");
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el bloque");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!block) return;
    setSaving(true);
    try {
      await api.del(`/coach/workouts/${templateId}/blocks/${block.id}`);
      onDeleted(block.id);
      toast.success("Bloque eliminado");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el bloque");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BlockModalView
      block={block}
      saving={saving}
      confirmDelete={confirmDelete}
      blockType={blockType}
      intervalType={intervalType}
      label={label}
      description={description}
      restAfterSeconds={restAfterSeconds}
      prepare={prepare}
      work={work}
      rest={rest}
      rounds={rounds}
      setCount={setCount}
      setRestSeconds={setRestSecondsValue}
      intervalExerciseStrategy={intervalExerciseStrategy}
      total={total}
      targetMinutes={targetMinutes}
      restBetweenExercises={restBetweenExercises}
      targetZone={targetZone}
      steps={steps}
      setBlockType={setBlockType}
      setIntervalType={setIntervalType}
      setLabel={setLabel}
      setDescription={setDescription}
      setRestAfterSeconds={setRestAfterSeconds}
      setPrepare={setPrepare}
      setWork={setWork}
      setRest={setRest}
      setRounds={setRounds}
      setSetCount={setSetCount}
      setSetRestSeconds={setSetRestSecondsValue}
      setIntervalExerciseStrategy={setIntervalExerciseStrategy}
      setTotal={setTotal}
      setTargetMinutes={setTargetMinutes}
      setRestBetweenExercises={setRestBetweenExercises}
      setTargetZone={setTargetZone}
      setSteps={setSteps}
      onClose={onClose}
      onSave={save}
      onRequestDelete={() => setConfirmDelete(true)}
      onCancelDelete={() => setConfirmDelete(false)}
      onConfirmDelete={del}
    />
  );
}
