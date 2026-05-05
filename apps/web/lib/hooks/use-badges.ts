"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: "steps" | "workouts" | "streak" | "nutrition" | "social" | "special";
  tier: "bronze" | "silver" | "gold" | "platinum";
  icon: string;
  requirement: {
    type: "count" | "streak" | "days";
    target: number;
    metric: string;
  };
  unlocked: boolean;
  unlockedAt: string | null;
  viewed: boolean;
}

interface BadgesData {
  badges: Badge[];
  stats: {
    total: number;
    unlocked: number;
    unviewed: number;
  };
}

export function useBadges() {
  const { token } = useAuth();
  const api = createClient(token);

  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<BadgesData>("/client/badges");
      setData(response);
      setError(null);
    } catch (err) {
      setError("Failed to load badges");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const markAsViewed = useCallback(
    async (badgeId: string) => {
      try {
        await api.post("/client/badges", { badgeId });
        // Update local state
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            badges: prev.badges.map((b) =>
              b.id === badgeId ? { ...b, viewed: true } : b
            ),
            stats: {
              ...prev.stats,
              unviewed: Math.max(0, prev.stats.unviewed - 1),
            },
          };
        });
      } catch (err) {
        console.error("Failed to mark badge as viewed:", err);
      }
    },
    [api]
  );

  const markAllAsViewed = useCallback(async () => {
    try {
      await api.patch("/client/badges", {});
      // Update local state
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          badges: prev.badges.map((b) => ({ ...b, viewed: true })),
          stats: {
            ...prev.stats,
            unviewed: 0,
          },
        };
      });
    } catch (err) {
      console.error("Failed to mark all badges as viewed:", err);
    }
  }, [api]);

  const unlockedBadges = data?.badges.filter((b) => b.unlocked) || [];
  const lockedBadges = data?.badges.filter((b) => !b.unlocked) || [];

  return {
    badges: data?.badges || [],
    unlockedBadges,
    lockedBadges,
    stats: data?.stats || { total: 0, unlocked: 0, unviewed: 0 },
    loading,
    error,
    refetch: fetchBadges,
    markAsViewed,
    markAllAsViewed,
  };
}
