"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Avatar, Badge, Button, Icon, StateBlock } from "@/components/ui";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { ClientWeekResponse } from "@regen/types";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

function todayStrip() {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i);
    return { d: DAY_LABELS[i], n: d.getDate(), today: i === dow };
  });
}

export default function SemanaPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ClientWeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ClientWeekResponse>("/client/week")
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  const days = todayStrip();

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando semana…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock
          kind="error"
          title="No se pudo cargar"
          body={error ?? "Error desconocido"}
          cta={
            <Button size="sm" onClick={() => router.refresh()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (!data.plan) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 84 }}>
        <div style={{ padding: "48px 20px 14px" }}>
          <div style={{ fontSize: 12, color: "var(--text-mute)", letterSpacing: ".04em" }}>
            Hola, {user?.name?.split(" ")[0] ?? ""}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
            Bienvenido
          </div>
        </div>
        <div style={{ padding: "8px 20px" }}>
          <StateBlock
            kind="empty"
            title="Tu plan todavía no está listo"
            body="Tu coach está armando tu programa. Te avisamos cuando esté activo."
          />
        </div>
        <MobileTabBar active="home" />
      </div>
    );
  }

  const today = data.workouts.find((w) => !w.session || w.session.status === "in_progress");
  const upcoming = data.workouts.filter((w) => w !== today);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 84 }}>
      {/* Header */}
      <div style={{ padding: "48px 20px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", letterSpacing: ".04em" }}>
              Hola, {user?.name?.split(" ")[0] ?? ""}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
              Semana {data.weekNumber}{" "}
              <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>/ {data.totalWeeks}</span>
            </div>
          </div>
          <Avatar name={user?.name ?? "U"} size={36} tone="var(--lime)" textColor="#0B0B0C" />
        </div>

        {/* Week strip */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 0",
                background: d.today ? "var(--lime)" : "var(--bg-1)",
                color: d.today ? "#0B0B0C" : "var(--text)",
                border: `1px solid ${d.today ? "var(--lime)" : "var(--line)"}`,
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em" }}>{d.d}</span>
              <span className="ta-mono" style={{ fontSize: 14, fontWeight: 600 }}>
                {d.n}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 14,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Sesiones
            </div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
              {data.workouts.filter((w) => w.session?.status === "completed").length}
              <span style={{ color: "var(--text-mute)" }}>/{data.workouts.length}</span>
            </div>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Plan
            </div>
            <div
              className="ta-mono ta-ellipsis"
              style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: "var(--lime)" }}
            >
              {data.plan.title}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: "var(--text-mute)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Próximo entreno
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Today card */}
        {today ? (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              background: "var(--lime)",
              color: "#0B0B0C",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", opacity: 0.7 }}>
              HOY
            </div>
            <div
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}
            >
              {today.title}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, marginBottom: 18 }}>
              {today.description ?? today.tags.join(" · ")} · {today.exerciseCount} ej
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {today.session?.status === "in_progress" ? (
                <Link
                  href={`/sesion/${today.session.id}`}
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  <Button
                    block
                    size="lg"
                    icon="play"
                    style={{ background: "#0B0B0C", color: "var(--lime)" }}
                  >
                    Continuar
                  </Button>
                </Link>
              ) : (
                <Link
                  href={`/semana/${today.workoutTemplateId}`}
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  <Button
                    block
                    size="lg"
                    icon="play"
                    style={{ background: "#0B0B0C", color: "var(--lime)" }}
                  >
                    Empezar
                  </Button>
                </Link>
              )}
              <Link href={`/semana/${today.workoutTemplateId}`} style={{ textDecoration: "none" }}>
                <Button
                  size="lg"
                  variant="ghost"
                  style={{
                    background: "rgba(11,11,12,.08)",
                    color: "#0B0B0C",
                    border: "1px solid rgba(11,11,12,.2)",
                  }}
                >
                  Ver
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>Semana completada</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
              Buen trabajo — descansá hasta la próxima semana
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.map((w, i) => (
          <Link
            key={i}
            href={`/semana/${w.workoutTemplateId}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 12,
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background:
                    w.session?.status === "completed" ? "var(--bg-3)" : "var(--bg-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--line)",
                }}
              >
                {w.session?.status === "completed" ? (
                  <Icon name="check" size={18} color="var(--success)" />
                ) : (
                  <Icon name="dumbbell" size={18} color="var(--text-mute)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{w.title}</div>
                <div
                  className="ta-ellipsis"
                  style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}
                >
                  {w.description ?? w.tags.join(" · ")} · {w.exerciseCount} ej
                </div>
              </div>
              {w.session?.status === "completed" && (
                <Badge tone="success" size="sm">
                  Lista
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>

      <MobileTabBar active="home" />
    </div>
  );
}
