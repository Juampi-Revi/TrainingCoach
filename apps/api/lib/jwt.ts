import jwt from "jsonwebtoken";
import crypto from "crypto";

const EXPIRES_IN = "15m";        // Access token: short-lived
const REFRESH_EXPIRES_IN = "7d"; // Refresh token: longer-lived
const TWO_FACTOR_EXPIRES_IN = "5m";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required but not set");
  return secret;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  billingStatus: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function signTwoFactorToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TWO_FACTOR_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

/**
 * Generate a secure random refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Sign a refresh token JWT
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: REFRESH_EXPIRES_IN });
}

/**
 * Verify a refresh token JWT
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getSecret()) as RefreshTokenPayload;
}

/**
 * Hash a refresh token for storage (using SHA-256)
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
