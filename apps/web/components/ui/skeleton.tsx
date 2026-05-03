interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--bg-2) 25%, var(--line) 50%, var(--bg-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "ta-shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
