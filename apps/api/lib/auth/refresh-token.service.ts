import { prisma } from "@/lib/prisma";
import { generateRefreshToken, hashRefreshToken } from "@/lib/jwt";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Generate and store a new refresh token for a user
 */
export async function createRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  // Generate a secure random token
  const token = generateRefreshToken();
  
  // Hash it for storage
  const tokenHash = hashRefreshToken(token);
  
  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  
  // Store in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: tokenHash,
      refreshTokenExpiry: expiresAt,
    },
  });
  
  return { token, expiresAt };
}

/**
 * Revoke a user's refresh token
 */
export async function revokeRefreshToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });
}

/**
 * Revoke all refresh tokens for a user (useful for security breaches)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await revokeRefreshToken(userId);
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.user.updateMany({
    where: {
      refreshTokenExpiry: {
        lt: new Date(),
      },
    },
    data: {
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });
  
  return result.count;
}
