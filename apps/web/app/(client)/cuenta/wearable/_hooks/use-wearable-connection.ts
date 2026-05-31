import { useState, useCallback, useEffect } from "react";
import { ProviderConfig } from "../_types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

export function useProviderConnection() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const fetchStatus = useCallback(async () => {
    setFetchingStatus(true);
    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setProviders(json.data.providers);
      }
    } catch { /* silent */ }
    finally { setFetchingStatus(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchStatus();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchStatus]);

  const connect = useCallback(async (providerId: string, extra?: Record<string, string>) => {
    setLoading(prev => ({ ...prev, [providerId]: true }));
    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ provider: providerId, ...extra }),
      });
      const json = await res.json();
      return { ok: json.ok, data: json.data, error: json.error };
    } finally {
      setLoading(prev => ({ ...prev, [providerId]: false }));
    }
  }, []);

  const disconnect = useCallback(async (providerId: string) => {
    setLoading(prev => ({ ...prev, [providerId]: true }));
    try {
      const token = localStorage.getItem("regen_token");
      await fetch(`${API_BASE}/client/sync`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ provider: providerId }),
      });
      fetchStatus();
      return { ok: true };
    } finally {
      setLoading(prev => ({ ...prev, [providerId]: false }));
    }
  }, [fetchStatus]);

  const sync = useCallback(async (providerId: string) => {
    setSyncing(prev => ({ ...prev, [providerId]: true }));
    try {
      const token = localStorage.getItem("regen_token");
      const res = await fetch(`${API_BASE}/client/sync/${providerId === "google_health" ? "google-health" : providerId}/sync`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.ok) fetchStatus();
      return { ok: json.ok, error: json.error };
    } finally {
      setSyncing(prev => ({ ...prev, [providerId]: false }));
    }
  }, [fetchStatus]);

  return { providers, loading, syncing, fetchingStatus, connect, disconnect, sync, refetch: fetchStatus };
}
