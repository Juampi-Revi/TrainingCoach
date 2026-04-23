import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
  accent?: boolean;
  className?: string;
}

export function Card({ children, pad = 16, style, accent, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-1)",
        border: `1px solid ${accent ? "var(--lime)" : "var(--line)"}`,
        borderRadius: 14,
        padding: pad,
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
