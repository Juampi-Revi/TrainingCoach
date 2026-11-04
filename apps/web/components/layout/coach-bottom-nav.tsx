"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

type NavId = "athletes" | "plans" | "templates" | "library";

interface CoachBottomNavProps {
  active?: NavId;
}

const ITEMS: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "athletes",  icon: "users",    label: "Alumnos",    href: "/coach/alumnos" },
  { id: "plans",     icon: "book",     label: "Planes",     href: "/coach/planes" },
  { id: "templates", icon: "dumbbell", label: "Entrenos",   href: "/coach/workouts" },
  { id: "library",   icon: "star",     label: "Ejercicios", href: "/coach/ejercicios" },
];

export function CoachBottomNav({ active }: CoachBottomNavProps) {

  return (
    <nav
      className="coach-tab-bar"
      aria-label="Navegación coach"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 84,
        background: "var(--bg-1)",
        borderTop: "1px solid var(--line)",
        padding: "8px 8px 28px",
        zIndex: 50,
        display: "flex",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: isActive ? "var(--accent-text)" : "var(--text-mute)",
              textDecoration: "none",
              transition: "color .12s",
              position: "relative",
            }}
          >
            <Icon name={item.icon} size={22} color={isActive ? "var(--accent-text)" : "var(--text-mute)"} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
