import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { Challenge, ChallengeDetail } from "@regen/types";

interface UseChallengesReturn {
  challenges: Challenge[];
  history: Challenge[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
}

export function useChallenges(): UseChallengesReturn {
  const { api } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [history, setHistory] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [activeData, historyData] = await Promise.all([
        api.get<Challenge[]>("/client/challenges"),
        api.get<Challenge[]>("/client/challenges?history=true"),
      ]);
      
      setChallenges(activeData);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar desafíos");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchChallenges();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchChallenges]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    try {
      await api.post("/client/challenges", { challengeId });
      await fetchChallenges();
    } catch (err) {
      throw err;
    }
  }, [api, fetchChallenges]);

  return {
    challenges,
    history,
    isLoading,
    error,
    refresh: fetchChallenges,
    joinChallenge,
  };
}
