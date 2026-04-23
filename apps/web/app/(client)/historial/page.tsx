"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Badge, Icon, StateBlock, Tabs } from "@/components/ui";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { SessionSummary } from "@regen/types";

type Filter = "Mes" | "Todo";

export default function HistorialPage() {
  const { api } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Mes");

  useEffect(() => {
    api
      .get<{ items: SessionSummary[]; nextCursor: string | null }>("/client/sessions?limit=50")
      .then((r) => setSessions(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const completed = sessions.filter((s) => s.status === "completed");
  const filtered =
    filter === "Mes"
      ? completed.filter((s) => {
          const d = new Date(s.performedAt);
          const now = new Date();
          const diff = (now.getTime() - d.getTime()) / 86400000;
          return diff <= 30;
        })
      : completed;

  const totalVol = filtered.reduce((acc, s) => acc + s.totalVolumeKg, 0);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Historial</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          {completed.length} sesiones completadas
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Tabs
          variant="pills"
          tabs={["Mes", "Todo"]}
          active={filter}
          onChange={(t) => setFilter(t as Filter)}
        />
      </div>

      {/* Summary card */}
      {filtered.length > 0 && (
        <div style={{ padding: "0 20px 12px" }}>
          <div
            style={{
              padding: 14,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 600,
                  }}
                >
                  Volumen total · kg
                </div>
                <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>
                  {Math.round(totalVol).toLocaleString("es")}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
                {filter === "Mes" ? "30 días" : "Total"}
              </span>
            </div>
            {/* Simple bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 54 }}>
              {filtered.slice(-8).map((s, i) => {
                const max = Math.max(...filtered.slice(-8).map((x) => x.totalVolumeKg), 1);
                const h = (s.totalVolumeKg / max) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i === filtered.slice(-8).length - 1 ? "var(--lime)" : "var(--bg-3)",
                      borderRadius: 3,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <StateBlock kind="loading" title="Cargando historial…" />
      ) : filtered.length === 0 ? (
        <StateBlock kind="empty" title="Sin sesiones" body="Completá tu primera sesión para verla acá." />
      ) : (
        <div style={{ padding: "0 20px" }}>
          {filtered.map((s, i) => {
            const d = new Date(s.performedAt);
            const dateStr = d.toLocaleDateString("es", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <Link
                key={s.id}
                href={`/comentarios/${s.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 0",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: i === 0 ? "var(--lime)" : "var(--bg-2)",
                      border: `1px solid ${i === 0 ? "var(--lime)" : "var(--line)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: i === 0 ? "#0B0B0C" : "var(--lime)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check" size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="ta-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--text-mute)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                      }}
                    >
                      {dateStr}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>
                      {s.workoutTemplate?.title ?? "Sesión libre"}
                    </div>
                    <div
                      className="ta-mono"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}
                    >
                      {s.setsCount} sets · {Math.round(s.totalVolumeKg).toLocaleString("es")}kg
                      {s.energyRating ? ` · Energía ${s.energyRating}/10` : ""}
                    </div>
                  </div>
                  {s.energyRating && s.energyRating >= 9 && (
                    <Badge tone="limeSoft" size="sm">
                      <Icon name="star" size={11} /> Top
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <MobileTabBar active="history" />
    </div>
  );
}
