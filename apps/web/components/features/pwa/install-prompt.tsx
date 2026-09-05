"use client";

import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/ui";

const VISITS_KEY = "regen_pwa_visits";
const DISMISS_KEY = "regen_pwa_install_dismissed";
const MIN_VISITS = 3;

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia?.("(display-mode: standalone)");
  return mq?.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      if (visits < MIN_VISITS) return;
    } catch {
      return;
    }

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstall);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBefore);

    if (isIos()) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBefore);
  }, []);

  if (isStandalone() || (!show && !iosHint)) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
    setIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
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
