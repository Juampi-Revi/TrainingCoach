import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  rateLimit,
  getClientIP,
  getRateLimitConfig,
  generateRateLimitKey,
  clearRateLimits,
  RateLimits,
} from "./rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const config = { limit: 5, windowMs: 60000 };
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("test-key", config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("should block requests exceeding limit", () => {
      const config = { limit: 3, windowMs: 60000 };
      
      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-key", config);
      }
      
      // 4th request should be blocked
      const result = checkRateLimit("test-key", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset counter after window expires", async () => {
      const config = { limit: 2, windowMs: 100 }; // 100ms window for testing
      
      // Use up the limit
      checkRateLimit("test-key", config);
      checkRateLimit("test-key", config);
      
      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      // Should be allowed again
      const result = checkRateLimit("test-key", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should track different keys independently", () => {
      const config = { limit: 2, windowMs: 60000 };
      
      checkRateLimit("key-1", config);
      checkRateLimit("key-1", config);
      
      // key-2 should still have full limit
      const result = checkRateLimit("key-2", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe("rateLimit (legacy)", () => {
    it("should return true for allowed requests", () => {
      const result = rateLimit("legacy-key", 5, 60000);
      expect(result).toBe(true);
    });

    it("should return false for blocked requests", () => {
      // Use up the limit
      rateLimit("legacy-key", 2, 60000);
      rateLimit("legacy-key", 2, 60000);
      
      const result = rateLimit("legacy-key", 2, 60000);
      expect(result).toBe(false);
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from X-Forwarded-For header", () => {
      const req = new Request("http://localhost", {
        headers: {
          "X-Forwarded-For": "192.168.1.1, 10.0.0.1",
        },
      });
      
      expect(getClientIP(req)).toBe("192.168.1.1");
    });

    it("should extract IP from X-Real-IP header", () => {
      const req = new Request("http://localhost", {
        headers: {
          "X-Real-IP": "192.168.1.2",
        },
      });
      
      expect(getClientIP(req)).toBe("192.168.1.2");
    });

    it("should return unknown when no headers present", () => {
      const req = new Request("http://localhost");
      
      expect(getClientIP(req)).toBe("unknown");
    });

    it("should prefer X-Forwarded-For over X-Real-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "X-Forwarded-For": "10.0.0.1",
          "X-Real-IP": "192.168.1.1",
        },
      });
      
      expect(getClientIP(req)).toBe("10.0.0.1");
    });
  });

  describe("getRateLimitConfig", () => {
    it("should return strict limits for auth endpoints", () => {
      expect(getRateLimitConfig("/api/v1/auth/login", "POST")).toEqual(RateLimits.LOGIN);
      expect(getRateLimitConfig("/api/v1/auth/register", "POST")).toEqual(RateLimits.REGISTER);
      expect(getRateLimitConfig("/api/v1/auth/forgot-password", "POST")).toEqual(RateLimits.PASSWORD_RESET);
    });

    it("should return method-based limits for other endpoints", () => {
      expect(getRateLimitConfig("/api/v1/client/sessions", "GET")).toEqual(RateLimits.GET);
      expect(getRateLimitConfig("/api/v1/client/sessions", "POST")).toEqual(RateLimits.POST);
      expect(getRateLimitConfig("/api/v1/client/sessions/123", "PATCH")).toEqual(RateLimits.PATCH);
      expect(getRateLimitConfig("/api/v1/client/sessions/123", "DELETE")).toEqual(RateLimits.DELETE);
    });

    it("should return sync limits for sync endpoints", () => {
      expect(getRateLimitConfig("/api/v1/client/sync/garmin", "POST")).toEqual(RateLimits.SYNC);
    });

    it("should return upload limits for upload endpoints", () => {
      expect(getRateLimitConfig("/api/v1/auth/avatar", "POST")).toEqual(RateLimits.UPLOAD);
      expect(getRateLimitConfig("/api/v1/client/food/photo", "POST")).toEqual(RateLimits.UPLOAD);
    });

    it("should return default for unknown endpoints", () => {
      expect(getRateLimitConfig("/api/v1/unknown", "POST")).toEqual(RateLimits.POST);
    });
  });

  describe("generateRateLimitKey", () => {
    it("should generate key with IP only for auth endpoints", () => {
      const req = new Request("http://localhost/api/v1/auth/login", {
        headers: { "X-Forwarded-For": "192.168.1.1" },
      });
      
      const key = generateRateLimitKey(req, "/api/v1/auth/login");
      expect(key).toBe("ip:192.168.1.1");
    });

    it("should generate key with method, path, and IP for other endpoints", () => {
      const req = new Request("http://localhost/api/v1/client/sessions", {
        method: "GET",
        headers: { "X-Forwarded-For": "192.168.1.1" },
      });
      
      const key = generateRateLimitKey(req, "/api/v1/client/sessions");
      expect(key).toBe("get:/api/v1/client/sessions:192.168.1.1");
    });
  });
});
