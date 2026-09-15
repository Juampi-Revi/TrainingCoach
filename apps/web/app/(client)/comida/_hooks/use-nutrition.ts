"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { NutritionToday, NutritionProfile, NutritionTarget } from "@regen/types";

export function useNutritionToday() {
  const { api } = useAuth();
  const [data, setData] = useState<NutritionToday | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<NutritionToday>("/client/nutrition");
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  return { data, loading, refetch: load };
}

export function useNutritionProfile() {
  const { api } = useAuth();
  const [profile, setProfile] = useState<NutritionProfile | null>(null);

  const load = useCallback(async () => {
    try {
      setProfile(await api.get<NutritionProfile>("/client/nutrition/profile"));
    } catch {
      setProfile(null);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  return { profile, refetch: load, setProfile };
}

export type { NutritionTarget };
