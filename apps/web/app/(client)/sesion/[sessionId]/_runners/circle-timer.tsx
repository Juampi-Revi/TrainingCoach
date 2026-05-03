"use client";

// ─── Circle Timer ─────────────────────────────────────────────────────────────

interface CircleTimerProps {
  seconds: number;
  total: number;
  color: string;
}

export function CircleTimer({ seconds, total, color }: CircleTimerProps) {
  const size = 200;
  const r = 88;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = total > 0 ? Math.max(0, seconds) / total : 0;
  const dashOffset = circumference * (1 - fraction);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={8} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="ta-mono" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color, transition: "color .3s" }}>
          {Math.max(0, seconds)}
        </div>
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 4 }}>
          SEG · DE {total}
        </div>
      </div>
    </div>
  );
}
