"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Avatar, Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

export default function GymSettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const name = user?.name ?? user?.email ?? "Gym";

  return (
    <DesktopShell active="dashboard" coachName={name}>
      <div style={{ padding: "24px 20px", maxWidth: 600 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Configuración</div>
        <div style={{ padding: 16, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar name={name} src={user?.avatarUrl} size={48} tone="var(--lime)" textColor="#0B0B0C" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)" }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 4, fontWeight: 700 }}>Gym · PRO</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, padding: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} color="var(--lime)" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Modo {theme === "dark" ? "oscuro" : "claro"}</span>
            </div>
            <button onClick={toggle} type="button" style={{ width: 44, height: 26, borderRadius: 13, background: theme === "dark" ? "var(--bg-3)" : "var(--lime)", border: "none", padding: 3, cursor: "pointer" }}>
              <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: theme === "dark" ? "translateX(0)" : "translateX(18px)", transition: "transform .2s" }} />
            </button>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </DesktopShell>
  );
}
