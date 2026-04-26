"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Avatar, Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

type NavId = "home" | "history" | "chart" | "me";
const NAV: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "home",    icon: "home",    label: "Semana",    href: "/semana"    },
  { id: "history", icon: "history", label: "Historial", href: "/historial" },
  { id: "chart",   icon: "chart",   label: "Progreso",  href: "/progreso"  },
  { id: "me",      icon: "user",    label: "Cuenta",    href: "/cuenta"    },
];

function useActiveNav(): NavId {
  const p = usePathname() ?? "";
  if (p.startsWith("/historial")) return "history";
  if (p.startsWith("/progreso"))  return "chart";
  if (p.startsWith("/cuenta"))    return "me";
  return "home";
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { ready, token, user } = useAuth();
  const router = useRouter();
  const active = useActiveNav(); // safe: usePathname() is SSR-stable

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user?.role === "coach") { router.replace("/coach"); }
  }, [ready, token, user, router]);

  if (!ready) return null;

  const name = user?.name ?? user?.email ?? "Cliente";

  return (
    <div className="client-layout">
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <aside className="client-sidebar">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--lime)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="logo" size={18} color="#0B0B0C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>REGEN</span>
        </div>

        <div
          style={{
            fontSize: 10, color: "var(--text-dim)",
            textTransform: "uppercase", letterSpacing: ".1em",
            padding: "4px 10px 8px",
          }}
        >
          Alumno
        </div>

        {NAV.map((n) => {
          const isActive = n.id === active;
          return (
            <Link
              key={n.id}
              href={n.href}
              className="ta-nav-item"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8, marginBottom: 2,
                background: isActive ? "var(--bg-3)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-mute)",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
              }}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* User footer */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8, background: "var(--bg-2)",
          }}
        >
          <Avatar name={name} size={28} tone="#7AB8FF" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Alumno</div>
          </div>
          <Link href="/cuenta">
            <Icon name="settings" size={14} color="var(--text-mute)" />
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="client-main">
        {children}
      </div>
    </div>
  );
}
