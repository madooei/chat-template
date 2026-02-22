import { ConvexReactClient } from "convex/react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;

if (!CONVEX_URL) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Run `npx convex dev` to configure.",
  );
}

// For cloud deployments the site URL is derived by replacing .cloud with .site.
// For local deployments the ports differ (e.g. 3212 for data, 3213 for HTTP actions)
// so we read the explicit env var first.
export const CONVEX_SITE_URL =
  (import.meta.env.VITE_CONVEX_SITE_URL as string) ||
  CONVEX_URL.replace(/\.cloud\//, ".site/").replace(/\.cloud$/, ".site");

export const convex = new ConvexReactClient(CONVEX_URL);
