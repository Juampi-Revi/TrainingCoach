"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Button } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

export default function SettingsPage() {
  const { user, logout } = useAuth();
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
          <Avatar name={name} size={56} tone="var(--lime)" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 4 }}>Coach · PRO</div>
          </div>
        </div>

        <Button size="lg" variant="danger" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </DesktopShell>
  );
}
