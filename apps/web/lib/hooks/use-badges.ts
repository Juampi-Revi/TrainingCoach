"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { celebrateBadgeUnlock } from "@/lib/celebration";
import { useToast } from "@/lib/toast";
import type { UserBadge } from "@regen/types";

interface BadgesData {
  badges: UserBadge[];
  stats: {
    total: number;
    unlocked: number;
    unviewed: number;
  };
}

export function useBadges() {
  const { api } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<BadgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousUnlockedRef = useRef<Set<string>>(new Set());

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<BadgesData>("/client/badges");
      
      // Check for newly unlocked badges
      const currentUnlocked = new Set(
        response.badges.filter((b) => b.unlockedAt).map((b) => b.badgeId)
      );
      
      const newlyUnlocked = response.badges.filter(
        (b) => b.unlockedAt && !previousUnlockedRef.current.has(b.badgeId)
      );
      
      // Celebrate and notify for new badges
      if (newlyUnlocked.length > 0 && previousUnlockedRef.current.size > 0) {
        newlyUnlocked.forEach((badge) => {
          // Trigger confetti
          celebrateBadgeUnlock(badge.badge.tier);
          
          // Show toast notification
          toast.success(`¡Desbloqueaste "${badge.badge.name}"!`);
        });
      }
      
      previousUnlockedRef.current = currentUnlocked;
      setData(response);
      setError(null);
    } catch (err) {
      setError("Error al cargar badges");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchBadges();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchBadges]);

  const markAsViewed = useCallback(
    async (badgeId: string) => {
      try {
        await api.patch("/client/badges", { badgeId, viewed: true });
        // Update local state
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            badges: prev.badges.map((b) =>
              b.badgeId === badgeId ? { ...b, viewed: true } : b
            ),
            stats: {
              ...prev.stats,
              unviewed: Math.max(0, prev.stats.unviewed - 1),
            },
          };
        });
      } catch (err) {
        console.error("Error al marcar badge como visto:", err);
      }
    },
    [api]
  );

  const markAllAsViewed = useCallback(async () => {
    try {
      await api.patch("/client/badges", { viewed: true });
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
      console.error("Error al marcar todos los badges como vistos:", err);
    }
  }, [api]);

  const unlockedBadges = data?.badges.filter((b) => b.unlockedAt) || [];
  const lockedBadges = data?.badges.filter((b) => !b.unlockedAt) || [];

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
