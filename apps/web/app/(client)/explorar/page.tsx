"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Button, Icon, StateBlock } from "@/components/ui";

type PublicPlan = {
  id: string; title: string; goal: string | null; notes: string | null;
  weeksCount: number; periodDays: number; planType: string;
  coach: { id: string; name: string | null; avatarUrl: string | null };
  enrollmentCount: number;
};

export default function ExplorarPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    api
      .get<PublicPlan[]>(`/plans/public?${params.toString()}`)
      .then(setPlans)
      .catch(() => toast.error("No se pudieron cargar los planes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [api]);

  async function subscribe(planId: string) {
    try {
      await api.post(`/client/plans/${planId}/subscribe`, {});
      toast.success("Plan asignado. Ya podés empezar a entrenar.");
      router.push("/semana");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo asignar el plan");
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Explorar planes</div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
          Elegí un plan y empezá a entrenar
        </div>
      </div>

      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
          <Icon name="search" size={14} color="var(--text-mute)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Buscar plan…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
          />
          {search.trim() && <Button size="sm" onClick={load}>Buscar</Button>}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {loading ? (
          <StateBlock kind="loading" title="Cargando planes…" />
        ) : plans.length === 0 ? (
          <StateBlock kind="empty" title="Sin resultados" body={search ? "Probá con otro término" : "No hay planes públicos todavía"} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plans.map((p) => (
              <div key={p.id} style={{ padding: 16, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
                      {p.weeksCount} semanas · {p.periodDays} días/sem
                      {p.planType !== "personal" ? ` · ${p.planType}` : ""}
                    </div>
                    {p.goal && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>{p.goal}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <Avatar name={p.coach.name ?? "Coach"} src={p.coach.avatarUrl} size={22} />
                      <span style={{ fontSize: 12, color: "var(--text-mute)" }}>{p.coach.name ?? "Coach"}</span>
                      {p.enrollmentCount > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>· {p.enrollmentCount} alumnos</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" icon="plus" onClick={() => subscribe(p.id)}>
                    Empezar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
