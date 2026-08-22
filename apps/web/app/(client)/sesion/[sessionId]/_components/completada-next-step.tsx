"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { celebrate } from "@/lib/celebration";
import type { ClientWeekResponse, SessionDetail } from "@regen/types";
import "../_styles.css";

export function CompletadaHeroExtras({
  session,
  totalSets,
  targetSets,
  isPartial,
}: {
  session: SessionDetail;
  totalSets: number;
  targetSets: number;
  isPartial: boolean;
}) {
  const perfect = !isPartial && targetSets > 0 && totalSets >= targetSets;
  const workCount = session.exercises.filter((e) => e.block?.type !== "warmup").length;

  useEffect(() => {
    if (isPartial) return;
    celebrate({ duration: perfect ? 2200 : 1400, particleCount: perfect ? 110 : 70 });
  }, [isPartial, perfect]);

  if (isPartial) return null;

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
      {perfect && <span className="completada-badge">Sesión completa</span>}
      {!perfect && totalSets > 0 && <span className="completada-badge">Buen trabajo</span>}
      {workCount > 0 && (
        <span className="completada-badge" style={{ color: "var(--text-mute)", borderColor: "var(--line-2)", background: "var(--bg-2)" }}>
          {workCount} ejercicios
        </span>
      )}
    </div>
  );
}

export function CompletadaNextStep({ sessionId }: { sessionId: string }) {
  const { api } = useAuth();
  const router = useRouter();
  const [nextTitle, setNextTitle] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ClientWeekResponse>("/client/week")
      .then((week) => {
        if (!week?.workouts?.length) return;
        const pending = week.workouts.find((w) => {
          const st = w.session?.status;
          return !st || st === "pending" || st === "in_progress" || st === "discarded";
        });
        if (pending) setNextTitle(pending.title);
      })
      .catch(() => {
        /* silent — CTA genérico */
      });
  }, [api]);

  return (
    <div className="completada-next">
      <div className="completada-next__title">Bien hecho. Seguí el plan.</div>
      <div className="completada-next__sub">
        {nextTitle ? `Próximo en la semana: ${nextTitle}` : "Volvé a la semana para ver qué sigue."}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="md" style={{ flex: 1 }} onClick={() => router.push("/semana")}>
          Ver semana
        </Button>
        <Button size="md" variant="secondary" style={{ flex: 1 }} onClick={() => router.push(`/comentarios/${sessionId}`)}>
          <Icon name="msg" size={14} />
          Contar al coach
        </Button>
      </div>
    </div>
  );
}
