"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { ProgressDashboard } from "@regen/types";

interface UseProgressDataResult {
  progress: ProgressDashboard | null;
  loading: boolean;
  load: (force?: boolean) => Promise<void>;
}

export function useProgressData(clientUserId: string): UseProgressDataResult {
  const { api } = useAuth();
  const toast = useToast();

  const [progress, setProgress] = useState<ProgressDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(force?: boolean) {
    if (!force && (loading || progress)) return;
    setLoading(true);
    try {
      const r = await api.get<ProgressDashboard>(`/coach/clients/${clientUserId}/progress`);
      setProgress(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando progreso");
    } finally {
      setLoading(false);
    }
  }

  return { progress, loading, load };
}

