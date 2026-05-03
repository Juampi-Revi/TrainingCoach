"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui";
import { useProgresoData } from "./_hooks/use-progreso-data";
import { DashboardTab } from "./_components/dashboard-tab";
import { ActivityTab } from "./_components/activity-tab";
import { SleepTab } from "./_components/sleep-tab";
import { MetricsTab } from "./_components/metrics-tab";
import { FoodTab } from "./_components/food-tab";
import { SessionsTab } from "./_components/sessions-tab";
import type { TabKey } from "./_components/_types";

export default function ProgresoPage() {
  const [tab, setTab] = useState<TabKey>("Dashboard");

  const {
    health,
    metrics,
    food,
    goals,
    summary,
    sessions,
    activity30,
    muscles30,
    exerciseList,
    selectedExerciseId,
    setSelectedExerciseId,
    progression,
    effectiveExerciseId,
    onHealthLoadRef,
    loadHealth,
    loadMetrics,
    loadFood,
    loadGoals,
    loadSummary,
  } = useProgresoData();

  // SleepTab and ActivityTab both navigate the user to the Dashboard daily form on row click.
  // We switch to Dashboard when a day row is clicked so the form shows.
  function handleSelectDay(day: string) {
    void day; // day selection navigates to Dashboard; DashboardTab owns that form state
    setTab("Dashboard");
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Progreso</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          Dashboard, salud, comidas, mediciones y entrenamientos
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Tabs
          variant="pills"
          tabs={["Dashboard", "Actividad", "Sueño", "Mediciones", "Comidas", "Entrenamientos"]}
          active={tab}
          onChange={(t) => setTab(t as TabKey)}
        />
      </div>

      {tab === "Dashboard" && (
        <DashboardTab
          health={health}
          metrics={metrics}
          sessions={sessions}
          summary={summary}
          activity30={activity30}
          goals={goals}
          onHealthLoadRef={onHealthLoadRef}
          loadHealth={loadHealth}
          loadGoals={loadGoals}
          loadSummary={loadSummary}
        />
      )}

      {tab === "Actividad" && (
        <ActivityTab health={health} onSelectDay={handleSelectDay} />
      )}

      {tab === "Sueño" && (
        <SleepTab health={health} onSelectDay={handleSelectDay} />
      )}

      {tab === "Mediciones" && (
        <MetricsTab metrics={metrics} loadMetrics={loadMetrics} />
      )}

      {tab === "Comidas" && (
        <FoodTab food={food} loadFood={loadFood} loadSummary={loadSummary} />
      )}

      {tab === "Entrenamientos" && (
        <SessionsTab
          sessions={sessions}
          muscles30={muscles30}
          exerciseList={exerciseList}
          selectedExerciseId={selectedExerciseId}
          effectiveExerciseId={effectiveExerciseId}
          setSelectedExerciseId={setSelectedExerciseId}
          progression={progression}
        />
      )}
    </div>
  );
}
