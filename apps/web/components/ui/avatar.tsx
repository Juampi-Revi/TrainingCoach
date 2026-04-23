import type { CSSProperties } from "react";

interface AvatarProps {
  name?: string;
  size?: number;
  tone?: string;
  style?: CSSProperties;
}

export function Avatar({ name = "?", size = 32, tone, style }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone ?? "var(--bg-3)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: size * 0.38,
        color: "var(--text)",
        flexShrink: 0,
        letterSpacing: ".02em",
        border: "1px solid var(--line-2)",
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
