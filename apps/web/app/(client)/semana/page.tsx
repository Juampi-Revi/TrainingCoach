"use client";

import { useCallback, useEffect, useState } from "react";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Avatar, Button, Icon, StateBlock } from "@/components/ui";
import type { ClientWeekResponse } from "@regen/types";
import { WeekWorkoutCard } from "./_components/week-workout-card";
import { AfterTodaySection } from "./_components/after-today-section";
import { weekContext, workoutBriefing, nextWorkoutMessage, todayStrip } from "./_lib/week-helpers";
import { precacheUrls } from "@/lib/precache-media";

export default function SemanaPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ClientWeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const week = await api.get<ClientWeekResponse>("/client/week");
      setData(week);
      precacheUrls(week.mediaUrls ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

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
            cta={
              <Link href="/mensajes" style={{ textDecoration: "none" }}>
                <Button size="sm" icon="msg">
                  Escribir al coach
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const today =
    data.workouts.find((w) => w.session?.status === "in_progress") ??
    data.workouts.find((w) => !w.session) ??
    null;
  const remaining = today ? data.workouts.filter((w) => w !== today) : data.workouts;
  const finished = data.workouts.filter((w) => w.session?.status === "completed" || w.session?.status === "partial");
  const completedCount = finished.length;
  const inProgressCount = data.workouts.filter((w) => w.session?.status === "in_progress").length;
  const doneCount = completedCount;

  const inProgress = remaining.filter((w) => w.session?.status === "in_progress");
  const pending = remaining.filter((w) => !w.session);
  const totalCount = data.workouts.length;
  const partialCount = finished.filter((w) => w.session?.status === "partial").length;
  const fullCompletedCount = finished.filter((w) => w.session?.status === "completed").length;

  const workoutHref = (w: ClientWeekResponse["workouts"][number]) =>
    `/semana/${w.workoutTemplateId}?pwwId=${encodeURIComponent(w.pwwId)}`;

  return (
    <PullToRefresh onRefresh={load}>
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 84 }}>
      {/* Header */}
      <div style={{ padding: "48px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", letterSpacing: ".04em" }}>
              Hola, {user?.name?.split(" ")[0] ?? ""}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
              Semana {data.weekNumber}{" "}
              <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>/ {data.totalWeeks}</span>
            </div>
          </div>
          <Avatar name={user?.name ?? "U"} size={36} tone="var(--lime)" textColor="var(--text-on-accent)" />
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
                color: d.today ? "var(--text-on-accent)" : "var(--text)",
                border: `1px solid ${d.today ? "var(--lime)" : "var(--line)"}`,
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em" }}>{d.d}</span>
              <span className="ta-mono" style={{ fontSize: 14, fontWeight: 600 }}>{d.n}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ display: "flex", gap: 12, padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>
              Hechas
            </div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
              {doneCount}<span style={{ color: "var(--text-mute)" }}>/{totalCount}</span>
            </div>
            <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
              {fullCompletedCount} completas
              {partialCount > 0 ? ` · ${partialCount} parciales` : ""}
              {inProgressCount > 0 ? ` · ${inProgressCount} en curso` : ""}
            </div>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>
              Plan
            </div>
            <div className="ta-mono ta-ellipsis" style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>
              {data.plan.title}
            </div>
          </div>
        </div>

        {/* Semana context */}
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 18, lineHeight: 1.5 }}>
          {weekContext(data.weekNumber, data.totalWeeks)}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Hero de intención */}
        {today ? (
          <div style={{ padding: "18px 18px 16px", borderRadius: 14, background: "var(--lime)", color: "var(--text-on-accent)", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", opacity: 0.7 }}>
              HOY TOCA
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2, lineHeight: 1.2 }}>
              {today.title}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, marginBottom: 14, marginTop: 4 }}>
              {workoutBriefing(today)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {today.session?.status === "in_progress" ? (
                <Link href={`/sesion/${today.session.id}`} style={{ flex: 1, textDecoration: "none" }}>
                  <Button block size="lg" icon="play" style={{ background: "var(--text-on-accent)", color: "var(--lime)" }}>
                    Continuar entreno
                  </Button>
                </Link>
              ) : (
                <Link href={workoutHref(today)} style={{ flex: 1, textDecoration: "none" }}>
                  <Button block size="lg" icon="play" style={{ background: "var(--text-on-accent)", color: "var(--lime)" }}>
                    Empezar entreno
                  </Button>
                </Link>
              )}
            </div>
            {today.progressionNote && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
                {today.progressionNote}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 18, borderRadius: 14, background: "var(--bg-1)", border: "1px solid var(--line)", marginBottom: 10, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Semana completada</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
              Buen trabajo — descansá hasta la próxima semana
            </div>
          </div>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, margin: "16px 0 10px" }}>
              En curso
            </div>
            {inProgress.map((w) => (
              <WeekWorkoutCard
                key={w.pwwId}
                href={w.session ? `/sesion/${w.session.id}` : workoutHref(w)}
                title={w.title}
                description={w.description}
                tags={w.tags}
                exerciseCount={w.exerciseCount}
                progressionNote={w.progressionNote}
                variant="in_progress"
              />
            ))}
          </>
        )}

        {/* Después de hoy — colapsable */}
        {(pending.length > 0 || finished.length > 0) && (
          <AfterTodaySection pending={pending} completed={finished} workoutHref={workoutHref} />
        )}

        {/* Next step */}
        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 12, background: "var(--bg-1)", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-mute)", letterSpacing: ".05em" }}>
            {nextWorkoutMessage(pending, finished)}
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
