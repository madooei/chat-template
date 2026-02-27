import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ErrorFallback } from "../error-boundary";

describe("ErrorFallback", () => {
  it("shows error message from an Error object", () => {
    render(
      <ErrorFallback
        error={new Error("Test explosion")}
        resetError={() => {}}
      />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
  });

  it("shows default message for non-Error values", () => {
    render(<ErrorFallback error="string error" resetError={() => {}} />);

    expect(
      screen.getByText("An unexpected error occurred."),
    ).toBeInTheDocument();
  });

  it("shows a Return home button", () => {
    render(
      <ErrorFallback
        error={new Error("Test explosion")}
        resetError={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Return home" }),
    ).toBeInTheDocument();
  });

  it("calls resetError and navigates home on click", async () => {
    const user = userEvent.setup();
    const resetError = vi.fn();

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
      <ErrorFallback
        error={new Error("Test explosion")}
        resetError={resetError}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Return home" }));

    expect(resetError).toHaveBeenCalled();
    expect(hrefSetter).toHaveBeenCalledWith("/");

    locationSpy.mockRestore();
  });
});
