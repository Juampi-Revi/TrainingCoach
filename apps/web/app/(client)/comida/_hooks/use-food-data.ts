"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { FoodLogEntry, ClientDashboard } from "@regen/types";

interface FoodData {
  entries: FoodLogEntry[] | null;
  dashboard: ClientDashboard | null;
  loading: boolean;
}

export function useFoodData() {
  const { api } = useAuth();

  const [entries, setEntries] = useState<FoodLogEntry[] | null>(null);
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      const res = await api.get<{ items: FoodLogEntry[] }>("/client/food?take=50");
      setEntries(res.items ?? []);
    } catch {
      setEntries([]);
    }
  }, [api]);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get<ClientDashboard>("/client/dashboard");
      setDashboard(res);
    } catch {
      setDashboard(null);
    }
  }, [api]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadEntries(), loadDashboard()]);
    setLoading(false);
  }, [loadEntries, loadDashboard]);

  const deleteEntry = useCallback(
    async (id: string) => {
      await api.del(`/client/food/${id}`);
      await loadEntries();
      await loadDashboard();
    },
    [api, loadEntries, loadDashboard]
  );

  const refresh = useCallback(async () => {
    await loadEntries();
    await loadDashboard();
  }, [loadEntries, loadDashboard]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    entries,
    dashboard,
    loading,
    refresh,
    deleteEntry,
  };
}
