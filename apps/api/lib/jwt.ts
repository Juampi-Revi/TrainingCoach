import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
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
