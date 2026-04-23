import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, Avatar } from "@/components/ui";
import type { IconName } from "@/components/ui";

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
  { id: "templates", icon: "book",     label: "Templates",  href: "/coach/workouts"   },
  { id: "library",   icon: "dumbbell", label: "Ejercicios", href: "/coach/ejercicios" },
  { id: "messages",  icon: "msg",      label: "Mensajes",   href: "/coach/mensajes"   },
];

export function DesktopShell({
  children,
  active = "dashboard",
  title,
  subtitle,
  actions,
  coachName = "Coach",
}: DesktopShellProps) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: "1px solid var(--line)",
          background: "var(--bg-1)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 12px",
          flexShrink: 0,
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
          <Avatar name={coachName} size={28} tone="var(--lime)" />
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
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {title && (
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderBottom: "1px solid var(--line)",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{title}</div>
              {subtitle && (
                <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
            {actions && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>
            )}
          </header>
        )}
        <div className="ta-scroll" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
