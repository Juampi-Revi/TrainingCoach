"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { useNotifications } from "@/lib/use-notifications";

type NavId = "dashboard" | "athletes" | "plans" | "library" | "notifications" | "settings";

interface CoachBottomNavProps {
  active?: NavId;
}

const ITEMS: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "dashboard", icon: "home",     label: "Inicio",     href: "/coach"            },
  { id: "athletes",  icon: "users",    label: "Alumnos",    href: "/coach/alumnos"    },
  { id: "plans",     icon: "calendar", label: "Planes",     href: "/coach/planes"     },
  { id: "library",   icon: "dumbbell", label: "Ejercicios", href: "/coach/ejercicios" },
  { id: "notifications", icon: "bell", label: "Notifs", href: "/coach/notificaciones" },
  { id: "settings",  icon: "settings", label: "Ajustes",    href: "/coach/settings"   },
];

export function CoachBottomNav({ active }: CoachBottomNavProps) {
  const { unreadCount } = useNotifications();

  return (
    <nav
      className="coach-tab-bar"
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
      }}
    >
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        const badge = item.id === "notifications" ? unreadCount : 0;
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              flex: 1,
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
            <div style={{ position: "relative" }}>
              <Icon name={item.icon} size={22} color={isActive ? "var(--accent-text)" : "var(--text-mute)"} />
              {badge > 0 && (
                <div style={{ position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#0B0B0C" }}>{badge > 9 ? "9+" : badge}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
