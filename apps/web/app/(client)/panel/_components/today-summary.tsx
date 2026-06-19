"use client";

import { Icon } from "@/components/ui";

interface TodayDataLike {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  energyRating: number | null;
  workoutsToday: number;
  food: Array<{ quality: string | null }>;
}

interface HealthGoalLike {
  kind: string;
  targetInt: number | null;
}

interface TodaySummaryProps {
  today: TodayDataLike;
  goals: HealthGoalLike[];
  workoutsWeeklyTarget: number | null;
  onSteps?: () => void;
  onSleep?: () => void;
  onFood?: () => void;
  onWorkout?: () => void;
}

function getGoalInt(goals: HealthGoalLike[], kind: string): number | null {
  const g = goals.find((x) => x.kind === kind);
  return g?.targetInt ?? null;
}

function formatCompact(value: number): string {
  if (value >= 1000) {
    const k = Math.round((value / 1000) * 10) / 10;
    return `${String(k).replace(".", ",")}k`;
  }
  return String(value);
}

function formatMinutesHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function Ring({ pct, color, iconName }: { pct: number; color: string; iconName: string }) {
  const r = 18;
  const c = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamp01(pct));
  return (
    <div style={{ width: 40, height: 40, position: "relative" }}>
      <svg width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={3} opacity="0.15" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset .4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={iconName as any} size={14} color={color} />
      </div>
    </div>
  );
}

export function TodaySummary({ today, goals, workoutsWeeklyTarget, onSteps, onSleep, onFood, onWorkout }: TodaySummaryProps) {
  const stepsTarget = getGoalInt(goals, "steps") ?? 6000;
  const sleepTarget = getGoalInt(goals, "sleep") ?? 420;
  const mealsGoodTarget = getGoalInt(goals, "mealsGood") ?? 3;
  const activityTarget = Math.max(1, Math.round((workoutsWeeklyTarget ?? 4) / 7));

  const steps = today.steps ?? 0;
  const sleep = today.sleepMinutes ?? 0;
  const goodMeals = today.food.filter((x) => x.quality === "good").length;
  const workouts = today.workoutsToday;

  const stepsPct = stepsTarget > 0 ? clamp01(steps / stepsTarget) : 0;
  const sleepPct = sleepTarget > 0 ? clamp01(sleep / sleepTarget) : 0;
  const mealsPct = mealsGoodTarget > 0 ? clamp01(goodMeals / mealsGoodTarget) : 0;
  const activityPct = activityTarget > 0 ? clamp01(workouts / activityTarget) : 0;

  const dailyScore = Math.round((stepsPct + sleepPct + mealsPct + activityPct) * 25);
  const scoreColor = dailyScore >= 80 ? "var(--lime)" : dailyScore >= 50 ? "var(--warn)" : "var(--danger)";

  const items = [
    { icon: "footprints" as const, label: "Pasos", sub: `${formatCompact(steps)}/${formatCompact(stepsTarget)}`, pct: stepsPct, color: "var(--lime)", hasData: steps > 0, onClick: onSteps },
    { icon: "moon" as const, label: "Sueño", sub: `${formatMinutesHm(sleep)}/${formatMinutesHm(sleepTarget)}`, pct: sleepPct, color: "var(--sleep)", hasData: sleep > 0, onClick: onSleep },
    { icon: "beef" as const, label: "Comida", sub: `${goodMeals}/${mealsGoodTarget}`, pct: mealsPct, color: "var(--warn)", hasData: today.food.length > 0, onClick: onFood },
    { icon: "dumbbell" as const, label: "Actividad", sub: `${workouts}/${activityTarget}`, pct: activityPct, color: "var(--info)", hasData: workouts > 0, onClick: onWorkout },
  ];

  return (
    <div className="panel-card today-summary">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Resumen de hoy
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
          {dailyScore}<span style={{ fontSize: 12, color: "var(--text-mute)" }}>/100</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              cursor: item.onClick ? "pointer" : "default",
              padding: "4px 0",
              borderRadius: 8,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => item.onClick && (e.currentTarget.style.background = "var(--bg-2)")}
            onMouseLeave={(e) => item.onClick && (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ position: "relative" }}>
              <Ring pct={item.pct} color={item.color} iconName={item.icon} />
              {!item.hasData && item.onClick && (
                <div style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--lime)",
                  color: "var(--bg-1)",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}>
                  +
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text)", textAlign: "center" }}>{item.label}</div>
            <div style={{ fontSize: 9, color: "var(--text-mute)", textAlign: "center" }}>{item.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
