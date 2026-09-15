"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuickFoodLogger } from "@/app/(client)/panel/_components/quick-food-logger";
import { Tabs } from "@/components/ui";
import { useFoodData } from "./_hooks/use-food-data";
import { useNutritionToday } from "./_hooks/use-nutrition";
import { FoodHistory } from "./_components/food-history";
import { NutritionSummary } from "./_components/nutrition-summary";
import { MacroRings } from "./_components/macro-rings";
import { MacrosCalculator } from "./_components/macros-calculator";
import { MacroFoodLogger, type PlateFood } from "./_components/macro-food-logger";
import { MealIdeas } from "./_components/meal-ideas";
import "./_styles.css";

const PAGE_TABS = ["Hoy", "Objetivo", "Historial"] as const;

function ChevronLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function weekLabel(weekStart: string): string {
  const s = new Date(weekStart);
  const e = new Date(s.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function ComidaPage() {
  const router = useRouter();
  const { entries, dashboard, loading, refresh } = useFoodData();
  const nutrition = useNutritionToday();
  const [tab, setTab] = useState<string>("Hoy");
  const [mode, setMode] = useState("Macros");
  const [plateSeed, setPlateSeed] = useState<PlateFood[] | null>(null);

  const good = dashboard?.foodGood ?? 0;
  const regular = dashboard?.foodRegular ?? 0;
  const poor = dashboard?.foodPoor ?? 0;
  const todayEntries = useMemo(() => (entries ?? []).filter((e) => isToday(e.loggedAt)), [entries]);
  const pastEntries = useMemo(() => (entries ?? []).filter((e) => !isToday(e.loggedAt)), [entries]);

  async function refreshAll() {
    await Promise.all([refresh(), nutrition.refetch()]);
  }

  return (
    <div className="comida-page">
      <div className="comida-header">
        <button onClick={() => router.push("/panel")} className="comida-back" aria-label="Volver">
          <ChevronLeftIcon />
        </button>
        <div>
          <div className="comida-title">Mi comida</div>
          {dashboard && (
            <div className="comida-subtitle">
              Semana {dashboard.weekNumber} de {dashboard.totalWeeks} · {weekLabel(dashboard.weekStart)}
            </div>
          )}
        </div>
      </div>

      <div className="comida-content">
        <Tabs variant="pills" tabs={[...PAGE_TABS]} active={tab} onChange={setTab} />

        {tab === "Hoy" && (
          <>
            <MacroRings
              consumed={nutrition.data?.consumed ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }}
              target={nutrition.data?.target ?? null}
            />
            {!nutrition.data?.target && (
              <button type="button" className="comida-setup" onClick={() => setTab("Objetivo")}>
                Todavía no hay objetivo. Calculalo en Objetivo — usamos tu peso y altura.
              </button>
            )}
            <Tabs variant="pills" tabs={["Macros", "Rápido"]} active={mode} onChange={setMode} />
            <div className="comida-logger-wrapper">
              {mode === "Macros" ? (
                <MacroFoodLogger
                  onSaved={refreshAll}
                  incoming={plateSeed}
                  onIncomingUsed={() => setPlateSeed(null)}
                />
              ) : (
                <QuickFoodLogger embedded onSaved={refreshAll} />
              )}
            </div>
            <MealIdeas
              remaining={nutrition.data?.remaining ?? null}
              hasTarget={Boolean(nutrition.data?.target)}
              onLogged={refreshAll}
              onAddToPlate={(items) => {
                setMode("Macros");
                setPlateSeed(items);
              }}
            />
            <FoodHistory
              entries={todayEntries}
              loading={loading}
              onRefresh={refreshAll}
              title="Comidas de hoy"
              emptyTitle="Todavía no cargaste nada hoy"
              emptyBody="Sumá un alimento o registrá uno de los platos de arriba."
            />
          </>
        )}

        {tab === "Objetivo" && (
          <MacrosCalculator
            profile={nutrition.data?.profile ?? null}
            target={nutrition.data?.target ?? null}
            onSaved={refreshAll}
          />
        )}

        {tab === "Historial" && (
          <>
            <div className="comida-stats-grid">
              <div className="stat-card">
                <div className="stat-label" style={{ color: "var(--success)" }}>BUENAS</div>
                <div className="stat-value" style={{ color: "var(--success)" }}>{good}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label" style={{ color: "var(--warn)" }}>REGULARES</div>
                <div className="stat-value" style={{ color: "var(--warn)" }}>{regular}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label" style={{ color: "var(--danger)" }}>POBRES</div>
                <div className="stat-value" style={{ color: "var(--danger)" }}>{poor}</div>
              </div>
              <div className="stat-card total">
                <div className="stat-label">TOTAL</div>
                <div className="stat-value" style={{ color: "var(--lime)" }}>{good + regular + poor}</div>
              </div>
            </div>
            <div className="comida-bottom-grid">
              <div className="comida-nutrition-section">
                <NutritionSummary good={good} regular={regular} poor={poor} />
              </div>
              <div className="comida-history-section">
                <FoodHistory
                  entries={pastEntries}
                  loading={loading}
                  onRefresh={refreshAll}
                  title="Días anteriores"
                  emptyTitle="Sin historial todavía"
                  emptyBody="Las comidas de hoy se ven en Hoy. Acá aparecen los días previos."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
