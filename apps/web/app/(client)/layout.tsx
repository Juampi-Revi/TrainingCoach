"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Avatar, Icon } from "@/components/ui";
import { InstallPrompt } from "@/components/features/pwa/install-prompt";
import type { IconName } from "@/components/ui";
import { isHiddenClientPath } from "@/lib/focus-routes";

type NavId = "home" | "history" | "nutrition" | "me";
type NavItem = { id: NavId; icon: IconName; label: string; href: string };

const NAV: NavItem[] = [
  { id: "home",    icon: "home",    label: "Semana",    href: "/semana" },
  { id: "history", icon: "history", label: "Historial", href: "/historial" },
  { id: "me",      icon: "user",    label: "Cuenta",    href: "/cuenta" },
];

const NUTRITION_NAV: NavItem = {
  id: "nutrition",
  icon: "apple",
  label: "Nutrición",
  href: "/asistente",
};

function useActiveNav(): NavId {
  const p = usePathname() ?? "";
  if (p.startsWith("/asistente")) return "nutrition";
  if (p.startsWith("/historial")) return "history";
  if (p.startsWith("/cuenta")) return "me";
  return "home";
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { ready, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const active = useActiveNav();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user?.role === "coach" || user?.role === "gym") { router.replace("/coach/alumnos"); return; }
    if (pathname.startsWith("/asistente") && !user?.assistantBeta) {
      router.replace("/semana");
      return;
    }
    if (isHiddenClientPath(pathname)) { router.replace("/semana"); }
  }, [ready, token, user, router, pathname]);

  // Notification permission is requested from the notifications screen / settings, not on mount.

  if (!ready) return null;
  if (!token) return null;
  if (user && (user.role === "coach" || user.role === "gym")) return null;

  const name = user?.name ?? user?.email ?? "Cliente";
  const hideMobileNav = pathname.startsWith("/sesion/");
  const nav = user?.assistantBeta
    ? [NAV[0], NAV[1], NUTRITION_NAV, NAV[2]]
    : NAV;

  return (
    <div className="client-layout">
      {/* Desktop sidebar */}
      <aside className="client-sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={18} color="var(--bg)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em", padding: "4px 10px 8px" }}>
          Alumno
        </div>

        {nav.map((n) => {
          const isActive = n.id === active;
          return (
            <Link key={n.id} href={n.href} aria-current={isActive ? "page" : undefined} className="ta-nav-item" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: isActive ? "var(--bg-3)" : "transparent",
              color: isActive ? "var(--text)" : "var(--text-mute)",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              textDecoration: "none", position: "relative",
            }}>
              <Icon name={n.icon} size={16} />
              {n.label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--bg-2)" }}>
          <Avatar name={name} size={28} tone="var(--info)" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Alumno</div>
          </div>
          <Link href="/cuenta" aria-label="Ajustes de cuenta"><Icon name="settings" size={14} color="var(--text-mute)" /></Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="client-main">{children}</div>
      <InstallPrompt />

      {/* Mobile bottom nav */}
      {!hideMobileNav && (
        <nav className="client-tab-bar" aria-label="Navegación alumno" style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: "calc(84px + env(safe-area-inset-bottom))",
          background: "var(--bg-1)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          padding: "8px 8px calc(28px + env(safe-area-inset-bottom))",
          zIndex: 50,
        }}>
        {nav.map((item) => {
          const isActive = item.id === active;
          return (
            <Link key={item.id} href={item.href} aria-current={isActive ? "page" : undefined} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: isActive ? "var(--text)" : "var(--text-mute)",
              textDecoration: "none", position: "relative",
            }}>
              <Icon name={item.icon} size={22} />
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em" }}>{item.label}</span>
            </Link>
          );
        })}
        </nav>
      )}
    </div>
  );
}
