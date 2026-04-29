import crypto from "crypto";

interface SseToken {
  userId: string;
  expiresAt: number;
}

const store = new Map<string, SseToken>();

// Clean expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, t] of store) {
    if (t.expiresAt <= now) store.delete(key);
  }
}, 60_000).unref();

export function createSseToken(userId: string): string {
  const token = crypto.randomBytes(24).toString("hex");
  store.set(token, { userId, expiresAt: Date.now() + 60_000 }); // 60s TTL
  return token;
}

export function consumeSseToken(token: string): string | null {
  const entry = store.get(token);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  store.delete(token); // one-time use
  return entry.userId;
}
