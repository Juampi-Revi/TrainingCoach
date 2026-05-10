"use client";

// components/steps-sleep-row.tsx — Cards de Pasos y Sueño lado a lado

import { MetricCard } from "./metric-card";
import { MiniBars } from "./mini-bars";
import { SleepRing } from "./sleep-ring";

interface StepsSleepRowProps {
  stepsAvg: number | null;
  dailySteps: (number | null)[];
  sleepMinutesAvg: number | null;
  dailySleepMinutes: (number | null)[];
}

export function StepsSleepRow({
  stepsAvg,
  dailySteps,
  sleepMinutesAvg,
  dailySleepMinutes,
}: StepsSleepRowProps) {
  const stepsK = stepsAvg !== null ? Math.round(stepsAvg / 100) / 10 : null;
  const sleepHours = sleepMinutesAvg !== null ? sleepMinutesAvg / 60 : null;

  // Convert daily steps to thousands
  const dailyStepsK = dailySteps.map((s) => (s !== null ? Math.round(s / 100) / 10 : null));

  // Calculate trend (comparing last 3 days vs first 3 days)
  const trend = calculateTrend(dailySteps);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8 }}>
      <MetricCard
        label="PASOS · 7D"
        value={stepsK !== null ? stepsK.toFixed(1).replace(".", ",") + "k" : "—"}
        sub={stepsK !== null ? "prom diario · meta 6k" : "no registrado"}
        trend={trend}
        accent="var(--lime)"
      >
        <MiniBars data={dailyStepsK} target={6} color="var(--lime)" unit="k" />
      </MetricCard>

      <MetricCard
        label="SUEÑO"
        value={sleepHours !== null ? formatSleepH(sleepHours) : "—"}
        sub={sleepHours !== null ? "prom · meta 7h" : "no registrado"}
        accent="var(--sleep)"
      >
        {sleepHours !== null && (
          <SleepRing hours={sleepHours} targetHours={7} size={38} />
        )}
      </MetricCard>
    </div>
  );
}

function calculateTrend(dailySteps: (number | null)[]): string | undefined {
  const validSteps = dailySteps.filter((s): s is number => s !== null);
  if (validSteps.length < 6) return undefined;

  const firstHalf = validSteps.slice(0, Math.floor(validSteps.length / 2));
  const secondHalf = validSteps.slice(Math.floor(validSteps.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avgFirst === 0) return undefined;

  const pct = ((avgSecond - avgFirst) / avgFirst) * 100;
  return `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`;
}

function formatSleepH(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
