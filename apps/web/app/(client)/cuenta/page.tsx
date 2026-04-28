"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import { Avatar, Button, Icon } from "@/components/ui";

export default function CuentaPage() {
  const { user, logout, refreshUser, api } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  async function saveName() {
    if (saving) return;
    setSaving(true);
    try {
      await api.patch("/auth/me", { name: nameInput.trim() || null });
      await refreshUser();
      setEditing(false);
      toast.success("Nombre actualizado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
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
            padding: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: editing ? 16 : 0 }}>
            <Avatar name={name} size={56} tone="var(--lime)" textColor="#0B0B0C" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>{name}</div>
              <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>{user?.email}</div>
            </div>
            {!editing && (
              <button
                onClick={() => { setNameInput(user?.name ?? ""); setEditing(true); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text-mute)", display: "flex", alignItems: "center" }}
                title="Editar nombre"
              >
                <Icon name="edit" size={15} color="var(--text-mute)" />
              </button>
            )}
          </div>

          {editing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex", alignItems: "center",
                  background: "var(--bg-2)", border: "1px solid var(--lime)",
                  borderRadius: 10, padding: "0 12px", height: 44,
                }}
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  placeholder="Tu nombre…"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text)", fontWeight: 600,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveName} disabled={saving} style={{ flex: 1 }}>
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          )}
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

        {/* Theme toggle */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: "var(--bg-1)",
            border: "1px solid var(--line)", borderRadius: 12,
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
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 8,
              border: "1px solid var(--line-2)", background: "var(--bg-2)",
              color: "var(--text)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
        </div>

        <Button size="lg" variant="danger" block style={{ justifyContent: "flex-start" }} onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

    </div>
  );
}
