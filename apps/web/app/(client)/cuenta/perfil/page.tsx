"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Button, Icon } from "@/components/ui";
import { PerfilHeader } from "./_components/perfil-header";
import { perfilStyles } from "./perfil-styles";

export default function PerfilPage() {
  const { user, refreshUser, api } = useAuth();
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
        const uploadRes = await api.post<{ url: string; publicId: string }>("/auth/avatar", formData);
        await api.patch("/auth/me", { avatarUrl: uploadRes.url });
        await refreshUser();
        toast.success("Foto de perfil actualizada");
      } catch {
        toast.error("Error al subir la imagen");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [api, toast, refreshUser],
  );

  const triggerFileSelect = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleAvatarUpload(file);
      e.target.value = "";
    },
    [handleAvatarUpload],
  );

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

  return (
    <div className="perfil-page">
      <PerfilHeader onBack={() => router.push("/cuenta")} />

      <div className="perfil-section">
        <div className="profile-banner" onClick={triggerFileSelect} role="button" tabIndex={0}>
          <Avatar name={name} src={user?.avatarUrl} size={64} tone="var(--lime)" textColor="#0B0B0C" />
          <div className="profile-info">
            <div className="profile-name">{name}</div>
            <div className="profile-email">{user?.email}</div>
          </div>
          <Icon name="image" size={18} color="var(--text-dim)" />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={uploadingAvatar}
        />
      </div>

      <div className="perfil-section">
        <div className="section-label">Cuenta</div>

        <div className="card-cuenta">
          <div
            className="card-cuenta-row"
            onClick={() => {
              setNameInput(user?.name ?? "");
              setEditingName((v) => !v);
            }}
          >
            <div className="card-cuenta-left">
              <Icon name="user" size={20} color="var(--lime)" />
              <span>Nombre</span>
            </div>
            <div className="card-cuenta-right">
              <div className="card-cuenta-value">{name}</div>
              <Icon name="chevR" size={18} color="var(--text-dim)" />
            </div>
          </div>

          {editingName && (
            <div className="card-editor">
              <div>
                <label className="form-label">Nombre</label>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  placeholder="Tu nombre"
                  className="form-input"
                />
              </div>
              <div className="btn-row">
                <Button variant="secondary" size="md" onClick={() => setEditingName(false)} disabled={savingName} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button size="md" onClick={() => void saveName()} disabled={savingName} style={{ flex: 1 }}>
                  {savingName ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          )}

          <div className="card-cuenta-row is-disabled">
            <div className="card-cuenta-left">
              <Icon name="send" size={20} color="var(--lime)" />
              <span>Email</span>
            </div>
            <div className="card-cuenta-right">
              <div className="card-cuenta-value">{user?.email}</div>
            </div>
          </div>

          <div className="card-cuenta-row" onClick={() => setShowPasswordForm((v) => !v)}>
            <div className="card-cuenta-left">
              <Icon name="lock" size={20} color="var(--lime)" />
              <span>Contraseña</span>
            </div>
            <div className="card-cuenta-right">
              <div className="card-cuenta-value">••••••••</div>
              <Icon name="chevR" size={18} color="var(--text-dim)" />
            </div>
          </div>

          {showPasswordForm && (
            <div className="card-editor" style={{ borderBottom: "none" }}>
              <div>
                <label className="form-label">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="form-input"
                />
              </div>

              <div className="btn-row" style={{ marginTop: 4 }}>
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
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  style={{ flex: 1 }}
                >
                  {changingPassword ? "Cambiando…" : "Cambiar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{perfilStyles}</style>
    </div>
  );
}
