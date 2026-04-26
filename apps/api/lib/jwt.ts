import jwt from "jsonwebtoken";

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) throw new Error("JWT_SECRET environment variable is required but not set");
const SECRET: string = _jwtSecret;;
const EXPIRES_IN = "30d";

export interface TokenPayload {
  sub: string;      // userId
  email: string;
  role: string;
  billingStatus: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
