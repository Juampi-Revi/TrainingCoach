"use client";

import type { CSSProperties } from "react";

interface TabsProps {
  tabs: string[];
  active: string;
  onChange?: (tab: string) => void;
  variant?: "underline" | "pills";
  style?: CSSProperties;
}

export function Tabs({ tabs, active, onChange, variant = "underline", style }: TabsProps) {
  if (variant === "pills") {
    return (
      <div
        style={{
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          ...style,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: 4,
            background: "var(--bg-2)",
            borderRadius: 10,
            border: "1px solid var(--line)",
            whiteSpace: "nowrap",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => onChange?.(t)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                background: t === active ? "var(--bg-3)" : "transparent",
                color: t === active ? "var(--text)" : "var(--text-mute)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                transition: "background .12s, color .12s",
                flex: "0 0 auto",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        borderBottom: "1px solid var(--line)",
        ...style,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange?.(t)}
          style={{
            padding: "10px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: t === active ? "var(--text)" : "var(--text-mute)",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: t === active ? 600 : 500,
            borderBottom: `2px solid ${t === active ? "var(--lime)" : "transparent"}`,
            marginBottom: -1,
            letterSpacing: "-.01em",
            transition: "color .12s, border-color .12s",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
