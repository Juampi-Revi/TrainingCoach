const STALE_SESSION_MS = 4 * 60 * 60 * 1000;

export function resolveSessionClockStart(clockKey: string, performedAt: string): number {
  try {
    const stored = window.localStorage.getItem(clockKey);
    if (stored) {
      const n = Number(stored);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch { /* ignore */ }

  const performed = new Date(performedAt).getTime();
  const age = Date.now() - performed;
  const start = Number.isFinite(performed) && age >= 0 && age < STALE_SESSION_MS
    ? performed
    : Date.now();
  try { window.localStorage.setItem(clockKey, String(start)); } catch { /* ignore */ }
  return start;
}
