"use client";

// components/dot-progress.tsx — Barra de puntos para progreso (Fuerza/Aeróbico)

interface DotProgressProps {
  count: number;
  done: number;
  color?: string;
}

export function DotProgress({ count, done, color = "var(--lime)" }: DotProgressProps) {
  return (
    <div className="dot-progress">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`dot ${i < done ? "active" : ""}`}
          style={{ background: i < done ? color : "var(--bg-3)" }}
        />
      ))}

      <style jsx>{`
        .dot-progress {
          display: flex;
          gap: 6px;
        }

        .dot {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          transition: background 0.3s ease;
          min-width: 16px;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .dot-progress {
            gap: 10px;
          }

          .dot {
            height: 10px;
            border-radius: 5px;
            min-width: 24px;
          }
        }
      `}</style>
    </div>
  );
}