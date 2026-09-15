"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { EffortSummaryCard } from "@/app/(client)/sesion/[sessionId]/_components/effort-summary-card";
import { emptySessionEffort, type SessionEffortSummary } from "@/lib/effort";

export function WeekEffortCard() {
  const { api } = useAuth();
  const [summary, setSummary] = useState<SessionEffortSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ sessions: number; summary: SessionEffortSummary }>("/client/effort/week");
      setSummary(res.summary);
    } catch {
      setSummary(emptySessionEffort());
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (!summary || summary.workSets + summary.warmupSets + summary.unknownSets === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <EffortSummaryCard title="ESTA SEMANA · ESFUERZO" summary={summary} />
    </div>
  );
}
