"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, Avatar } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { CoachBottomNav } from "./coach-bottom-nav";
import { useAuth } from "@/lib/auth";

export type NavId =
  | "dashboard"
  | "athletes"
  | "plans"
  | "templates"
  | "library"
  | "messages"
  | "calendar"
  | "notifications"
  | "classes"
  | "groups";

interface DesktopShellProps {
  children: ReactNode;
  active?: NavId;
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  coachName?: string;
}

interface NavItem { id: NavId; icon: IconName; label: string; href: string }

/** Coach product nav — core coaching tools only. */
const COACH_NAV: NavItem[] = [
  { id: "athletes",  icon: "users",    label: "Alumnos",        href: "/coach/alumnos"  },
  { id: "plans",     icon: "book",     label: "Planes",         href: "/coach/planes"   },
  { id: "templates", icon: "dumbbell", label: "Entrenamientos", href: "/coach/workouts" },
  { id: "library",   icon: "star",     label: "Ejercicios",     href: "/coach/ejercicios" },
];

/**
 * Gym experimental nav — gym-first destinations.
 * Shared coaching tools stay under /coach/* until gym has its own copies.
 */
/** Gym nav stays in the file. The shell no longer renders it. */
export const GYM_NAV: NavItem[] = [
  { id: "dashboard", icon: "home",     label: "Inicio gym",     href: "/gym"                 },
  { id: "classes",   icon: "calendar", label: "Clases",         href: "/gym/clases"          },
  { id: "groups",    icon: "users",    label: "Grupos",         href: "/coach/alumnos/grupos" },
  { id: "athletes",  icon: "users",    label: "Alumnos",        href: "/coach/alumnos"       },
  { id: "templates", icon: "dumbbell", label: "Entrenamientos", href: "/coach/workouts"      },
  { id: "library",   icon: "star",     label: "Ejercicios",     href: "/coach/ejercicios"    },
];

const BOTTOM_NAV_MAP: Record<NavId, "athletes" | "plans" | "templates" | "library"> = {
  dashboard: "athletes",
  athletes: "athletes",
  groups: "athletes",
  plans: "plans",
  templates: "templates",
  library: "library",
  calendar: "athletes",
  messages: "athletes",
  notifications: "athletes",
  classes: "athletes",
};

export function DesktopShell({
  children,
  active = "dashboard",
  title,
  subtitle,
  actions,
  coachName = "Coach",
}: DesktopShellProps) {
  const { user } = useAuth();
  const isGym = user?.role === "gym";
  const roleLabel = isGym ? "Gym · experimental" : "Coach";
  const settingsHref = "/coach/settings";
  const nav = COACH_NAV;

  return (
    <div className="coach-layout">
      <aside
        className="coach-sidebar"
        style={{
          width: 220, borderRight: "1px solid var(--line)", background: "var(--bg-1)",
          display: "flex", flexDirection: "column", padding: "18px 12px",
          flexShrink: 0, height: "100vh", position: "sticky", top: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={18} color="var(--bg)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em", padding: "4px 10px 8px" }}>
          {roleLabel}
        </div>

        {nav.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            aria-current={n.id === active ? "page" : undefined}
            className="ta-nav-item"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: n.id === active ? "var(--bg-3)" : "transparent",
              color: n.id === active ? "var(--text)" : "var(--text-mute)",
              fontSize: 13, fontWeight: n.id === active ? 600 : 500, textDecoration: "none",
            }}
          >
            <Icon name={n.icon} size={16} />
            {n.label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="ta-nav-item"
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "8px 10px", borderRadius: 8, marginBottom: 2,
            background: "transparent", color: "var(--text-mute)",
            fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", textAlign: "left",
          }}
        >
          <Icon name="search" size={16} />
          <span style={{ flex: 1 }}>Buscar</span>
          <kbd className="cmdk-kbd">⌘K</kbd>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--bg-2)" }}>
          <Avatar name={coachName} size={28} tone="var(--lime)" textColor="var(--bg)" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{coachName}</div>
            <div style={{ fontSize: 10, color: "var(--text-mute)" }}>{isGym ? "Gym" : "Coach"} · PRO</div>
          </div>
          <Link href={settingsHref} aria-label="Ajustes">
            <Icon name="settings" size={14} color="var(--text-mute)" />
          </Link>
        </div>
      </aside>

      <main className="coach-main">
        {title && (
          <header style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap",
            padding: "16px 20px", borderBottom: "1px solid var(--line)",
            flexShrink: 0, gap: 12, minWidth: 0,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="ta-ellipsis" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}>{title}</div>
              {subtitle && <div className="ta-ellipsis" style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>{subtitle}</div>}
            </div>
            {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", minWidth: 0, maxWidth: "100%" }}>{actions}</div>}
          </header>
        )}
        <div className="ta-scroll coach-scroll">{children}</div>
      </main>

      <CoachBottomNav active={BOTTOM_NAV_MAP[active]} />
    </div>
  );
}
