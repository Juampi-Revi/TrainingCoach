"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Button, Icon } from "@/components/ui";

export default function PerfilPage() {
  const { user, logout, refreshUser, api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const name = user?.name ?? user?.email ?? "Usuario";

  async function saveName() {
    if (savingName) return;
    setSavingName(true);
    try {
      await api.patch("/auth/me", { name: nameInput.trim() || null });
      await refreshUser();
      setEditingName(false);
      toast.success("Nombre actualizado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSavingName(false);
    }
  }

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es muy grande (máx 2MB)");
        return;
      }

      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await api.post<{ url: string; publicId: string }>(
          "/auth/avatar",
          formData
        );

        // Save the avatar URL to user profile
        await api.patch("/auth/me", { avatarUrl: uploadRes.url });
        await refreshUser();
        toast.success("Foto de perfil actualizada");
      } catch {
        toast.error("Error al subir la imagen");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [api, toast, refreshUser]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleAvatarUpload(file);
      }
      e.target.value = "";
    },
    [handleAvatarUpload]
  );

  const triggerFileSelect = useCallback(() => {
    fileRef.current?.click();
  }, []);

  async function changePassword() {
    if (changingPassword) return;

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Contraseña actualizada correctamente");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Error al cambiar contraseña");
    } finally {
      setChangingPassword(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        paddingBottom: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-mute)",
            fontSize: 14,
            padding: 0,
            marginBottom: 16,
          }}
        >
          <Icon name="chevL" size={16} color="var(--text-mute)" />
          Volver
        </button>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Mi perfil
        </div>
      </div>

      <div
        style={{
          padding: "0 20px",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {/* Avatar Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "32px 24px",
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            marginBottom: 24,
          }}
        >
          <button
            onClick={triggerFileSelect}
            disabled={uploadingAvatar}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              padding: 0,
              cursor: uploadingAvatar ? "not-allowed" : "pointer",
              opacity: uploadingAvatar ? 0.7 : 1,
              marginBottom: 16,
            }}
          >
            <Avatar
              name={name}
              src={user?.avatarUrl}
              size={100}
              tone="var(--lime)"
              textColor="#0B0B0C"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
              }}
              className="avatar-overlay"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div
            style={{
              fontSize: 13,
              color: "var(--text-mute)",
              textAlign: "center",
            }}
          >
            Tocá la foto para cambiarla
          </div>
        </div>

        {/* Name Section */}
        <div
          style={{
            padding: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          {!editingName ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Nombre
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {name}
                </div>
              </div>
              <button
                onClick={() => {
                  setNameInput(user?.name ?? "");
                  setEditingName(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  color: "var(--text-mute)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon name="edit" size={18} color="var(--text-mute)" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-mute)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                Nombre
              </div>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                placeholder="Tu nombre"
                style={{
                  width: "100%",
                  height: 48,
                  padding: "0 16px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--lime)",
                  borderRadius: 10,
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  color: "var(--text)",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setEditingName(false)}
                  disabled={savingName}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button
                  size="md"
                  onClick={() => void saveName()}
                  disabled={savingName}
                  style={{ flex: 1 }}
                >
                  {savingName ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Email Section */}
        <div
          style={{
            padding: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Email
          </div>
          <div
            style={{
              fontSize: 16,
              color: "var(--text-dim)",
            }}
          >
            {user?.email}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-mute)",
              marginTop: 4,
            }}
          >
            El email no se puede cambiar
          </div>
        </div>

        {/* Password Section */}
        <div
          style={{
            padding: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          {!showPasswordForm ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Contraseña
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "var(--text-dim)",
                  }}
                >
                  ••••••••
                </div>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  color: "var(--text-mute)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon name="edit" size={18} color="var(--text-mute)" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-mute)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                Cambiar contraseña
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--text-mute)",
                    fontWeight: 500,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--text-mute)",
                    fontWeight: 500,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--text-mute)",
                    fontWeight: 500,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    fontFamily: "var(--font-sans)",
                    fontSize: 15,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowPasswordForm(false)}
                  disabled={changingPassword}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button
                  size="md"
                  onClick={() => void changePassword()}
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  style={{ flex: 1 }}
                >
                  {changingPassword ? "Cambiando…" : "Cambiar"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="danger"
          size="lg"
          block
          onClick={handleLogout}
          style={{ marginTop: 8 }}
        >
          Cerrar sesión
        </Button>
      </div>

      <style jsx>{`
        .avatar-overlay:hover {
          opacity: 1 !important;
        }

        button:hover .avatar-overlay {
          opacity: 1;
        }

        @media (min-width: 640px) {
          button .avatar-overlay {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
