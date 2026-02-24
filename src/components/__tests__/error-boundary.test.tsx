import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ErrorBoundary from "../error-boundary";

function ProblemChild() {
  throw new Error("Test explosion");
  return null;
}

function GoodChild() {
  return <div>All good</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows error UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
  });

  it("shows a Return home button", () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole("button", { name: "Return home" }),
    ).toBeInTheDocument();
  });

  it("navigates home on Return home click", async () => {
    const user = userEvent.setup();

    // Mock window.location.href
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "/some-page",
    });
    const hrefSetter = vi.fn();
    locationSpy.mockReturnValue(
      new Proxy(window.location, {
        set(_target, prop, value) {
          if (prop === "href") hrefSetter(value);
          return true;
        },
        get(target, prop) {
          if (prop === "href") return "/some-page";
          return Reflect.get(target, prop);
        },
      }),
    );

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Return home" }));

    expect(hrefSetter).toHaveBeenCalledWith("/");

    locationSpy.mockRestore();
  });
});
