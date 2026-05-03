import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { HealthData, CoachNote } from "../_components/_types";

interface UseHealthDataResult {
  health: HealthData | null;
  healthLoading: boolean;
  loadHealthData: (force?: boolean) => Promise<void>;
  noteDay: string;
  setNoteDay: React.Dispatch<React.SetStateAction<string>>;
  noteText: string;
  setNoteText: React.Dispatch<React.SetStateAction<string>>;
  savingNote: boolean;
  saveCoachNote: () => Promise<void>;
  notesForDay: CoachNote[];
}

export function useHealthData(clientUserId: string): UseHealthDataResult {
  const { api } = useAuth();
  const toast = useToast();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [noteDay, setNoteDay] = useState(new Date().toISOString().slice(0, 10));
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const notesForDay = useMemo(() => {
    return (health?.coachNotes ?? []).filter((n) => n.day === noteDay).slice(0, 5);
  }, [health?.coachNotes, noteDay]);

  async function loadHealthData(force?: boolean) {
    if (!force && (healthLoading || health)) return;
    setHealthLoading(true);
    try {
      const r = await api.get<{ entries: Record<string, unknown>[]; metrics: Record<string, unknown>[]; coachNotes: Record<string, unknown>[] }>(
        `/coach/clients/${clientUserId}/health?take=30`,
      );
      setHealth({
        entries: (r.entries ?? []).map((e) => ({
          id: String(e.id),
          day: String(e.day).slice(0, 10),
          steps: e.steps != null ? Number(e.steps) : null,
          sleepMinutes: e.sleepMinutes != null ? Number(e.sleepMinutes) : null,
          sportType: e.sportType != null ? String(e.sportType) : null,
          sportMinutes: e.sportMinutes != null ? Number(e.sportMinutes) : null,
          notes: e.notes != null ? String(e.notes) : null,
        })),
        metrics: (r.metrics ?? []).map((m) => ({
          id: String(m.id),
          measuredAt: String(m.measuredAt),
          weightKg: m.weightKg != null ? String(m.weightKg) : null,
          waistCm: m.waistCm != null ? String(m.waistCm) : null,
          chestCm: m.chestCm != null ? String(m.chestCm) : null,
          hipsCm: m.hipsCm != null ? String(m.hipsCm) : null,
          armCm: m.armCm != null ? String(m.armCm) : null,
          thighCm: m.thighCm != null ? String(m.thighCm) : null,
          notes: m.notes != null ? String(m.notes) : null,
        })),
        coachNotes: (r.coachNotes ?? []).map((n) => ({
          id: String(n.id),
          day: String(n.day).slice(0, 10),
          text: String(n.text),
          createdAt: String(n.createdAt),
          coach: n.coach as { id: string; name: string },
        })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setHealthLoading(false);
    }
  }

  async function saveCoachNote() {
    setSavingNote(true);
    try {
      await api.post(`/coach/clients/${clientUserId}/health`, { day: noteDay, text: noteText.trim() });
      setNoteText("");
      await loadHealthData(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando nota");
    } finally {
      setSavingNote(false);
    }
  }

  return { health, healthLoading, loadHealthData, noteDay, setNoteDay, noteText, setNoteText, savingNote, saveCoachNote, notesForDay };
}
