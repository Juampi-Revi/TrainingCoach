import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, Avatar } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { CoachBottomNav } from "./coach-bottom-nav";

type NavId = "dashboard" | "athletes" | "plans" | "templates" | "library" | "messages";

interface DesktopShellProps {
  children: ReactNode;
  active?: NavId;
  title?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  coachName?: string;
}

const NAV: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "dashboard", icon: "home",     label: "Dashboard",  href: "/coach"            },
  { id: "athletes",  icon: "users",    label: "Alumnos",    href: "/coach/alumnos"    },
  { id: "plans",     icon: "calendar", label: "Planes",     href: "/coach/planes"     },
  { id: "templates", icon: "book",     label: "Entrenamientos", href: "/coach/workouts" },
  { id: "library",   icon: "dumbbell", label: "Ejercicios", href: "/coach/ejercicios" },
  { id: "messages",  icon: "msg",      label: "Mensajes",   href: "/coach/mensajes"   },
];

// Map desktop NavId to bottom-nav NavId (templates/messages don't have tab bar equivalent)
const BOTTOM_NAV_MAP: Record<NavId, "dashboard" | "athletes" | "plans" | "library" | "settings"> = {
  dashboard: "dashboard",
  athletes:  "athletes",
  plans:     "plans",
  templates: "plans",
  library:   "library",
  messages:  "dashboard",
};

export function DesktopShell({
  children,
  active = "dashboard",
  title,
  subtitle,
  actions,
  coachName = "Coach",
}: DesktopShellProps) {
  return (
    <div className="coach-layout">
      {/* Sidebar — hidden on mobile via CSS */}
      <aside
        className="coach-sidebar"
        style={{
          width: 220,
          borderRight: "1px solid var(--line)",
          background: "var(--bg-1)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 12px",
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="logo" size={18} color="#0B0B0C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>REGEN</span>
        </div>

        <div
          style={{
            fontSize: 10,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            padding: "4px 10px 8px",
          }}
        >
          Coach
        </div>

        {/* Nav items */}
        {NAV.map((n) => {
          const isActive = n.id === active;
          return (
            <Link
              key={n.id}
              href={n.href}
              className="ta-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                marginBottom: 2,
                background: isActive ? "var(--bg-3)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-mute)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
              }}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Coach avatar footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: "var(--bg-2)",
          }}
        >
          <Avatar name={coachName} size={28} tone="var(--lime)" textColor="#0B0B0C" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
              {coachName}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Coach · PRO</div>
          </div>
          <Link href="/coach/settings">
            <Icon name="settings" size={14} color="var(--text-mute)" />
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="coach-main">
        {title && (
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--line)",
              flexShrink: 0,
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className="ta-ellipsis"
                style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  className="ta-ellipsis"
                  style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {actions && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {actions}
              </div>
            )}
          </header>
        )}
        <div className="ta-scroll coach-scroll">
          {children}
        </div>
      </main>

      {/* Bottom nav — visible on mobile only via CSS */}
      <CoachBottomNav active={BOTTOM_NAV_MAP[active]} />
    </div>
  );
}
