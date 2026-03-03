import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConvexError } from "convex/values";
import { INVALID_PASSWORD } from "./errors";

describe("validatePasswordRequirements", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.resetModules();
  });

  async function loadValidator() {
    const mod = await import("./password_validation");
    return mod.validatePasswordRequirements;
  }

  describe("dev mode (NODE_ENV !== production)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("accepts a password with 8 characters", async () => {
      const validate = await loadValidator();
      expect(() => validate("abcdefgh")).not.toThrow();
    });

    it("rejects a password shorter than 8 characters", async () => {
      const validate = await loadValidator();
      expect(() => validate("short")).toThrow(ConvexError);
    });

    it("accepts a simple 8-char password without special chars in dev", async () => {
      const validate = await loadValidator();
      expect(() => validate("alllower")).not.toThrow();
    });

    it("throws ConvexError with INVALID_PASSWORD data", async () => {
      const validate = await loadValidator();
      try {
        validate("short");
        expect.fail("Expected ConvexError");
      } catch (err) {
        expect(err).toBeInstanceOf(ConvexError);
        expect((err as ConvexError<string>).data).toBe(INVALID_PASSWORD);
      }
    });
  });

  describe("production mode (NODE_ENV === production)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("accepts a strong password", async () => {
      const validate = await loadValidator();
      expect(() => validate("Str0ng!pw")).not.toThrow();
    });

    it("rejects a password without uppercase", async () => {
      const validate = await loadValidator();
      expect(() => validate("str0ng!pw")).toThrow(ConvexError);
    });

    it("rejects a password without lowercase", async () => {
      const validate = await loadValidator();
      expect(() => validate("STR0NG!PW")).toThrow(ConvexError);
    });

    it("rejects a password without a digit", async () => {
      const validate = await loadValidator();
      expect(() => validate("Strong!pw")).toThrow(ConvexError);
    });

    it("rejects a password without a special character", async () => {
      const validate = await loadValidator();
      expect(() => validate("Str0ngpwd")).toThrow(ConvexError);
    });
  });
});
