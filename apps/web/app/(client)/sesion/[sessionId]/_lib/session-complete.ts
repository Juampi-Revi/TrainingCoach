const KEY_PREFIX = "regen_pending_complete_";

export type PendingSessionComplete = {
  sessionNotes?: string;
};

function key(sessionId: string) {
  return `${KEY_PREFIX}${sessionId}`;
}

export function savePendingComplete(sessionId: string, sessionNotes?: string): void {
  try {
    const notes = typeof sessionNotes === "string" ? sessionNotes : undefined;
    const payload: PendingSessionComplete = notes ? { sessionNotes: notes } : {};
    localStorage.setItem(key(sessionId), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readPendingComplete(sessionId: string): PendingSessionComplete | null {
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSessionComplete;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return null;
  }
}

export function clearPendingComplete(sessionId: string): void {
  try {
    localStorage.removeItem(key(sessionId));
  } catch {
    /* ignore */
  }
}

export function isClosedSessionStatus(status: string): boolean {
  return status === "completed" || status === "partial";
}

export function isNetworkCloseError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("status" in error && (error as { status: unknown }).status === 0) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}
