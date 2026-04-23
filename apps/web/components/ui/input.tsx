"use client";

import type { CSSProperties, InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  suffix?: string;
  error?: string;
  wrapStyle?: CSSProperties;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
}

const HEIGHTS = { sm: 32, md: 40, lg: 48 };

export function Input({
  label,
  suffix,
  error,
  wrapStyle,
  size = "md",
  align = "left",
  ...inputProps
}: InputProps) {
  const h = HEIGHTS[size];
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-sans)", ...wrapStyle }}>
      {label && (
        <span
          style={{
            fontSize: 12,
            color: "var(--text-mute)",
            fontWeight: 500,
            letterSpacing: ".02em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
      <div
        className="ta-input-wrap"
        style={{
          display: "flex",
          alignItems: "center",
          height: h,
          background: "var(--bg-2)",
          border: `1px solid ${error ? "var(--danger)" : "var(--line-2)"}`,
          borderRadius: 10,
          padding: "0 12px",
          transition: "border-color .15s",
        }}
      >
        <input
          className="ta-input-inner"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            color: "var(--text)",
            textAlign: align,
            width: "100%",
          }}
          {...inputProps}
        />
        {suffix && (
          <span style={{ fontSize: 12, color: "var(--text-mute)", marginLeft: 6, flexShrink: 0 }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>}
    </label>
  );
}

/* ─── NumCell: set entry grid cell ─────────────────────────── */
interface NumCellProps {
  value: string | number;
  label?: string;
  active?: boolean;
  big?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function NumCell({ value, label, active, onClick, big, style }: NumCellProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "8px 4px",
        minWidth: 56,
        background: active ? "var(--bg-3)" : "var(--bg-2)",
        border: `1px solid ${active ? "var(--lime)" : "var(--line-2)"}`,
        borderRadius: 10,
        cursor: "pointer",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        transition: "border-color .12s, background .12s",
        ...style,
      }}
    >
      <span style={{ fontSize: big ? 22 : 18, fontWeight: 600, letterSpacing: "-.02em" }}>
        {value}
      </span>
      {label && (
        <span
          style={{
            fontSize: 10,
            color: "var(--text-mute)",
            textTransform: "uppercase",
            letterSpacing: ".05em",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
