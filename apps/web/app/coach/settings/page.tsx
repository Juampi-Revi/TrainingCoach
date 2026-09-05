"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import { Avatar, Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { CoachNotificationSettingsCard } from "../notificaciones/_components/coach-notification-settings-card";

export default function SettingsPage() {
  const { user, api, refreshUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const name = user?.name ?? user?.email ?? "Coach";

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await api.patch("/auth/me", { name: trimmed });
      await refreshUser();
      toast.success("Nombre actualizado");
      setEditingName(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar nombre");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes permitidas");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 2MB)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await api.post<{ url: string }>("/auth/avatar", form);
      await api.patch("/auth/me", { avatarUrl: url });
      await refreshUser();
      toast.success("Avatar actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <DesktopShell active="dashboard" coachName={name}>
      <div className="cuenta-page">
        <div className="cuenta-header">
          <div className="cuenta-title">Mi cuenta</div>
          <div className="cuenta-subtitle">Configuración y preferencias del coach</div>
        </div>

        <div className="cuenta-section">
          <div className="profile-banner">
            <button
              className="profile-avatar-btn"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              title="Cambiar avatar"
            >
              <Avatar
                name={name}
                src={user?.avatarUrl}
                size={64}
                tone="var(--lime)"
                textColor="var(--text-on-accent)"
              />
              <span className="profile-avatar-overlay">
                <Icon name="edit" size={14} color="#fff" />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
            <div className="profile-info">
              {editingName ? (
                <input
                  autoFocus
                  className="profile-name-input"
                  value={nameDraft}
                  disabled={savingName}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  onBlur={handleSaveName}
                  placeholder={user?.name ?? "Tu nombre"}
                />
              ) : (
                <div className="profile-name">
                  {name}
                  <button
                    className="profile-name-edit-btn"
                    type="button"
                    onClick={() => {
                      setNameDraft(user?.name ?? "");
                      setEditingName(true);
                    }}
                    title="Editar nombre"
                  >
                    <Icon name="edit" size={13} color="var(--text-dim)" />
                  </button>
                </div>
              )}
              <div className="profile-email">{user?.email}</div>
              <div className="profile-role">Coach · PRO</div>
            </div>
          </div>
        </div>

        <div className="cuenta-section">
          <div className="section-label">Cuenta</div>
          <div className="card-cuenta">
            <div className="card-cuenta-row" onClick={() => router.push("/coach/notificaciones")} title="Ver notificaciones">
              <div className="card-cuenta-left">
                <Icon name="bell" size={20} color="var(--lime)" />
                <span>Notificaciones</span>
              </div>
              <Icon name="chevR" size={18} color="var(--text-dim)" />
            </div>
            <div className="card-cuenta-row">
              <div className="card-cuenta-left">
                <Icon name={theme === "dark" ? "sun" : "moon"} size={20} color="var(--lime)" />
                <span>Modo {theme === "dark" ? "oscuro" : "claro"}</span>
              </div>
              <button className={`toggle-tema ${theme}`} onClick={toggle} type="button" title="Cambiar tema">
                <span className="toggle-tema-knob" />
              </button>
            </div>
          </div>
        </div>

        <div className="cuenta-section">
          <div className="section-label">Alertas</div>
          <CoachNotificationSettingsCard api={api} />
        </div>

        <div className="cuenta-section">
          <button onClick={handleLogout} className="logout-button" title="Cerrar sesión">
            <Icon name="x" size={18} color="var(--danger)" />
            Cerrar sesión
          </button>
        </div>

        <style jsx>{`
          .cuenta-page {
            min-height: 100dvh;
            background: var(--bg);
            padding-bottom: calc(100px + env(safe-area-inset-bottom));
          }

          .cuenta-header {
            padding: 20px 16px 16px;
          }

          .cuenta-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .cuenta-subtitle {
            font-size: 12px;
            color: var(--text-mute);
            margin-top: 4px;
          }

          .cuenta-section {
            padding: 0 16px 16px;
            margin-top: 8px;
          }

          .cuenta-section:first-of-type {
            margin-top: 16px;
          }

          .section-label {
            font-family: var(--font-mono);
            font-size: 9px;
            color: var(--text-mute);
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 10px;
          }

          .profile-banner {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: var(--bg-1);
            border: 1px solid var(--line);
            border-radius: 14px;
          }

          .profile-avatar-btn {
            position: relative;
            flex-shrink: 0;
            padding: 0;
            border: none;
            background: none;
            cursor: pointer;
            border-radius: 50%;
          }

          .profile-avatar-btn:disabled {
            cursor: wait;
            opacity: 0.6;
          }

          .profile-avatar-overlay {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.15s;
          }

          .profile-avatar-btn:hover .profile-avatar-overlay {
            opacity: 1;
          }

          .profile-info {
            flex: 1;
            min-width: 0;
          }

          .profile-name {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.01em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .profile-name-edit-btn {
            flex-shrink: 0;
            width: 26px;
            height: 26px;
            border-radius: 8px;
            border: 1px solid var(--line-2);
            background: var(--bg-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.15s;
          }

          .profile-name:hover .profile-name-edit-btn {
            opacity: 1;
          }

          .profile-name-input {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: var(--text);
            background: var(--bg-2);
            border: 1px solid var(--lime);
            border-radius: 8px;
            padding: 4px 8px;
            width: 100%;
            outline: none;
            font-family: var(--font-sans);
          }

          .profile-email {
            font-size: 13px;
            color: var(--text-mute);
            margin-top: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .profile-role {
            font-size: 12px;
            color: var(--lime);
            margin-top: 6px;
            font-weight: 700;
          }

          .card-cuenta {
            background: var(--bg-1);
            border: 1px solid var(--line);
            border-radius: 14px;
            overflow: hidden;
          }

          .card-cuenta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid var(--line);
          }

          .card-cuenta-row:last-child {
            border-bottom: none;
          }

          .card-cuenta-row:hover {
            background: var(--bg-2);
          }

          .card-cuenta-left {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            font-weight: 600;
            color: var(--text);
          }

          .toggle-tema {
            width: 50px;
            height: 28px;
            border-radius: 14px;
            background: var(--bg-3);
            border: none;
            padding: 3px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .toggle-tema.light {
            background: var(--lime);
          }

          .toggle-tema-knob {
            display: block;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: white;
            transition: transform 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .toggle-tema.light .toggle-tema-knob {
            transform: translateX(22px);
          }

          .logout-button {
            width: 100%;
            padding: 16px 20px;
            background: transparent;
            border: 1px solid var(--danger);
            border-radius: 12px;
            color: var(--danger);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
          }

          .logout-button:hover {
            background: rgba(255, 91, 91, 0.1);
          }

          @media (min-width: 768px) {
            .cuenta-page {
              padding-bottom: 32px;
            }

            .cuenta-header {
              padding: 48px 28px 24px;
              border-bottom: 1px solid var(--line);
            }

            .cuenta-title {
              font-size: 28px;
            }

            .cuenta-subtitle {
              font-size: 14px;
              margin-top: 6px;
            }

            .cuenta-section {
              padding: 0 28px 24px;
              margin-top: 12px;
              width: 100%;
            }

            .cuenta-section:first-of-type {
              margin-top: 32px;
            }

            .section-label {
              font-size: 11px;
              letter-spacing: 0.12em;
              margin-bottom: 16px;
            }

            .profile-banner {
              padding: 24px;
              border-radius: 16px;
              gap: 20px;
            }

            .profile-name,
            .profile-name-input {
              font-size: 18px;
            }

            .profile-email {
              font-size: 14px;
            }

            .logout-button {
              padding: 14px 24px;
            }
          }
        `}</style>
      </div>
    </DesktopShell>
  );
}
