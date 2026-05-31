import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { XpStats } from "@regen/types";

interface UseXpReturn {
  stats: XpStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useXp(): UseXpReturn {
  const { api } = useAuth();
  const [stats, setStats] = useState<XpStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchXp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<XpStats>("/client/xp");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar XP");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchXp();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchXp]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchXp,
  };
}
