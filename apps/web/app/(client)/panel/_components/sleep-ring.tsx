"use client";

// components/sleep-ring.tsx — Anillo de progreso para sueño

interface SleepRingProps {
  hours: number; // horas de sueño (ej: 7.53)
  targetHours?: number;
  size?: number;
}

export function SleepRing({ hours, targetHours = 8, size = 38 }: SleepRingProps) {
  const pct = Math.min(1, hours / targetHours);
  const r = 14;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: 38 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--bg-3)"
          strokeWidth="3"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#A78BFA"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
    </div>
  );
}