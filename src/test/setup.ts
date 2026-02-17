import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { setPersistentEngine } from "@nanostores/persistent";
import { afterEach, vi } from "vitest";

// Use a plain object as storage engine because jsdom's localStorage
// proxy doesn't support the bracket-notation assignment that
// @nanostores/persistent uses internally (storageEngine[key] = value).
export const testStorage: Record<string, string> = {};

setPersistentEngine(testStorage, {
  addEventListener() {},
  removeEventListener() {},
});

// Radix UI uses ResizeObserver which jsdom doesn't provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

let uuidCounter = 0;

vi.stubGlobal(
  "crypto",
  new Proxy(globalThis.crypto ?? {}, {
    get(target, prop) {
      if (prop === "randomUUID") {
        return () => `test-uuid-${++uuidCounter}`;
      }
      return Reflect.get(target, prop);
    },
  }),
);

afterEach(() => {
  cleanup();
  for (const key of Object.keys(testStorage)) {
    delete testStorage[key];
  }
  uuidCounter = 0;
});
