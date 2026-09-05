"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";

const SNAPS = [0.32, 0.55, 0.9] as const;

function nearest(ratio: number) {
  let best = 0;
  let dist = Infinity;
  SNAPS.forEach((s, i) => {
    const d = Math.abs(s - ratio);
    if (d < dist) { dist = d; best = i; }
  });
  return best;
}

export function SheetSnap({
  children,
  onBackdrop,
}: {
  children: ReactNode;
  onBackdrop: () => void;
}) {
  const [idx, setIdx] = useState(1);
  const drag = useRef<{ startY: number; startH: number } | null>(null);
  const [liveH, setLiveH] = useState<number | null>(null);

  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const height = liveH ?? Math.round(vh * SNAPS[idx]!);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startH: height };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const next = Math.max(vh * 0.22, Math.min(vh * 0.94, drag.current.startH + (drag.current.startY - e.clientY)));
    setLiveH(next);
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const current = liveH ?? height;
    const nextIdx = nearest(current / vh);
    drag.current = null;
    setLiveH(null);
    if (current / vh < 0.2) {
      onBackdrop();
      return;
    }
    setIdx(nextIdx);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 1300 }}
      onClick={onBackdrop}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          margin: "0 auto",
          height,
          maxHeight: "calc(100dvh - 24px)",
          background: "var(--bg-1)",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          transition: liveH == null ? "height .28s cubic-bezier(.22,1,.36,1)" : undefined,
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none", padding: "10px 0 6px", cursor: "grab", flexShrink: 0 }}
          aria-label="Ajustar altura"
        >
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--line-2)", margin: "0 auto" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 14px 18px", paddingBottom: "calc(18px + env(safe-area-inset-bottom))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
