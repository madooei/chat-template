import { testStorage } from "@/test/setup";
import {
  $settings,
  updateSettings,
  getSettings,
  decodeSettings,
} from "../settings";

beforeEach(() => {
  $settings.set({ displayName: "", geminiApiKey: "" });
});

describe("settings store", () => {
  it("starts with default values", () => {
    const settings = getSettings();
    expect(settings.displayName).toBe("");
    expect(settings.geminiApiKey).toBe("");
  });

  it("updateSettings applies partial updates", () => {
    updateSettings({ displayName: "Alice" });

    const settings = getSettings();
    expect(settings.displayName).toBe("Alice");
    expect(settings.geminiApiKey).toBe("");
  });

  it("updateSettings applies multiple fields", () => {
    updateSettings({ displayName: "Bob", geminiApiKey: "key-123" });

    const settings = getSettings();
    expect(settings.displayName).toBe("Bob");
    expect(settings.geminiApiKey).toBe("key-123");
  });

  it("getSettings returns current values", () => {
    updateSettings({ displayName: "Carol" });
    expect(getSettings().displayName).toBe("Carol");
  });

  describe("Zod decode safety", () => {
    it("returns defaults for malformed JSON", () => {
      expect(decodeSettings("not-json")).toEqual({
        displayName: "",
        geminiApiKey: "",
      });
    });
  });

  it("persistence roundtrip", () => {
    updateSettings({ displayName: "Dave", geminiApiKey: "key-abc" });

    const stored = testStorage["settings"];
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored);
    expect(parsed.displayName).toBe("Dave");
    expect(parsed.geminiApiKey).toBe("key-abc");
  });
});
