"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/use-notifications";
import { Avatar, Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

type NavId = "home" | "history" | "messages" | "notifications" | "chart" | "me";
const NAV: Array<{ id: NavId; icon: IconName; label: string; href: string }> = [
  { id: "home",     icon: "home",    label: "Semana",    href: "/semana"    },
  { id: "history",  icon: "history", label: "Historial", href: "/historial" },
  { id: "messages", icon: "msg",     label: "Mensajes",  href: "/mensajes"  },
  { id: "notifications", icon: "bell", label: "Notificaciones", href: "/notificaciones" },
  { id: "chart",    icon: "chart",   label: "Progreso",  href: "/progreso"  },
  { id: "me",       icon: "user",    label: "Cuenta",    href: "/cuenta"    },
];

function useActiveNav(): NavId {
  const p = usePathname() ?? "";
  if (p.startsWith("/historial")) return "history";
  if (p.startsWith("/mensajes") || p.startsWith("/comentarios")) return "messages";
  if (p.startsWith("/notificaciones")) return "notifications";
  if (p.startsWith("/progreso")) return "chart";
  if (p.startsWith("/cuenta")) return "me";
  return "home";
}

function useUnreadMessages(token: string | null) {
  const [unread, setUnread] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    // Exchange the JWT for a short-lived SSE token so the JWT never appears in URLs/logs
    fetch(`${API_BASE}/client/messages/stream-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.data?.token) return;
        const url = `${API_BASE}/client/messages/stream?token=${encodeURIComponent(j.data.token)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as { type: string; count?: number };
            if (data.type === "new_messages" && data.count) {
              setUnread((prev) => prev + data.count!);
              if (typeof window !== "undefined" && document.visibilityState === "hidden" && Notification.permission === "granted") {
                new Notification("YourCoach", { body: `Tienes ${data.count} mensaje${data.count! > 1 ? "s" : ""} nuevo${data.count! > 1 ? "s" : ""}` });
              }
            }
          } catch {}
        };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [token]);

  if (pathname?.startsWith("/mensajes") || pathname?.startsWith("/comentarios")) return 0;
  return unread;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { ready, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const active = useActiveNav();
  const unread = useUnreadMessages(token);
  const { unreadCount: notifCount } = useNotifications();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user?.role === "coach") { router.replace("/coach"); }
  }, [ready, token, user, router]);

  // Request notification permission once
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (!ready) return null;
  if (!token) return null;
  if (user && user.role === "coach") return null;

  const name = user?.name ?? user?.email ?? "Cliente";
  const hideMobileNav = pathname.startsWith("/sesion/");

  return (
    <div className="client-layout">
      {/* Desktop sidebar */}
      <aside className="client-sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={18} color="#0B0B0C" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>YourCoach</span>
        </div>

        <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em", padding: "4px 10px 8px" }}>
          Alumno
        </div>

        {NAV.map((n) => {
          const isActive = n.id === active;
          const badge =
            n.id === "messages"
              ? unread
              : n.id === "notifications"
                ? notifCount
                : 0;
          return (
            <Link key={n.id} href={n.href} className="ta-nav-item" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: isActive ? "var(--bg-3)" : "transparent",
              color: isActive ? "var(--text)" : "var(--text-mute)",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              textDecoration: "none", position: "relative",
            }}>
              <div style={{ position: "relative" }}>
                <Icon name={n.icon} size={16} />
                {badge > 0 && (
                  <div style={{ position: "absolute", top: -5, right: -6, minWidth: 14, height: 14, borderRadius: 7, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#0B0B0C" }}>{badge > 9 ? "9+" : badge}</span>
                  </div>
                )}
              </div>
              {n.label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--bg-2)" }}>
          <Avatar name={name} size={28} tone="#7AB8FF" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Alumno</div>
          </div>
          <Link href="/cuenta"><Icon name="settings" size={14} color="var(--text-mute)" /></Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="client-main">{children}</div>

      {/* Mobile bottom nav */}
      {!hideMobileNav && (
        <nav className="client-tab-bar" style={{
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
        {NAV.map((item) => {
          const isActive = item.id === active;
          const badge =
            item.id === "messages"
              ? unread
              : item.id === "notifications"
                ? notifCount
                : 0;
          return (
            <Link key={item.id} href={item.href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: isActive ? "var(--text)" : "var(--text-mute)",
              textDecoration: "none", position: "relative",
            }}>
              <div style={{ position: "relative" }}>
                <Icon name={item.icon} size={22} />
                {badge > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#0B0B0C" }}>{badge > 9 ? "9+" : badge}</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".02em" }}>{item.label}</span>
            </Link>
          );
        })}
        </nav>
      )}
    </div>
  );
}
