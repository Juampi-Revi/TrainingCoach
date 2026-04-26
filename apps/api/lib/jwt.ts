import jwt from "jsonwebtoken";

export const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required but not set");
  return secret;
})();
const EXPIRES_IN = "30d";

export interface TokenPayload {
  sub: string;      // userId
  email: string;
  role: string;
  billingStatus: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
