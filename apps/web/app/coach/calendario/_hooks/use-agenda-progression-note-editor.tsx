"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/lib/toast";
import { PlanProgressionNoteModal } from "../../planes/[planId]/_components/plan-progression-note-modal";
import type { CoachCalendarResponse } from "@regen/types";

export function useAgendaProgressionNoteEditor(args: {
  api: { patch: <T>(url: string, body: unknown) => Promise<T> };
  setData: (next: ((prev: CoachCalendarResponse | null) => CoachCalendarResponse | null) | CoachCalendarResponse | null) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [pwwId, setPwwId] = useState<string | null>(null);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [value, setValue] = useState("");

  const openNote = useCallback((next: { planId: string; pwwId: string; workoutTitle: string; value: string | null }) => {
    setPlanId(next.planId);
    setPwwId(next.pwwId);
    setWorkoutTitle(next.workoutTitle);
    setValue(next.value ?? "");
    setOpen(true);
  }, []);

  const save = useCallback(async () => {
    if (!planId || !pwwId) return;
    setSaving(true);
    try {
      const trimmed = value.trim();
      const res = await args.api.patch<{ pwwId: string; progressionNote: string | null }>(`/coach/plans/${planId}/cell`, {
        pwwId,
        progressionNote: trimmed ? trimmed : null,
      });

      args.setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) => {
            if (!it.workout || it.workout.pwwId !== res.pwwId) return it;
            return { ...it, workout: { ...it.workout, progressionNote: res.progressionNote } };
          }),
          weekOverview: (prev.weekOverview ?? []).map((c) => ({
            ...c,
            workouts: c.workouts.map((w) => (w.pwwId === res.pwwId ? { ...w, progressionNote: res.progressionNote } : w)),
          })),
        };
      });

      setOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    } finally {
      setSaving(false);
    }
  }, [args, planId, pwwId, toast, value]);

  const modal = useMemo(() => {
    return (
      <PlanProgressionNoteModal
        open={open}
        workoutTitle={workoutTitle}
        value={value}
        saving={saving}
        onChange={setValue}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    );
  }, [open, save, saving, value, workoutTitle]);

  return { openNote, modal };
}
