import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { LeaderboardResult, LeaderboardMetric, LeaderboardPeriod } from "@regen/types";

interface UseLeaderboardReturn {
  data: LeaderboardResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(
  metric: LeaderboardMetric = "workouts",
  period: LeaderboardPeriod = "weekly",
  friendsOnly: boolean = false
): UseLeaderboardReturn {
  const { api } = useAuth();
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        metric,
        period,
        friendsOnly: friendsOnly.toString(),
      });
      
      const result = await api.get<LeaderboardResult>(`/client/leaderboard?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clasificación");
    } finally {
      setIsLoading(false);
    }
  }, [api, metric, period, friendsOnly]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchLeaderboard();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchLeaderboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchLeaderboard,
  };
}
