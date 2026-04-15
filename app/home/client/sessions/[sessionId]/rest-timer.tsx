"use client";

import { useEffect, useMemo, useState } from "react";

function formatSeconds(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;
  const mm = String(minutesPart).padStart(2, "0");
  const ss = String(secondsPart).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function RestTimer({ defaultSeconds }: { defaultSeconds: number }) {
  const initialSeconds = useMemo(() => {
    if (!Number.isFinite(defaultSeconds) || defaultSeconds <= 0) return 90;
    return Math.trunc(defaultSeconds);
  }, [defaultSeconds]);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTargetSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    if (remainingSeconds <= 0) {
      setIsRunning(false);
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  const start = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.trunc(seconds) : initialSeconds;
    setTargetSeconds(safeSeconds);
    setRemainingSeconds(safeSeconds);
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
    setRemainingSeconds(0);
  };

  return (
    <div className="mt-3 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-3">
      <div className="text-sm font-medium">Descanso</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{isRunning ? formatSeconds(remainingSeconds) : formatSeconds(targetSeconds)}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => start(initialSeconds)}
          className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1.5 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
        >
          Iniciar descanso
        </button>
        <button
          type="button"
          onClick={() => start(60)}
          className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1.5 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
        >
          60s
        </button>
        <button
          type="button"
          onClick={() => start(120)}
          className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1.5 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
        >
          120s
        </button>
        {isRunning ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1.5 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
          >
            Detener
          </button>
        ) : null}
      </div>
    </div>
  );
}
