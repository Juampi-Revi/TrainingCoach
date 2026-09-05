"use client";

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  undo?: () => void;
}

interface ToastOpts {
  undo?: () => void;
}

interface ToastCtxValue {
  success: (msg: string, opts?: ToastOpts) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastCtx = createContext<ToastCtxValue | null>(null);

const BG: Record<ToastKind, string> = {
  success: "var(--accent)",
  error: "var(--danger)",
  info: "var(--bg-1)",
};

const COLOR: Record<ToastKind, string> = {
  success: "var(--text-on-accent)",
  error: "var(--text-on-danger)",
  info: "var(--text)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((kind: ToastKind, message: string, opts?: ToastOpts) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, kind, message, undo: opts?.undo }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), opts?.undo ? 5000 : 3500);
  }, []);

  const success = useCallback((msg: string, opts?: ToastOpts) => add("success", msg, opts), [add]);
  const error = useCallback((msg: string) => add("error", msg), [add]);
  const info = useCallback((msg: string) => add("info", msg), [add]);

  const value = useMemo(() => ({ success, error, info }), [success, error, info]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
          width: "calc(100% - 32px)",
          maxWidth: 420,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={t.kind === "success" ? "ta-save-ok" : undefined}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              background: BG[t.kind],
              color: COLOR[t.kind],
              border: t.kind === "info" ? "1px solid var(--line)" : "none",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "var(--shadow-md)",
              animation: "toastIn 0.18s ease",
              display: "flex",
              alignItems: "center",
              gap: 12,
              pointerEvents: t.undo ? "auto" : "none",
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Deshacer
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}
