"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Button } from "@/components/ui";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

export default function CuentaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const name = user?.name ?? user?.email ?? "Usuario";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Mi cuenta</div>
      </div>

      {/* Profile card */}
      <div style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 14,
          }}
        >
          <Avatar name={name} size={56} tone="var(--lime)" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          size="lg"
          variant="outline"
          block
          style={{ justifyContent: "flex-start" }}
          onClick={() => router.push("/progreso")}
        >
          Ver mi progreso
        </Button>
        <Button
          size="lg"
          variant="danger"
          block
          style={{ justifyContent: "flex-start" }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>

      <MobileTabBar active="me" />
    </div>
  );
}
