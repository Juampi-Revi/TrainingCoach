import { describe, it, expect } from "vitest";
import { loginRequestSchema, sessionPatchSchema } from "./schemas";

describe("Auth Schemas", () => {
  describe("loginRequestSchema", () => {
    it("should validate valid credentials", () => {
      const result = loginRequestSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should reject invalid email", () => {
      const result = loginRequestSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = loginRequestSchema.safeParse({
        email: "test@example.com",
        password: "1234567",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Session Schemas", () => {
  describe("sessionPatchSchema", () => {
    it("should validate valid session update", () => {
      const result = sessionPatchSchema.safeParse({
        status: "completed",
        energyRating: 4,
        sessionNotes: "Great workout!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid energy rating", () => {
      const result = sessionPatchSchema.safeParse({
        energyRating: 6,
      });
      expect(result.success).toBe(false);
    });

    it("should reject completedAt before performedAt", () => {
      const result = sessionPatchSchema.safeParse({
        performedAt: "2024-01-15T10:00:00Z",
        completedAt: "2024-01-15T09:00:00Z",
      });
      expect(result.success).toBe(false);
    });
  });
});
