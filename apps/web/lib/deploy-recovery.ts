"use client";

const DEPLOY_RECOVERY_KEY = "regen_deploy_recovery";
const DEPLOY_ERROR_PATTERNS = [
  /Failed to find Server Action/i,
  /older or newer deployment/i,
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
];

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join("\n");
  }
  return String(error ?? "");
}

export function shouldRecoverFromDeployMismatch(error: unknown): boolean {
  const text = getErrorText(error);
  return DEPLOY_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

export async function recoverFromDeployMismatch(error: unknown): Promise<boolean> {
  if (typeof window === "undefined" || !shouldRecoverFromDeployMismatch(error)) return false;

  const recoveryKey = `${DEPLOY_RECOVERY_KEY}:${window.location.pathname}`;
  try {
    if (window.sessionStorage.getItem(recoveryKey) === "1") {
      return false;
    }
    window.sessionStorage.setItem(recoveryKey, "1");
  } catch {
    // If storage is unavailable, continue with a best-effort reload.
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Ignore cleanup failures and still attempt a hard reload.
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("__deploy_recover", String(Date.now()));
  window.location.replace(nextUrl.toString());
  return true;
}
