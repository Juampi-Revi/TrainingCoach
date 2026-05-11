"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AssignmentStatus, SessionStatus } from "@regen/types";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonthUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeekUTC(date: Date) {
  const d = startOfDayUTC(date);
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * 86_400_000);
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDateUTC(value: string | null) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

function readInitialQuery() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

export function useAgendaUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"Semana" | "Día" | "Mes">(() => {
    const v = readInitialQuery()?.get("view");
    if (v === "day") return "Día";
    if (v === "month") return "Mes";
    return "Semana";
  });
  const [calendarMode, setCalendarMode] = useState<"flex" | "fixed">(() => (readInitialQuery()?.get("mode") === "fixed" ? "fixed" : "flex"));
  const [anchor, setAnchor] = useState<Date>(() => {
    const q = readInitialQuery();
    const view = q?.get("view") === "day" ? "Día" : q?.get("view") === "month" ? "Mes" : "Semana";
    const start = parseIsoDateUTC(q?.get("start") ?? null) ?? new Date();
    if (view === "Mes") return startOfMonthUTC(start);
    return view === "Semana" ? startOfWeekUTC(start) : startOfDayUTC(start);
  });

  const [clientId, setClientId] = useState(() => readInitialQuery()?.get("clientId") ?? "");
  const [planId, setPlanId] = useState(() => readInitialQuery()?.get("planId") ?? "");
  const [assignmentStatus, setAssignmentStatus] = useState<"" | AssignmentStatus>(() => (readInitialQuery()?.get("assignmentStatus") as "" | AssignmentStatus) ?? "");
  const [status, setStatus] = useState<"" | "pending" | SessionStatus>(() => (readInitialQuery()?.get("status") as "" | "pending" | SessionStatus) ?? "");
  const [monthsSpan, setMonthsSpan] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>(() => {
    const raw = Number(readInitialQuery()?.get("span") ?? "");
    if (
      raw === 1 ||
      raw === 2 ||
      raw === 3 ||
      raw === 4 ||
      raw === 5 ||
      raw === 6 ||
      raw === 7 ||
      raw === 8 ||
      raw === 9 ||
      raw === 10 ||
      raw === 11 ||
      raw === 12
    ) {
      return raw;
    }
    return 3;
  });

  const days = mode === "Semana" ? 7 : mode === "Día" ? 1 : 7;
  const rangeStart = mode === "Semana" ? startOfWeekUTC(anchor) : mode === "Día" ? startOfDayUTC(anchor) : startOfMonthUTC(anchor);
  const startStr = isoDateUTC(rangeStart);

  const desiredQs = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("view", mode === "Semana" ? "week" : mode === "Día" ? "day" : "month");
    qs.set("start", startStr);
    qs.set("mode", calendarMode);
    if (mode === "Mes") qs.set("span", String(monthsSpan));
    if (clientId) qs.set("clientId", clientId);
    if (planId) qs.set("planId", planId);
    if (assignmentStatus) qs.set("assignmentStatus", assignmentStatus);
    if (status) qs.set("status", status);
    return qs.toString();
  }, [assignmentStatus, calendarMode, clientId, mode, monthsSpan, planId, startStr, status]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current === desiredQs) return;
    router.replace(`/coach/calendario?${desiredQs}`);
  }, [desiredQs, router, searchParams]);

  return {
    mode,
    setMode,
    calendarMode,
    setCalendarMode,
    anchor,
    setAnchor,
    clientId,
    setClientId,
    planId,
    setPlanId,
    assignmentStatus,
    setAssignmentStatus,
    status,
    setStatus,
    monthsSpan,
    setMonthsSpan,
    days,
    rangeStart,
    startStr,
    startOfDayUTC,
    startOfWeekUTC,
    startOfMonthUTC,
  };
}
