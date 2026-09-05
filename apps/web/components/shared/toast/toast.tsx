"use client";

import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastProps {
  id: string;
  kind: ToastKind;
  message: string;
  onDismiss: (id: string) => void;
}

const BG: Record<ToastKind, string> = {
  success: "var(--lime)",
  error: "var(--danger)",
  info: "var(--bg-1)",
};

const COLOR: Record<ToastKind, string> = {
  success: "var(--text-on-accent)",
  error: "var(--text-on-danger)",
  info: "var(--text)",
};

export function Toast({ id, kind, message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showT = setTimeout(() => setVisible(true), 0);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 180);
    }, 3500);
    return () => {
      clearTimeout(showT);
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  return (
    <div
      className={`toast toast-${kind} ${visible ? "visible" : ""}`}
      onClick={() => onDismiss(id)}
    >
      {message}
      <style jsx>{`
        .toast {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
          cursor: pointer;
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .toast.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .toast-success {
          background: var(--lime);
          color: var(--text-on-accent);
        }

        .toast-error {
          background: var(--danger);
          color: #fff;
        }

        .toast-info {
          background: var(--bg-1);
          color: var(--text);
          border: 1px solid var(--line);
        }
      `}</style>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Array<{ id: string; kind: ToastKind; message: string }>; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} id={t.id} kind={t.kind} message={t.message} onDismiss={onDismiss} />
      ))}
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
          width: calc(100% - 32px);
          max-width: 420px;
        }
      `}</style>
    </div>
  );
}
