import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { WeeklySummary } from "../_components/_types";

interface UseSummaryDataResult {
  summary: WeeklySummary | null;
  summaryLoading: boolean;
  loadSummaryData: (force?: boolean) => Promise<void>;
}

export function useSummaryData(clientUserId: string): UseSummaryDataResult {
  const { api } = useAuth();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function loadSummaryData(force?: boolean) {
    if (!force && (summaryLoading || summary)) return;
    setSummaryLoading(true);
    try {
      const r = await api.get<WeeklySummary>(`/coach/clients/${clientUserId}/summary/week?days=7`);
      setSummary(r);
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  }

  return { summary, summaryLoading, loadSummaryData };
}
