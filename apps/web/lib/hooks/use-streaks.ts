import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { StreakStats } from "@regen/types";

interface UseStreaksReturn {
  stats: StreakStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStreaks(): UseStreaksReturn {
  const { api } = useAuth();
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<StreakStats>("/client/streaks");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar rachas");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchStreaks();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchStreaks]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStreaks,
  };
}
