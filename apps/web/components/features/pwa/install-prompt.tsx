"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Icon } from "@/components/ui";

const VISITS_KEY = "regen_pwa_visits";
const DISMISS_KEY = "regen_pwa_install_dismissed";
const MIN_VISITS = 3;
const DISMISS_DAYS = 90;

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia?.("(display-mode: standalone)");
  return mq?.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function readDismissUntil(): number {
  try {
    const raw = localStorage.getItem(DISMISS_KEY) ?? sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    if (raw === "1") return Number.MAX_SAFE_INTEGER;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function isDismissedNow() {
  return Date.now() < readDismissUntil();
}

function persistDismiss() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  const value = String(until);
  try {
    localStorage.setItem(DISMISS_KEY, value);
  } catch { /* ignore */ }
  try {
    sessionStorage.setItem(DISMISS_KEY, value);
  } catch { /* ignore */ }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [blocked, setBlocked] = useState(true);

  const dismiss = useCallback(() => {
    persistDismiss();
    setBlocked(true);
    setVisible(false);
    setIosHint(false);
    setDeferred(null);
  }, []);

  useEffect(() => {
    if (isStandalone() || !isMobileViewport() || isDismissedNow()) {
      setBlocked(true);
      return;
    }

    setBlocked(false);

    try {
      const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      if (visits < MIN_VISITS) return;
    } catch {
      return;
    }

    const onBefore = (e: Event) => {
      if (isDismissedNow() || !isMobileViewport()) return;
      e.preventDefault();
      setDeferred(e as BeforeInstall);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBefore);
    if (isIos()) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBefore);
  }, []);

  if (blocked || (!visible && !iosHint)) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setIosHint(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar app"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        zIndex: 80,
        maxWidth: 420,
        margin: "0 auto",
        padding: 14,
        borderRadius: 14,
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="logo" size={18} color="var(--text-on-accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>Instalar YourCoach</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 3, lineHeight: 1.4 }}>
          {deferred
            ? "Acceso directo a la sesión de hoy desde la pantalla de inicio."
            : "En Safari: Compartir → Agregar a pantalla de inicio."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {deferred && (
            <Button size="sm" onClick={() => { void install(); }}>
              Instalar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
