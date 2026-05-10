"use client";

// components/activity-rings.tsx — Activity rings anidados (Apple Watch style)

interface ActivityRingsProps {
  workoutFraction: number; // 0-1
  stepsFraction: number;   // 0-1
  sleepFraction: number;   // 0-1
  size?: number;
}

export function ActivityRings({
  workoutFraction,
  stepsFraction,
  sleepFraction,
  size = 76,
}: ActivityRingsProps) {
  // Scale factor based on size
  const scale = size / 76;
  const rings = [
    { r: 28 * scale, val: workoutFraction, color: "var(--lime)", stroke: 5 * scale },     // workouts
    { r: 22 * scale, val: stepsFraction, color: "var(--info)", stroke: 5 * scale },          // steps
    { r: 16 * scale, val: sleepFraction, color: "var(--sleep)", stroke: 5 * scale },          // sleep
  ];

  const center = size / 2;

  return (
    <div className="activity-rings" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {rings.map((ring, i) => (
          <g key={i}>
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.stroke}
              opacity="0.18"
            />
            {/* Progress arc */}
            <circle
              cx={center}
              cy={center}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.stroke}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * ring.r}`}
              strokeDashoffset={`${2 * Math.PI * ring.r * (1 - Math.min(1, ring.val))}`}
              style={{ transition: "stroke-dashoffset .6s ease" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
