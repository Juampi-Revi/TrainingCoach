"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { flatTeleExercises, type TeleClassData } from "./tele-types";
import { TeleStaticView, TeleTimedView } from "./tele-views";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10,
  padding: "6px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
};

interface TeleClassScreenProps {
  classId: string;
  /** When true, show play/pause/reset and prev/next (gym operator). Public TV uses false. */
  controls?: boolean;
}

export function TeleClassScreen({ classId, controls = false }: TeleClassScreenProps) {
  const [data, setData] = useState<TeleClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exIndex, setExIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    fetch(`${apiBase}/public/classes/${classId}`)
      .then((r) => r.json())
      .then((j: { ok?: boolean; data?: TeleClassData; error?: string }) => {
        if (j.ok && j.data) {
          setData(j.data);
          if (j.data.teleMode === "timed" && typeof j.data.currentExercise === "number") {
            setExIndex(j.data.currentExercise);
          }
        } else {
          setError(j.error ?? "Clase no encontrada");
        }
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [classId]);

  const teleMode = data?.teleMode;

  useEffect(() => {
    if (teleMode !== "timed") return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    const interval = setInterval(() => {
      fetch(`${apiBase}/public/classes/${classId}`)
        .then((r) => r.json())
        .then((j: { ok?: boolean; data?: TeleClassData }) => {
          if (j.ok && j.data && typeof j.data.currentExercise === "number") {
            setExIndex(j.data.currentExercise);
          }
        })
        .catch(() => {
          /* poll soft-fail */
        });
    }, 10000);
    return () => clearInterval(interval);
  }, [classId, teleMode]);

  useEffect(() => {
    if (!controls || !isRunning) return;
    intervalRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [controls, isRunning]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
        Cargando clase…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {error || "Clase no encontrada"}
      </div>
    );
  }

  const W = data.workoutTemplate;
  const exercises = flatTeleExercises(W.workoutBlocks);
  const isTimed = data.teleMode === "timed";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "#fff", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <div style={{ flexShrink: 0, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.08)", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--lime)", fontWeight: 700 }}>{data.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
            {W.title}{isTimed ? ` · ${exercises.length} ejercicios` : ""}
          </div>
        </div>
        {isTimed && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>
              {fmtTime(timerSeconds)}
            </div>
            {controls && (
              <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsRunning(!isRunning)} style={btnStyle}>
                  <Icon name={isRunning ? "pause" : "play"} size={16} color="#fff" />
                </button>
                <button type="button" onClick={() => { setTimerSeconds(0); setIsRunning(false); }} style={btnStyle}>
                  <Icon name="refresh" size={16} color="#fff" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: isTimed ? "hidden" : "auto", padding: isTimed ? 20 : "16px 20px" }}>
        {isTimed ? (
          <TeleTimedView exercise={exercises[exIndex] ?? null} currentIndex={exIndex} total={exercises.length} />
        ) : (
          <TeleStaticView blocks={W.workoutBlocks} />
        )}
      </div>

      {isTimed && controls && (
        <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => { setExIndex((i) => Math.max(0, i - 1)); setTimerSeconds(0); }}
            disabled={exIndex === 0}
            style={{ ...btnStyle, opacity: exIndex === 0 ? 0.3 : 1 }}
          >
            <Icon name="chevL" size={20} color="#fff" /> Anterior
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>
            {exIndex + 1} / {exercises.length}
          </div>
          <button
            type="button"
            onClick={() => { setExIndex((i) => Math.min(exercises.length - 1, i + 1)); setTimerSeconds(0); }}
            disabled={exIndex >= exercises.length - 1}
            style={{ ...btnStyle, opacity: exIndex >= exercises.length - 1 ? 0.3 : 1 }}
          >
            Siguiente <Icon name="chevR" size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
