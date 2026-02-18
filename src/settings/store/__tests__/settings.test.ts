import {
  $settings,
  updateSettings,
  getSettings,
  decodeSettings,
} from "../settings";

beforeEach(() => {
  $settings.set({ displayName: "", openRouterApiKey: "" });
});

describe("settings store", () => {
  it("starts with default values", () => {
    const settings = getSettings();
    expect(settings.displayName).toBe("");
    expect(settings.openRouterApiKey).toBe("");
  });

  it("updateSettings applies partial updates", () => {
    updateSettings({ displayName: "Alice" });

    const settings = getSettings();
    expect(settings.displayName).toBe("Alice");
    expect(settings.openRouterApiKey).toBe("");
  });

  it("updateSettings applies multiple fields", () => {
    updateSettings({ displayName: "Bob", openRouterApiKey: "key-123" });

    const settings = getSettings();
    expect(settings.displayName).toBe("Bob");
    expect(settings.openRouterApiKey).toBe("key-123");
  });

  it("getSettings returns current values", () => {
    updateSettings({ displayName: "Carol" });
    expect(getSettings().displayName).toBe("Carol");
  });

  describe("Zod decode safety", () => {
    it("returns defaults for invalid input", () => {
      expect(decodeSettings("not-valid")).toEqual({
        displayName: "",
        openRouterApiKey: "",
      });
    });
  });

  it("persistence roundtrip", () => {
    updateSettings({ displayName: "Dave", openRouterApiKey: "key-abc" });

    const stored = localStorage.getItem("settings");
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.displayName).toBe("Dave");
    expect(parsed.openRouterApiKey).toBe("key-abc");
  });
});
