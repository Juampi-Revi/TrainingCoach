import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { SessionSummary } from "@regen/types";

type SessionWithVolume = SessionSummary & { totalVolumeKg?: number | null };

interface SessionsDataResult {
  sessions: SessionWithVolume[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  loadMore: () => void;
}

export function useSessionsData(clientUserId: string): SessionsDataResult {
  const { api } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionWithVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilterState] = useState("");
  const cursorRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const fetch = useCallback(
    async (reset: boolean) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("take", "20");
        if (!reset && cursorRef.current) params.set("cursor", cursorRef.current);
        if (statusFilter) params.set("status", statusFilter);

        const res = await api.get<{ sessions: SessionWithVolume[]; nextCursor: string | null }>(
          `/coach/clients/${clientUserId}/sessions?${params.toString()}`,
        );

        setSessions((prev) => (reset ? res.sessions : [...prev, ...res.sessions]));
        cursorRef.current = res.nextCursor;
        setHasMore(!!res.nextCursor);
      } catch (e) {
        if (reset) toast.error("No se pudieron cargar las sesiones");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [api, clientUserId, statusFilter, toast],
  );

  useEffect(() => {
    cursorRef.current = null;
    void fetch(true);
  }, [fetch, clientUserId]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) void fetch(false);
  }, [fetch, hasMore, loadingMore]);

  const setStatusFilter = useCallback(
    (next: string) => {
      cursorRef.current = null;
      setStatusFilterState(next);
    },
    [],
  );

  return { sessions, loading, loadingMore, hasMore, statusFilter, setStatusFilter, loadMore };
}
