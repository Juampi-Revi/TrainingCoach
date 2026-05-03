import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ClientDetail, ApiClientResponse } from "../_components/_types";

interface UseClientDetailResult {
  client: ClientDetail | null;
  loading: boolean;
  setClient: React.Dispatch<React.SetStateAction<ClientDetail | null>>;
}

export function useClientDetail(clientUserId: string): UseClientDetailResult {
  const { api } = useAuth();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiClientResponse>(`/coach/clients/${clientUserId}`)
      .then((data) => {
        setClient({
          ...data.client,
          recentSessions: data.recentSessions,
          weightHistory: data.weightHistory.map((w) => ({
            recordedAt: w.measuredAt,
            weight: w.weightKg ? parseFloat(w.weightKg) : 0,
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, clientUserId]);

  return { client, loading, setClient };
}
