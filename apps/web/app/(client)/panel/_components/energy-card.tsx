"use client";

// components/energy-card.tsx — Card de energía diaria con barras

import { MetricCard } from "./metric-card";
import { EnergyBars } from "./energy-bars";

interface EnergyCardProps {
  energyAvg: number | null;
  dailyEnergy: (number | null)[];
}

export function EnergyCard({ energyAvg, dailyEnergy }: EnergyCardProps) {
  const value = energyAvg !== null ? energyAvg.toFixed(1).replace(".", ",") : "—";
  const sub = energyAvg !== null ? "/ 5 · prom 7 días" : "sin datos";

  return (
    <MetricCard label="ENERGÍA · DIARIA" value={value} sub={sub} accent="#7AB8FF">
      <EnergyBars data={dailyEnergy} />
    </MetricCard>
  );
}