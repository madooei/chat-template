import { strongPasswordRequirements } from "../password";

describe("strongPasswordRequirements", () => {
  const findReq = (label: string) =>
    strongPasswordRequirements.find((r) => r.label === label)!;

  describe("At least 8 characters", () => {
    const req = findReq("At least 8 characters");

    it("passes for 8+ character password", () => {
      expect(req.test("abcdefgh")).toBe(true);
    });

    it("fails for shorter password", () => {
      expect(req.test("short")).toBe(false);
    });
  });

  describe("One lowercase letter", () => {
    const req = findReq("One lowercase letter");

    it("passes when lowercase present", () => {
      expect(req.test("Hello")).toBe(true);
    });

    it("fails when no lowercase", () => {
      expect(req.test("HELLO123")).toBe(false);
    });
  });

  describe("One uppercase letter", () => {
    const req = findReq("One uppercase letter");

    it("passes when uppercase present", () => {
      expect(req.test("Hello")).toBe(true);
    });

    it("fails when no uppercase", () => {
      expect(req.test("hello123")).toBe(false);
    });
  });

  describe("One number", () => {
    const req = findReq("One number");

    it("passes when digit present", () => {
      expect(req.test("abc1")).toBe(true);
    });

    it("fails when no digit", () => {
      expect(req.test("abcdef")).toBe(false);
    });
  });

  describe("One special character", () => {
    const req = findReq("One special character");

    it("passes when special char present", () => {
      expect(req.test("abc!")).toBe(true);
    });

    it("fails when no special char", () => {
      expect(req.test("abcABC123")).toBe(false);
    });
  });
});
