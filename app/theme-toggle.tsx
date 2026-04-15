"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

function getThemeCookie(): Theme | null {
  const match = document.cookie
    .split("; ")
    .map((part) => part.trim())
    .find((part) => part.startsWith("theme="));
  if (!match) return null;
  const value = match.slice("theme=".length);
  if (value === "light" || value === "dark" || value === "system") return value;
  return null;
}

function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    const cookieValue = getThemeCookie();
    return cookieValue ?? "system";
  } catch {
    return "system";
  }
}

function subscribeThemeStore(callback: () => void) {
  function onStorage(e: StorageEvent) {
    if (e.key === "theme") callback();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener("themechange", callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("themechange", callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeThemeStore, getThemeSnapshot, () => "system");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function cycleTheme() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    applyTheme(next);
    window.dispatchEvent(new Event("themechange"));
  }

  const label = theme === "system" ? "Auto" : theme === "light" ? "Claro" : "Oscuro";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-[color:rgb(var(--card))] border-[color:rgb(var(--border))]"
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      <span className="text-[color:rgb(var(--muted))]">Tema</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
