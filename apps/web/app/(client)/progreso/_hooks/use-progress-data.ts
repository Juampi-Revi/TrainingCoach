"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import type { ProgressDashboard } from "@regen/types";

export function useProgressData() {
  const { api } = useAuth();
  const [data, setData] = useState<ProgressDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ProgressDashboard>("/client/progress");
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetch();
    }, 0);
    return () => clearTimeout(t);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
