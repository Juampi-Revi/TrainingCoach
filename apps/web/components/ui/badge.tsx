import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type BadgeTone = "neutral" | "lime" | "limeSoft" | "success" | "warn" | "danger" | "info";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: IconName;
  style?: CSSProperties;
}

const TONES: Record<BadgeTone, { bg: string; color: string; border: string }> = {
  neutral:  { bg: "var(--bg-2)",                 color: "var(--text-mute)",  border: "var(--line-2)"             },
  lime:     { bg: "var(--lime)",                 color: "#0B0B0C",           border: "transparent"               },
  limeSoft: { bg: "rgba(215,255,58,.12)",        color: "var(--lime)",       border: "rgba(215,255,58,.3)"       },
  success:  { bg: "rgba(110,231,168,.12)",       color: "var(--success)",    border: "rgba(110,231,168,.3)"      },
  warn:     { bg: "rgba(255,181,71,.14)",        color: "var(--warn)",       border: "rgba(255,181,71,.3)"       },
  danger:   { bg: "rgba(255,91,91,.14)",         color: "var(--danger)",     border: "rgba(255,91,91,.3)"        },
  info:     { bg: "rgba(122,184,255,.14)",       color: "var(--info)",       border: "rgba(122,184,255,.3)"      },
};

const SIZES: Record<BadgeSize, { h: number; px: number; fs: number }> = {
  sm: { h: 22, px: 8,  fs: 11 },
  md: { h: 28, px: 10, fs: 12 },
};

export function Badge({ children, tone = "neutral", size = "sm", icon, style }: BadgeProps) {
  const t = TONES[tone];
  const sz = SIZES[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: sz.h,
        padding: `0 ${sz.px}px`,
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        fontFamily: "var(--font-sans)",
        fontSize: sz.fs,
        fontWeight: 600,
        letterSpacing: ".02em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sz.fs + 1} />}
      {children}
    </span>
  );
}
