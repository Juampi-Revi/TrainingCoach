import Link from "next/link";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

type NavId = "dashboard" | "athletes" | "plans" | "library" | "settings";

interface CoachBottomNavProps {
  active?: NavId;
}

const ITEMS: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "dashboard", icon: "home",     label: "Inicio",     href: "/coach"            },
  { id: "athletes",  icon: "users",    label: "Alumnos",    href: "/coach/alumnos"    },
  { id: "plans",     icon: "calendar", label: "Planes",     href: "/coach/planes"     },
  { id: "library",   icon: "dumbbell", label: "Ejercicios", href: "/coach/ejercicios" },
  { id: "settings",  icon: "settings", label: "Ajustes",    href: "/coach/settings"   },
];

export function CoachBottomNav({ active }: CoachBottomNavProps) {
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
              color: isActive ? "var(--lime)" : "var(--text-mute)",
              textDecoration: "none",
              transition: "color .12s",
            }}
          >
            <Icon name={item.icon} size={22} color={isActive ? "var(--lime)" : "var(--text-mute)"} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
