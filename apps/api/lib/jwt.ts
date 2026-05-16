import jwt from "jsonwebtoken";

const EXPIRES_IN = "30d";
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

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function signTwoFactorToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TWO_FACTOR_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}
