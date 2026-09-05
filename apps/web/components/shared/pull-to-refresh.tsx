"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";

const THRESHOLD = 72;

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  const onTouchStart = (e: TouchEvent) => {
    if (busy) return;
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    if (scrollTop > 0) {
      startY.current = 0;
      return;
    }
    startY.current = e.touches[0]?.clientY ?? 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (busy || startY.current === 0) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - startY.current;
    if (delta > 0) setPull(Math.min(120, delta * 0.55));
  };

  const onTouchEnd = async () => {
    if (busy) return;
    const should = pull >= THRESHOLD;
    setPull(0);
    startY.current = 0;
    if (!should) return;
    setBusy(true);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { void onTouchEnd(); }}
      style={{ minHeight: "100%", position: "relative" }}
    >
      <div
        aria-hidden
        style={{
          height: busy ? 36 : pull,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          transition: pull === 0 && !busy ? "height .2s ease" : undefined,
        }}
      >
        <div
          className={busy ? "ta-spin" : undefined}
          style={{
            width: 18,
            height: 18,
            marginBottom: 8,
            borderRadius: "50%",
            border: "2px solid var(--line-2)",
            borderTopColor: "var(--accent)",
            opacity: busy ? 1 : progress,
            transform: `scale(${0.7 + progress * 0.3})`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
