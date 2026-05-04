"use client";

// components/fuerza-aerobico-row.tsx — Cards de Fuerza y Aeróbico lado a lado

import { MetricCard } from "./metric-card";
import { DotProgress } from "./dot-progress";

interface FuerzaAerobicoRowProps {
  strengthCompleted: number;
  strengthTarget: number | null;
  cardioCompleted: number;
  cardioTarget: number | null;
}

export function FuerzaAerobicoRow({
  strengthCompleted,
  strengthTarget,
  cardioCompleted,
  cardioTarget,
}: FuerzaAerobicoRowProps) {
  const strengthTargetCount = strengthTarget ?? 4;
  const cardioTargetCount = cardioTarget ?? 2;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <MetricCard
        label="FUERZA"
        value={String(strengthCompleted)}
        sub={`de ${strengthTargetCount} esta sem`}
        accent="var(--lime)"
      >
        <DotProgress count={strengthTargetCount} done={strengthCompleted} color="var(--lime)" />
      </MetricCard>

      <MetricCard
        label="AERÓBICO"
        value={String(cardioCompleted)}
        sub={`de ${cardioTargetCount} esta sem`}
        accent="#7AB8FF"
      >
        <DotProgress count={cardioTargetCount} done={cardioCompleted} color="#7AB8FF" />
      </MetricCard>
    </div>
  );
}