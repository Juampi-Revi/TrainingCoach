"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastCtxValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastCtx = createContext<ToastCtxValue | null>(null);

const BG: Record<ToastKind, string> = {
  success: "var(--lime)",
  error: "var(--danger)",
  info: "var(--bg-1)",
};

const COLOR: Record<ToastKind, string> = {
  success: "#0B0B0C",
  error: "#fff",
  info: "var(--text)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const success = useCallback((msg: string) => add("success", msg), [add]);
  const error = useCallback((msg: string) => add("error", msg), [add]);
  const info = useCallback((msg: string) => add("info", msg), [add]);

  return (
    <ToastCtx.Provider value={{ success, error, info }}>
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
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              background: BG[t.kind],
              color: COLOR[t.kind],
              border: t.kind === "info" ? "1px solid var(--line)" : "none",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
              animation: "toastIn 0.18s ease",
            }}
          >
            {t.message}
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
