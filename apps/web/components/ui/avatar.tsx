import type { CSSProperties } from "react";
import Image from "next/image";

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  tone?: string;
  textColor?: string;
  style?: CSSProperties;
}

export function Avatar({ name = "?", src, size = 32, tone, textColor, style }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid var(--line-2)",
          ...style,
        }}
      />
    );
  }

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
        color: textColor ?? "var(--text)",
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
