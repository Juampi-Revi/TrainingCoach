"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { WeeklySummary } from "../_components/_types";

interface UseOverviewDataResult {
  today: WeeklySummary | null;
  week: WeeklySummary | null;
  month: WeeklySummary | null;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
}

export function useOverviewData(clientUserId: string): UseOverviewDataResult {
  const { api } = useAuth();
  const toast = useToast();

  const [today, setToday] = useState<WeeklySummary | null>(null);
  const [week, setWeek] = useState<WeeklySummary | null>(null);
  const [month, setMonth] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(force?: boolean) {
    if (!force && (loading || (today && week && month))) return;
    setLoading(true);
    try {
      const [t, w, m] = await Promise.all([
        api.get<WeeklySummary>(`/coach/clients/${clientUserId}/summary/week?days=1`),
        api.get<WeeklySummary>(`/coach/clients/${clientUserId}/summary/week?days=7`),
        api.get<WeeklySummary>(`/coach/clients/${clientUserId}/summary/week?days=30`),
      ]);
      setToday(t);
      setWeek(w);
      setMonth(m);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando el resumen");
    } finally {
      setLoading(false);
    }
  }

  return { today, week, month, loading, load };
}

