import type { ReactNode } from "react";
import { Icon } from "./icon";

type Kind = "empty" | "loading" | "error";

interface StateBlockProps {
  kind: Kind;
  title: string;
  body?: string;
  cta?: ReactNode;
}

const CONFIG: Record<Kind, { icon: Parameters<typeof Icon>[0]["name"]; color: string }> = {
  empty:   { icon: "calendar", color: "var(--text-mute)" },
  loading: { icon: "reset",    color: "var(--text-mute)" },
  error:   { icon: "alert",    color: "var(--danger)"    },
};

export function StateBlock({ kind, title, body, cta }: StateBlockProps) {
  const { icon, color } = CONFIG[kind];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        className={kind === "loading" ? "ta-spin" : undefined}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--bg-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      {body && (
        <div style={{ fontSize: 13, color: "var(--text-mute)", maxWidth: 240, lineHeight: 1.5 }}>
          {body}
        </div>
      )}
      {cta && <div style={{ marginTop: 4 }}>{cta}</div>}
    </div>
  );
}
