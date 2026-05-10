"use client";

import { Icon } from "@/components/ui";

interface TodayDataLike {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  workoutsToday: number;
  food: Array<{ quality: string | null }>;
}

interface HealthGoalLike {
  kind: string;
  targetInt: number | null;
}

interface DailySummaryProps {
  today: TodayDataLike;
  goals: HealthGoalLike[];
  workoutsWeeklyTarget: number | null;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function formatCompactInt(value: number): string {
  if (value >= 1000) {
    const k = Math.round((value / 1000) * 10) / 10;
    return `${String(k).replace(".", ",")}k`;
  }
  return String(value);
}

function formatMinutesAsHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function getGoalInt(goals: HealthGoalLike[], kind: string): number | null {
  const g = goals.find((x) => x.kind === kind);
  if (!g) return null;
  return g.targetInt ?? null;
}

function ringArcPath(cx: number, cy: number, r: number, pct: number): string {
  const clamped = clamp01(pct);
  const end = (Math.PI * 2 * clamped) - Math.PI / 2;
  const x = cx + r * Math.cos(end);
  const y = cy + r * Math.sin(end);
  const largeArc = clamped > 0.5 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
}

function SingleRing({
  size,
  pct,
  color,
  iconName,
}: {
  size: number;
  pct: number;
  color: string;
  iconName: React.ComponentProps<typeof Icon>["name"];
}) {
  const r = Math.round(size * 0.38);
  const center = size / 2;
  const stroke = Math.max(3, Math.round(size * 0.08));

  return (
    <div className="daily-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          opacity="0.18"
        />
        <path
          d={ringArcPath(center, center, r, pct)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ transition: "d .2s ease" }}
        />
      </svg>
      <div className="daily-ring-icon">
        <Icon name={iconName} size={Math.round(size * 0.38)} color="var(--text)" />
      </div>
    </div>
  );
}

function MultiRings({
  size,
  values,
}: {
  size: number;
  values: Array<{ pct: number; color: string }>;
}) {
  const center = size / 2;
  const baseR = size * 0.38;
  const gap = size * 0.06;
  const stroke = Math.max(3, Math.round(size * 0.07));

  return (
    <div className="daily-multi" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {values.map((r, idx) => {
          const radius = baseR - idx * gap;
          const circumference = 2 * Math.PI * radius;
          return (
            <g key={idx}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={stroke}
                opacity="0.18"
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - clamp01(r.pct))}
                style={{ transition: "stroke-dashoffset .6s ease" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DailySummary({ today, goals, workoutsWeeklyTarget }: DailySummaryProps) {
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

  return (
    <div className="daily-summary">
      <div className="daily-top">
        <div className="daily-label">RESUMEN DE HOY</div>
        <div className="daily-score">
          <span className="daily-score-value" style={{ color: scoreColor }}>
            {dailyScore}
          </span>
          <span className="daily-score-unit">/100</span>
        </div>
      </div>

      <div className="daily-mobile">
        <div className="daily-mobile-left">
          <MultiRings
            size={92}
            values={[
              { pct: stepsPct, color: "var(--lime)" },
              { pct: sleepPct, color: "var(--sleep)" },
              { pct: mealsPct, color: "var(--warn)" },
              { pct: activityPct, color: "var(--info)" },
            ]}
          />
          <div className="daily-mobile-center">
            <span className="daily-mobile-score" style={{ color: scoreColor }}>
              {dailyScore}
            </span>
          </div>
        </div>

        <div className="daily-mobile-right">
          <div className="daily-goal-line">
            <Icon name="footprints" size={16} color="var(--lime)" />
            <span className="daily-goal-text">
              {formatCompactInt(steps)} / {formatCompactInt(stepsTarget)} pasos
            </span>
          </div>
          <div className="daily-goal-line">
            <Icon name="moon" size={16} color="var(--sleep)" />
            <span className="daily-goal-text">
              {formatMinutesAsHm(sleep)} / {formatMinutesAsHm(sleepTarget)}
            </span>
          </div>
          <div className="daily-goal-line">
            <Icon name="beef" size={16} color="var(--warn)" />
            <span className="daily-goal-text">
              {goodMeals} / {mealsGoodTarget} comidas buenas
            </span>
          </div>
          <div className="daily-goal-line">
            <Icon name="dumbbell" size={16} color="var(--info)" />
            <span className="daily-goal-text">
              {workouts} / {activityTarget} entreno{activityTarget === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="daily-desktop">
        <div className="daily-grid">
          <div className="daily-item">
            <SingleRing size={76} pct={stepsPct} color="var(--lime)" iconName="footprints" />
            <div className="daily-item-label">Pasos</div>
            <div className="daily-item-sub">{formatCompactInt(steps)} / {formatCompactInt(stepsTarget)}</div>
          </div>
          <div className="daily-item">
            <SingleRing size={76} pct={sleepPct} color="var(--sleep)" iconName="moon" />
            <div className="daily-item-label">Sueño</div>
            <div className="daily-item-sub">{formatMinutesAsHm(sleep)} / {formatMinutesAsHm(sleepTarget)}</div>
          </div>
          <div className="daily-item">
            <SingleRing size={76} pct={mealsPct} color="var(--warn)" iconName="beef" />
            <div className="daily-item-label">Comida</div>
            <div className="daily-item-sub">{goodMeals} / {mealsGoodTarget} buena{mealsGoodTarget === 1 ? "" : "s"}</div>
          </div>
          <div className="daily-item">
            <SingleRing size={76} pct={activityPct} color="var(--info)" iconName="dumbbell" />
            <div className="daily-item-label">Actividad</div>
            <div className="daily-item-sub">{workouts} / {activityTarget} entreno{activityTarget === 1 ? "" : "s"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
