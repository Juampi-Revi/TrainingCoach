import Link from "next/link";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

type TabId = "home" | "history" | "chart" | "me";

interface MobileTabBarProps {
  active: TabId;
}

const ITEMS: Array<{ id: TabId; icon: IconName; label: string; href: string }> = [
  { id: "home",    icon: "home",    label: "Semana",   href: "/semana"   },
  { id: "history", icon: "history", label: "Historial", href: "/historial" },
  { id: "chart",   icon: "chart",   label: "Progreso", href: "/progreso" },
  { id: "me",      icon: "user",    label: "Yo",       href: "/cuenta"   },
];

export function MobileTabBar({ active }: MobileTabBarProps) {
  return (
    <nav
      className="client-tab-bar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 84,
        background: "var(--bg-1)",
        borderTop: "1px solid var(--line)",
        display: "flex",
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
              color: isActive ? "var(--text)" : "var(--text-mute)",
              textDecoration: "none",
              transition: "color .12s",
            }}
          >
            <Icon name={item.icon} size={22} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
