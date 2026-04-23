"use client";

import type { CSSProperties, ReactNode, ElementType } from "react";
import { Icon, type IconName } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  as?: ElementType;
  href?: string;
}

const SIZES: Record<ButtonSize, { h: number; px: number; fs: number; gap: number; r: number }> = {
  sm: { h: 32, px: 12, fs: 13, gap: 6,  r: 8  },
  md: { h: 40, px: 16, fs: 14, gap: 8,  r: 10 },
  lg: { h: 52, px: 22, fs: 16, gap: 10, r: 12 },
  xl: { h: 64, px: 28, fs: 18, gap: 12, r: 14 },
};

const VARIANTS: Record<ButtonVariant, { bg: string; color: string; border: string; fw: number }> = {
  primary:   { bg: "var(--lime)",    color: "#0B0B0C",       border: "none",                        fw: 600 },
  secondary: { bg: "var(--bg-2)",    color: "var(--text)",   border: "1px solid var(--line-2)",     fw: 500 },
  ghost:     { bg: "transparent",    color: "var(--text)",   border: "1px solid transparent",       fw: 500 },
  outline:   { bg: "transparent",    color: "var(--text)",   border: "1px solid var(--line-2)",     fw: 500 },
  danger:    { bg: "transparent",    color: "var(--danger)", border: "1px solid var(--line-2)",     fw: 500 },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  block,
  icon,
  iconRight,
  disabled,
  style,
  className,
  type = "button",
  onClick,
  as: Tag = "button",
  ...rest
}: ButtonProps) {
  const sz = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <Tag
      type={Tag === "button" ? type : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`ta-btn${className ? " " + className : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sz.gap,
        height: sz.h,
        padding: `0 ${sz.px}px`,
        fontFamily: "var(--font-sans)",
        fontSize: sz.fs,
        fontWeight: v.fw,
        letterSpacing: "-0.01em",
        color: v.color,
        background: v.bg,
        border: v.border,
        borderRadius: sz.r,
        cursor: disabled ? "not-allowed" : "pointer",
        width: block ? "100%" : undefined,
        whiteSpace: "nowrap",
        textDecoration: "none",
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={sz.fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz.fs + 2} />}
    </Tag>
  );
}
