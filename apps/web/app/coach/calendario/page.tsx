"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { Button, StateBlock, Tabs } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { CoachCalendarItem, CoachCalendarResponse, CoachClientSummary, PlanSummary } from "@regen/types";
import { AgendaWeekOverview } from "./_components/agenda-week-overview";
import { AgendaDayGroups } from "./_components/agenda-day-groups";
import { AgendaPlanTimeline } from "./_components/agenda-plan-timeline";
import { AgendaActionableIssues } from "./_components/agenda-actionable-issues";
import { AgendaFilters } from "./_components/agenda-filters";
import { useAgendaUrlState } from "./_hooks/use-agenda-url-state";
import { useAgendaProgressionNoteEditor } from "./_hooks/use-agenda-progression-note-editor";

function monthInputValue(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function CoachCalendarPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const {
    mode, setMode,
    calendarMode, setCalendarMode,
    anchor, setAnchor,
    clientId, setClientId,
    planId, setPlanId,
    assignmentStatus, setAssignmentStatus,
    status, setStatus,
    monthsSpan, setMonthsSpan,
    days, startStr,
    startOfDayUTC, startOfWeekUTC,
    startOfMonthUTC,
  } = useAgendaUrlState();

  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [data, setData] = useState<CoachCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { openNote, modal: noteModal } = useAgendaProgressionNoteEditor({ api, setData });

  useEffect(() => {
    api
      .get<CoachClientSummary[]>("/coach/clients")
      .then(setClients)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo cargar alumnos"));
  }, [api, toast]);

  useEffect(() => {
    api
      .get<PlanSummary[]>("/coach/plans")
      .then(setPlans)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo cargar planes"));
  }, [api, toast]);

  useEffect(() => {
    if (mode === "Mes") {
      return;
    }
    const qs = new URLSearchParams({ start: startStr, days: String(days) });
    if (clientId) qs.set("clientId", clientId);
    if (planId) qs.set("planId", planId);
    if (assignmentStatus) qs.set("assignmentStatus", assignmentStatus);
    if (status) qs.set("status", status);
    qs.set("mode", calendarMode);

    api
      .get<CoachCalendarResponse>(`/coach/calendar?${qs.toString()}`)
      .then(setData)
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar agenda");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [api, days, clientId, planId, startStr, status, toast, assignmentStatus, calendarMode, mode]);

  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    const map = new Map<string, CoachCalendarItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ date: k, items: (map.get(k) ?? []).sort((a, b) => (a.client.email > b.client.email ? 1 : -1)) }));
  }, [data?.items]);

  return (
    <DesktopShell
      active="calendar"
      title="Agenda"
      subtitle={mode === "Semana" ? `Semana desde ${startStr}` : mode === "Día" ? startStr : `Mes desde ${startStr}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button variant="outline" size="sm" icon="users" onClick={() => window.location.assign("/coach/alumnos")}>
            Alumnos
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="chevL"
            onClick={() => {
              if (mode === "Mes") {
                setLoading(false);
                setAnchor(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1)));
                return;
              }
              setLoading(true);
              setAnchor(new Date(anchor.getTime() - days * 86_400_000));
            }}
          >
            {mode === "Semana" ? "Semana" : mode === "Día" ? "Día" : "Mes"} anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mode === "Mes") {
                setLoading(false);
                setAnchor(startOfMonthUTC(new Date()));
                return;
              }
              setLoading(true);
              setAnchor(mode === "Semana" ? startOfWeekUTC(new Date()) : startOfDayUTC(new Date()));
            }}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconRight="chevR"
            onClick={() => {
              if (mode === "Mes") {
                setLoading(false);
                setAnchor(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1)));
                return;
              }
              setLoading(true);
              setAnchor(new Date(anchor.getTime() + days * 86_400_000));
            }}
          >
            {mode === "Semana" ? "Semana" : mode === "Día" ? "Día" : "Mes"} siguiente
          </Button>
        </>
      }
    >
      <div className="coach-pad">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Tabs
                tabs={["Semana", "Día", "Mes"]}
                active={mode}
                onChange={(t) => {
                  const next = t as "Semana" | "Día" | "Mes";
                  setLoading(next === "Mes" ? false : true);
                  setMode(next);
                  if (next === "Semana") setAnchor(startOfWeekUTC(anchor));
                  if (next === "Día") setAnchor(startOfDayUTC(anchor));
                  if (next === "Mes") setAnchor(startOfMonthUTC(anchor));
                }}
                variant="pills"
              />
              {mode !== "Mes" && (
                <Tabs
                  tabs={["Flexible", "Plan fijo"]}
                  active={calendarMode === "flex" ? "Flexible" : "Plan fijo"}
                  onChange={(t) => {
                    setLoading(true);
                    setCalendarMode(t === "Plan fijo" ? "fixed" : "flex");
                  }}
                  variant="pills"
                />
              )}
              {mode === "Mes" && (
                <>
                  <Tabs
                    tabs={["1 mes", "2 meses", "3 meses"]}
                    active={monthsSpan === 1 ? "1 mes" : monthsSpan === 2 ? "2 meses" : "3 meses"}
                    onChange={(t) => {
                      setLoading(false);
                      if (t === "1 mes") setMonthsSpan(1);
                      if (t === "2 meses") setMonthsSpan(2);
                      if (t === "3 meses") setMonthsSpan(3);
                    }}
                    variant="pills"
                  />

                  <select
                    value={monthsSpan > 3 ? String(monthsSpan) : ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!v) return;
                      setLoading(false);
                      setMonthsSpan(v as 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12);
                    }}
                    style={{
                      height: 34,
                      minWidth: 128,
                      background: "var(--bg-1)",
                      border: "1px solid var(--line-2)",
                      borderRadius: 10,
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--text)",
                      outline: "none",
                    }}
                    title="Rango personalizado"
                  >
                    <option value="">Más…</option>
                    <option value="4">4 meses</option>
                    <option value="5">5 meses</option>
                    <option value="6">6 meses</option>
                    <option value="7">7 meses</option>
                    <option value="8">8 meses</option>
                    <option value="9">9 meses</option>
                    <option value="10">10 meses</option>
                    <option value="11">11 meses</option>
                    <option value="12">12 meses</option>
                  </select>

                  <input
                    type="month"
                    value={monthInputValue(anchor)}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split("-").map((x) => Number(x));
                      if (!y || !m) return;
                      setLoading(false);
                      setAnchor(new Date(Date.UTC(y, m - 1, 1)));
                    }}
                    style={{
                      height: 34,
                      minWidth: 150,
                      background: "var(--bg-1)",
                      border: "1px solid var(--line-2)",
                      borderRadius: 10,
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--text)",
                      outline: "none",
                    }}
                    title="Elegir mes de inicio"
                  />
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              icon="filter"
              onClick={() => setFiltersOpen((open) => !open)}
              title={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            >
              Filtros
            </Button>
          </div>

          {filtersOpen && (
            <AgendaFilters
              clients={clients}
              plans={plans}
              clientId={clientId}
              planId={planId}
              assignmentStatus={assignmentStatus}
              status={status}
              showSessionStatus={mode !== "Mes"}
              onClientChange={(value) => {
                setLoading(true);
                setClientId(value);
              }}
              onPlanChange={(value) => {
                setLoading(true);
                setPlanId(value);
              }}
              onAssignmentStatusChange={(value) => {
                setLoading(true);
                setAssignmentStatus(value);
              }}
              onStatusChange={(value) => {
                setLoading(true);
                setStatus(value);
              }}
            />
          )}
        </div>

        {noteModal}
        <AgendaActionableIssues mode={mode} clientId={clientId} loading={loading} data={data} calendarMode={calendarMode} />

        {mode === "Mes" ? (
          <AgendaPlanTimeline
            clients={clients}
            rangeStart={anchor}
            monthsSpan={monthsSpan}
            filter={{ clientId, planId, assignmentStatus }}
          />
        ) : loading ? (
          <StateBlock kind="loading" title="Cargando agenda…" />
        ) : !data ? (
          <StateBlock kind="error" title="No se pudo cargar agenda" />
        ) : grouped.length === 0 && (calendarMode === "fixed" || status !== "pending") && (data.weekOverview?.length ?? 0) === 0 ? (
          <StateBlock kind="empty" title="Sin entrenos en el rango" body="Probá cambiando filtros o moviéndote de semana." />
        ) : (
          <>
            {mode === "Semana" && calendarMode === "flex" && (data.weekOverview?.length ?? 0) > 0 && (
              <AgendaWeekOverview weekOverview={data.weekOverview ?? []} onEditNote={openNote} />
            )}
            {grouped.length > 0 && (
              <AgendaDayGroups grouped={grouped} mode={calendarMode} onEditNote={openNote} />
            )}
          </>
        )}
      </div>
    </DesktopShell>
  );
}
