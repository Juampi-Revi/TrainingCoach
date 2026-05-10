import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { WeeklySummary } from "../_components/_types";

interface UseSummaryDataResult {
  summary: WeeklySummary | null;
  summaryLoading: boolean;
  loadSummaryData: (force?: boolean) => Promise<void>;
}

export function useSummaryData(clientUserId: string): UseSummaryDataResult {
  const { api } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function loadSummaryData(force?: boolean) {
    if (!force && (summaryLoading || summary)) return;
    setSummaryLoading(true);
    try {
      const r = await api.get<WeeklySummary>(`/coach/clients/${clientUserId}/summary/week?days=7`);
      setSummary(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando el resumen");
    } finally {
      setSummaryLoading(false);
    }
  }

  return { summary, summaryLoading, loadSummaryData };
}
