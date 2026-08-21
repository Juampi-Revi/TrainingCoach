import crypto from "crypto";
import type { HealthProviderId } from "@regen/types";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

interface HealthOauthStatePayload {
  userId: string;
  provider: HealthProviderId;
  expiresAt: number;
}

function getOauthStateSecret(): string {
  const secret = process.env.HEALTH_OAUTH_STATE_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or HEALTH_OAUTH_STATE_SECRET is required");
  }
  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url<T>(input: string): T | null {
  try {
    return JSON.parse(Buffer.from(input, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getOauthStateSecret()).update(payload).digest("base64url");
}

export function createHealthOauthState(userId: string, provider: HealthProviderId): string {
  const payload = JSON.stringify({
    userId,
    provider,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
  } satisfies HealthOauthStatePayload);
  const encodedPayload = toBase64Url(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyHealthOauthState(
  state: string | null | undefined,
  expectedProvider: HealthProviderId,
): { userId: string; provider: HealthProviderId } | null {
  if (!state) return null;

  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  const payload = fromBase64Url<HealthOauthStatePayload>(encodedPayload);
  if (!payload) return null;
  if (payload.provider !== expectedProvider) return null;
  if (payload.expiresAt <= Date.now()) return null;

  return { userId: payload.userId, provider: payload.provider };
}
