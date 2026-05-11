"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { Badge, Button, Card, Icon } from "@/components/ui";

const DAY_MS = 86_400_000;
const PX_PER_DAY = 10;

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonthsUTC(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtShortMonth(date: Date) {
  return date.toLocaleDateString("es", { month: "short", year: "numeric" });
}

export function AgendaPlanTimelineGrid({
  rows,
  rangeStart,
  rangeEndExclusive,
  monthsSpan,
}: {
  rows: Array<{
    client: { id: string; email: string; name: string | null };
    planId: string;
    planTitle: string;
    start: Date | null;
    end: Date | null;
    totalDays: number | null;
    status: string;
    tone: string;
  }>;
  rangeStart: Date;
  rangeEndExclusive: Date;
  monthsSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}) {
  const days = Math.floor((rangeEndExclusive.getTime() - rangeStart.getTime()) / DAY_MS);
  const timelineWidth = days * PX_PER_DAY;
  const today = startOfDayUTC(new Date());
  const todayIdx = Math.floor((today.getTime() - rangeStart.getTime()) / DAY_MS);

  const months = useMemo(() => {
    const res: Array<{ key: string; label: string; left: number; width: number }> = [];
    for (let i = 0; i < monthsSpan; i++) {
      const mStart = addMonthsUTC(rangeStart, i);
      const mEnd = addMonthsUTC(rangeStart, i + 1);
      const leftDays = Math.floor((mStart.getTime() - rangeStart.getTime()) / DAY_MS);
      const widthDays = Math.floor((mEnd.getTime() - mStart.getTime()) / DAY_MS);
      res.push({
        key: `${mStart.getUTCFullYear()}-${mStart.getUTCMonth()}`,
        label: fmtShortMonth(mStart),
        left: leftDays * PX_PER_DAY,
        width: widthDays * PX_PER_DAY,
      });
    }
    return res;
  }, [monthsSpan, rangeStart]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollToToday() {
    const el = scrollRef.current;
    if (!el) return;
    const x = clamp(todayIdx * PX_PER_DAY - el.clientWidth * 0.35, 0, Math.max(0, timelineWidth - el.clientWidth));
    el.scrollTo({ left: x, behavior: "smooth" });
  }

  return (
    <Card pad={14}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={16} color="var(--lime)" />
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-.01em" }}>
              Calendario de planes ({monthsSpan} meses)
            </div>
          </div>
          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
            {isoDateUTC(rangeStart)} → {isoDateUTC(new Date(rangeEndExclusive.getTime() - DAY_MS))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone="neutral" size="sm">
            {rows.length} alumnos
          </Badge>
          <Button size="sm" variant="outline" onClick={scrollToToday}>
            Hoy
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, alignItems: "start" }}>
        <div style={{ paddingTop: 38 }}>
          <div className="ta-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--text-mute)", fontWeight: 800, marginBottom: 8 }}>
            ALUMNO
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => {
              const label = r.client.name?.trim() || r.client.email;
              return (
                <div key={r.client.id} style={{ height: 34, display: "flex", alignItems: "center", gap: 10, padding: "0 10px", borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)", overflow: "hidden" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: r.tone, flexShrink: 0 }} />
                  <Link href={`/coach/alumnos/${r.client.id}`} style={{ textDecoration: "none", color: "inherit", minWidth: 0, flex: 1 }}>
                    <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 800 }}>
                      {label}
                    </div>
                    <div className="ta-ellipsis ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                      {r.planTitle}
                    </div>
                  </Link>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text-mute)", fontSize: 13 }}>
                No hay alumnos con plan para estos filtros.
              </div>
            )}
          </div>
        </div>

        <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--bg-2)" }}>
          <div style={{ position: "relative", height: 38, background: "var(--bg-1)", borderBottom: "1px solid var(--line)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch" }}>
              {months.map((m, idx) => (
                <div key={m.key} style={{ width: m.width, borderRight: idx < months.length - 1 ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-mute)", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "hidden" }}>
            <div style={{ position: "relative", width: timelineWidth, padding: "10px 0" }}>
              {months.map((m, idx) => (
                <div key={`${m.key}-line`} style={{ position: "absolute", top: 0, left: m.left, width: 1, height: "100%", background: idx === 0 ? "transparent" : "var(--line)", opacity: 0.9 }} />
              ))}

              {todayIdx >= 0 && todayIdx < days && (
                <div style={{ position: "absolute", top: 0, left: todayIdx * PX_PER_DAY, width: 2, height: "100%", background: "var(--lime)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--lime) 35%, transparent)", opacity: 0.9 }} />
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 10px" }}>
                {rows.map((r) => {
                  const startIdx = r.start ? Math.floor((r.start.getTime() - rangeStart.getTime()) / DAY_MS) : null;
                  const endIdx = r.end ? Math.floor((r.end.getTime() - rangeStart.getTime()) / DAY_MS) : null;

                  const barLeft = startIdx == null ? 0 : startIdx * PX_PER_DAY;
                  const barRight = endIdx == null ? barLeft : (endIdx + 1) * PX_PER_DAY;
                  const visibleLeft = clamp(barLeft, 0, timelineWidth);
                  const visibleRight = clamp(barRight, 0, timelineWidth);
                  const visibleW = Math.max(0, visibleRight - visibleLeft);

                  const hasDates = r.start != null && r.end != null && r.totalDays != null;

                  return (
                    <div key={`${r.client.id}-bar`} style={{ height: 34, position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg)", opacity: 0.35 }} />

                      {hasDates && visibleW > 0 ? (
                        <Link
                          href={`/coach/planes/${r.planId}`}
                          style={{
                            position: "absolute",
                            left: visibleLeft,
                            top: 4,
                            height: 26,
                            width: visibleW,
                            borderRadius: 10,
                            background: `color-mix(in srgb, ${r.tone} 16%, var(--bg-1))`,
                            border: `1px solid color-mix(in srgb, ${r.tone} 45%, var(--line))`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 10px",
                            textDecoration: "none",
                            color: "var(--text)",
                            overflow: "hidden",
                          }}
                          title={`${r.planTitle} · ${isoDateUTC(r.start!)} → ${isoDateUTC(r.end!)} (${r.totalDays} días)`}
                        >
                          <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 900, letterSpacing: "-.01em" }}>
                            {r.totalDays}d
                          </div>
                          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 800 }}>
                            {isoDateUTC(r.end!)}
                          </div>
                        </Link>
                      ) : (
                        <div style={{ position: "absolute", left: 10, top: 6, height: 22, display: "flex", alignItems: "center", gap: 8, color: "var(--text-mute)", fontSize: 12, fontWeight: 700 }}>
                          <span>Sin inicio</span>
                          <span className="ta-mono" style={{ fontSize: 10 }}>
                            ({r.status})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
