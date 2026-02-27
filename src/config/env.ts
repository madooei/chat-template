export const BASE_URL: string = import.meta.env.VITE_BASE_URL || "";

export const AUTH_MODE: "anonymous" | "password" =
  import.meta.env.VITE_AUTH_MODE === "password" ? "password" : "anonymous";

export const SENTRY_DSN: string = import.meta.env.VITE_SENTRY_DSN || "";
