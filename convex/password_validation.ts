import { ConvexError } from "convex/values";
import { INVALID_PASSWORD } from "./errors";

export function validatePasswordRequirements(password: string): void {
  if (password.length < 8) {
    throw new ConvexError(INVALID_PASSWORD);
  }

  if (process.env.NODE_ENV === "production") {
    if (!/[a-z]/.test(password)) {
      throw new ConvexError(INVALID_PASSWORD);
    }
    if (!/[A-Z]/.test(password)) {
      throw new ConvexError(INVALID_PASSWORD);
    }
    if (!/[0-9]/.test(password)) {
      throw new ConvexError(INVALID_PASSWORD);
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      throw new ConvexError(INVALID_PASSWORD);
    }
  }
}
