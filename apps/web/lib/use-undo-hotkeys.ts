"use client";

import { useEffect } from "react";

/** Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) redo. Skips when typing in inputs. */
export function useUndoHotkeys(opts: {
  onUndo: () => void;
  onRedo: () => void;
  enabled?: boolean;
}) {
  const { onUndo, onRedo, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;

    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return target.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo();
        return;
      }
      if (key === "z") {
        e.preventDefault();
        onUndo();
        return;
      }
      if (key === "y" && e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onRedo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onUndo, onRedo]);
}
