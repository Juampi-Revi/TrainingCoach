import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { ClientDetail, ApiClientResponse } from "../_components/_types";

interface UseClientDetailResult {
  client: ClientDetail | null;
  loading: boolean;
  setClient: React.Dispatch<React.SetStateAction<ClientDetail | null>>;
}

export function useClientDetail(clientUserId: string): UseClientDetailResult {
  const { api } = useAuth();
  const toast = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiClientResponse>(`/coach/clients/${clientUserId}`)
      .then((data) => {
        setClient({
          ...data.client,
          recentSessions: data.recentSessions,
          weightHistory: (data.weightHistory ?? [])
            .filter((w) => w.weightKg != null)
            .map((w) => ({
              recordedAt: w.measuredAt,
              weight: parseFloat(w.weightKg!),
            })),
        });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error cargando alumno"))
      .finally(() => setLoading(false));
  }, [api, clientUserId, toast]);

  return { client, loading, setClient };
}
