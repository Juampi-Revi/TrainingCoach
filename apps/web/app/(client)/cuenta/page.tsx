"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Avatar, Icon } from "@/components/ui";
import { PushNotificationSettings } from "./_components/push-notification-settings";

export default function CuentaPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const name = user?.name ?? user?.email ?? "Usuario";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="cuenta-page">
      {/* Header */}
      <div className="cuenta-header">
        <div className="cuenta-title">Mi cuenta</div>
        <div className="cuenta-subtitle">Configuración y gestión de perfil</div>
      </div>

      {/* Profile Section */}
      <div className="cuenta-section">
        <div className="profile-banner" onClick={() => router.push("/cuenta/perfil")}>
          <Avatar name={name} src={user?.avatarUrl} size={64} tone="var(--lime)" textColor="#0B0B0C" />
          <div className="profile-info">
            <div className="profile-name">{name}</div>
            <div className="profile-email">{user?.email}</div>
          </div>
          <Icon name="chevR" size={20} color="var(--text-dim)" />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="cuenta-section">
        <div className="section-label">Notificaciones</div>
        <PushNotificationSettings />
      </div>

      {/* Menu Grid */}
      <div className="cuenta-section">
        <div className="section-label">Configuración</div>
        <div className="menu-grid">
          <button onClick={() => router.push("/cuenta/metas")} className="menu-item">
            <div className="menu-item-icon"><Icon name="edit" size={22} color="var(--lime)" /></div>
            <div><div className="menu-item-label">Metas de salud</div><div className="menu-item-desc">Pasos, sueño y entrenamientos</div></div>
          </button>
          <button onClick={() => router.push("/cuenta/wearable")} className="menu-item">
            <div className="menu-item-icon"><Icon name="watch" size={22} color="var(--lime)" /></div>
            <div><div className="menu-item-label">Dispositivos</div><div className="menu-item-desc">Garmin, Google Health, Strava</div></div>
          </button>
          <button onClick={() => router.push("/cuenta/mediciones")} className="menu-item">
            <div className="menu-item-icon"><Icon name="chart" size={22} color="var(--lime)" /></div>
            <div><div className="menu-item-label">Mediciones</div><div className="menu-item-desc">Peso y medidas corporales</div></div>
          </button>
          <button disabled className="menu-item disabled">
            <div className="menu-item-icon" style={{ background: 'var(--bg-2)', opacity: 0.5 }}><Icon name="star" size={22} color="var(--text-mute)" /></div>
            <div><div className="menu-item-label" style={{ color: 'var(--text-mute)' }}>Logros</div><div className="menu-item-desc" style={{ color: 'var(--text-mute)' }}>Próximamente</div></div>
          </button>
          <button onClick={toggle} className="menu-item">
            <div className="menu-item-icon"><Icon name={theme === "dark" ? "sun" : "moon"} size={22} color="var(--lime)" /></div>
            <div><div className="menu-item-label">Apariencia</div><div className="menu-item-desc">{theme === "dark" ? "Modo oscuro" : "Modo claro"}</div></div>
          </button>
        </div>
      </div>

      {/* Logout Section */}
      <div className="cuenta-section">
        <button onClick={handleLogout} className="logout-button">
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
          cursor: pointer;
          transition: all 0.2s ease;
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
        }

        .profile-email {
          font-size: 13px;
          color: var(--text-mute);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .menu-item {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          height: 100%;
          min-height: 120px;
        }

        .menu-item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .menu-item-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .menu-item-desc {
          font-size: 15px;
          color: var(--text);
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.3;
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

        .menu-item:hover {
          background: var(--bg-2);
          border-color: var(--lime);
          transform: translateY(-2px);
        }

        .profile-banner:hover {
          background: var(--bg-2);
          border-color: var(--lime);
        }

        .logout-button:hover {
          background: rgba(255, 91, 91, 0.1);
        }

        .menu-item.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .menu-item.disabled:hover {
          background: var(--bg-1);
          border-color: var(--line);
          transform: none;
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

          .profile-name {
            font-size: 18px;
          }

          .profile-email {
            font-size: 14px;
          }

          .menu-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          .menu-item {
            padding: 24px;
            border-radius: 18px;
            min-height: 160px;
          }

          .menu-item-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(215, 255, 58, 0.15);
          }

          .menu-item-label {
            font-size: 11px;
            letter-spacing: 0.12em;
            margin-bottom: 10px;
          }

          .menu-item-desc {
            font-size: 17px;
          }

          .logout-button {
            max-width: 300px;
            margin: 0 auto;
            padding: 14px 24px;
          }
        }

        @media (min-width: 1200px) {
          .cuenta-header {
            padding: 48px 48px 24px;
          }

          .cuenta-section {
            padding: 0 48px 24px;
            margin-top: 16px;
          }

          .cuenta-section:first-of-type {
            margin-top: 40px;
          }

          .menu-grid {
            gap: 20px;
          }

          .menu-item {
            padding: 28px;
            min-height: 180px;
          }
        }
      `}</style>
    </div>
  );
}
