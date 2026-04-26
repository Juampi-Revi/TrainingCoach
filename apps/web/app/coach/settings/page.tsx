"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Avatar, Button, Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const name = user?.name ?? user?.email ?? "Coach";

  return (
    <DesktopShell active="dashboard" title="Configuración" coachName={name}>
      <div style={{ padding: 28, maxWidth: 520 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            marginBottom: 24,
          }}
        >
          <Avatar name={name} size={56} tone="var(--lime)" textColor="#0B0B0C" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 4 }}>Coach · PRO</div>
          </div>
        </div>

        {/* Theme toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Apariencia</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
              {theme === "dark" ? "Modo oscuro" : "Modo claro"}
            </div>
          </div>
          <button
            onClick={toggle}
            className="ta-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid var(--line-2)",
              background: "var(--bg-2)",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
        </div>

        <Button size="lg" variant="danger" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </DesktopShell>
  );
}
