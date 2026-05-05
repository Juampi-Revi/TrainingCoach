"use client";

import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { Icon } from "@/components/ui";

export function PushNotificationSettings() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, sendTest } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="push-settings-card">
        <div className="push-settings-header">
          <div className="push-settings-icon disabled">
            <Icon name="bellOff" size={20} color="var(--text-mute)" />
          </div>
          <div className="push-settings-info">
            <div className="push-settings-title">Notificaciones</div>
            <div className="push-settings-desc">No soportadas en este navegador</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="push-settings-card">
      <div className="push-settings-header">
        <div className={`push-settings-icon ${isSubscribed ? "active" : ""}`}>
          <Icon name={isSubscribed ? "bell" : "bellOff"} size={20} color={isSubscribed ? "var(--lime)" : "var(--text-mute)"} />
        </div>
        <div className="push-settings-info">
          <div className="push-settings-title">
            {isSubscribed ? "Notificaciones activas" : "Notificaciones"}
          </div>
          <div className="push-settings-desc">
            {isSubscribed
              ? "Recibirás alertas cuando completes tus metas"
              : "Activa para recibir recordatorios y celebraciones"}
          </div>
        </div>
      </div>

      <div className="push-settings-actions">
        {isSubscribed ? (
          <>
            <button
              onClick={sendTest}
              disabled={isLoading}
              className="push-btn push-btn-secondary"
            >
              <Icon name="send" size={16} color="var(--text)" />
              Probar
            </button>
            <button
              onClick={unsubscribe}
              disabled={isLoading}
              className="push-btn push-btn-danger"
            >
              <Icon name="x" size={16} color="var(--danger)" />
              Desactivar
            </button>
          </>
        ) : (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="push-btn push-btn-primary"
          >
            <Icon name="bell" size={16} color="#0B0B0C" />
            {isLoading ? "Activando..." : "Activar notificaciones"}
          </button>
        )}
      </div>

      <style jsx>{`
        .push-settings-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .push-settings-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .push-settings-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .push-settings-icon.active {
          background: rgba(215, 255, 58, 0.2);
        }

        .push-settings-icon.disabled {
          background: var(--bg-2);
        }

        .push-settings-info {
          flex: 1;
          min-width: 0;
        }

        .push-settings-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .push-settings-desc {
          font-size: 13px;
          color: var(--text-mute);
          margin-top: 2px;
        }

        .push-settings-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .push-btn {
          flex: 1;
          min-width: 120px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          border: none;
        }

        .push-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .push-btn-primary {
          background: var(--lime);
          color: #0B0B0C;
        }

        .push-btn-primary:hover:not(:disabled) {
          background: #e0ff3a;
          transform: translateY(-1px);
        }

        .push-btn-secondary {
          background: var(--bg-2);
          border: 1px solid var(--line);
          color: var(--text);
        }

        .push-btn-secondary:hover:not(:disabled) {
          background: var(--bg-3);
        }

        .push-btn-danger {
          background: transparent;
          border: 1px solid var(--danger);
          color: var(--danger);
        }

        .push-btn-danger:hover:not(:disabled) {
          background: rgba(255, 91, 91, 0.1);
        }

        @media (min-width: 768px) {
          .push-settings-card {
            padding: 24px;
            border-radius: 16px;
            flex-direction: row;
            align-items: center;
            gap: 24px;
          }

          .push-settings-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }

          .push-settings-icon :global(svg) {
            width: 24px;
            height: 24px;
          }

          .push-settings-title {
            font-size: 18px;
          }

          .push-settings-desc {
            font-size: 14px;
          }

          .push-settings-actions {
            flex-direction: column;
            gap: 10px;
            min-width: 180px;
          }

          .push-btn {
            width: 100%;
            padding: 14px 20px;
            font-size: 15px;
          }
        }

        @media (min-width: 1200px) {
          .push-settings-card {
            padding: 28px;
          }

          .push-settings-actions {
            flex-direction: row;
            min-width: auto;
          }

          .push-btn {
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}
