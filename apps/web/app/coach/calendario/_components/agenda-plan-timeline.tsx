"use client";

import { useMemo } from "react";
import type { CoachClientSummary } from "@regen/types";
import { AgendaPlanTimelineGrid } from "./agenda-plan-timeline-grid";

const DAY_MS = 86_400_000;

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonthUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonthsUTC(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function hashStr(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function toneFor(planId: string) {
  const tones = ["var(--lime)", "var(--warn)", "var(--success)", "var(--accent-text)"] as const;
  return tones[hashStr(planId) % tones.length];
}

type Row = {
  client: CoachClientSummary;
  planId: string;
  planTitle: string;
  start: Date | null;
  end: Date | null;
  totalDays: number | null;
  status: string;
  tone: string;
};

export function AgendaPlanTimeline({
  clients,
  rangeStart,
  monthsSpan,
  filter: { clientId, planId, assignmentStatus },
}: {
  clients: CoachClientSummary[];
  rangeStart: Date;
  monthsSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  filter: { clientId: string; planId: string; assignmentStatus: string };
}) {
  const start = startOfMonthUTC(rangeStart);
  const endExclusive = addMonthsUTC(start, monthsSpan);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const c of clients) {
      if (clientId && c.id !== clientId) continue;
      const a = c.assignment;
      if (!a || !a.plan) continue;
      if (planId && a.plan.id !== planId) continue;
      if (assignmentStatus && a.status !== assignmentStatus) continue;

      const periodDays = typeof a.plan.periodDays === "number" && a.plan.periodDays > 0 ? a.plan.periodDays : 7;
      const totalDays = a.plan.weeksCount > 0 ? a.plan.weeksCount * periodDays : null;
      const startDate = a.startDate ? startOfDayUTC(new Date(a.startDate)) : null;
      const endDate =
        startDate && totalDays != null
          ? new Date(startDate.getTime() + (totalDays - 1) * DAY_MS)
          : null;

      out.push({
        client: c,
        planId: a.plan.id,
        planTitle: a.plan.title,
        start: startDate,
        end: endDate,
        totalDays,
        status: a.status,
        tone: toneFor(a.plan.id),
      });
    }
    out.sort((a, b) => {
      const aName = (a.client.name ?? a.client.email).toLowerCase();
      const bName = (b.client.name ?? b.client.email).toLowerCase();
      return aName.localeCompare(bName);
    });
    return out;
  }, [assignmentStatus, clientId, clients, planId]);

  return <AgendaPlanTimelineGrid rows={rows} rangeStart={start} rangeEndExclusive={endExclusive} monthsSpan={monthsSpan} />;
}
